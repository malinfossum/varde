import { createHash } from "node:crypto"
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { z } from "zod"
import { ADAPTER_NAMES, type AdapterName } from "../adapters/types.ts"
import type { Fetched } from "../net/crawler.ts"
import { HttpsUrl, UtcTimestamp } from "../schema/common.ts"
import { writeFileAtomic, writeJsonAtomic } from "./files.ts"

// Raw pages can hold staff names, so a local cache keeps them 90 days at most.
export const MAX_AGE_DAYS = 90
const DAY_MS = 86_400_000
const PAGE_FILE = /^[0-9a-f]{32}\.html$/

export const ManifestEntry = z.strictObject({
	url: HttpsUrl,
	finalUrl: HttpsUrl,
	status: z.number().int(),
	contentType: z.string(),
	fetchedAt: UtcTimestamp,
	contentHash: z.string().regex(/^sha256:[0-9a-f]{64}$/),
	file: z.string().regex(PAGE_FILE),
	adapter: z.enum(ADAPTER_NAMES).optional(),
	textLength: z.number().int().nonnegative().optional(),
})
export type ManifestEntry = z.infer<typeof ManifestEntry>
const Manifest = z.strictObject({ entries: z.array(ManifestEntry) })

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex")
const byUrl = (a: ManifestEntry, b: ManifestEntry) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0)

// Raw pages plus a manifest: URL, status, final URL, fetch time and content hash. Locally the
// folder is .cache/pages/ (gitignored); in Actions it is the job's temporary folder. Page text
// is never printed and never goes into the manifest.
export class PageCache {
	readonly dir: string
	readonly #dryRun: boolean
	readonly #entries = new Map<string, ManifestEntry>()

	constructor(dir: string, options: { dryRun?: boolean } = {}) {
		this.dir = dir
		this.#dryRun = options.dryRun ?? false
		const path = join(dir, "manifest.json")
		if (!existsSync(path)) return
		let data: unknown
		try {
			data = JSON.parse(readFileSync(path, "utf8"))
		} catch {
			return
		}
		// A manifest that does not parse is started over: pages are cheap to fetch again.
		const parsed = Manifest.safeParse(data)
		if (parsed.success) for (const e of parsed.data.entries) this.#entries.set(e.url, e)
	}

	put(page: Fetched, extra: { adapter?: AdapterName; textLength?: number } = {}): ManifestEntry {
		const entry: ManifestEntry = {
			url: page.url,
			finalUrl: page.finalUrl,
			status: page.status,
			contentType: page.contentType,
			fetchedAt: page.fetchedAt,
			contentHash: `sha256:${sha256(page.body)}`,
			file: `${sha256(page.url).slice(0, 32)}.html`,
			...extra,
		}
		if (!this.#dryRun) writeFileAtomic(join(this.dir, entry.file), page.body)
		this.#entries.set(page.url, entry)
		return entry
	}

	get(url: string): ManifestEntry | undefined {
		return this.#entries.get(url)
	}

	// The page only when it is the one the manifest describes: a run that stopped between
	// writing a page and saving the manifest leaves a page whose hash no longer matches.
	read(entry: ManifestEntry): string | undefined {
		const path = join(this.dir, entry.file)
		if (!existsSync(path)) return undefined
		const body = readFileSync(path, "utf8")
		return `sha256:${sha256(body)}` === entry.contentHash ? body : undefined
	}

	entries(): ManifestEntry[] {
		return [...this.#entries.values()].sort(byUrl)
	}

	save(): void {
		if (!this.#dryRun) writeJsonAtomic(join(this.dir, "manifest.json"), { entries: this.entries() })
	}

	// Drops entries fetched more than 90 days ago, and deletes every page file no entry keeps
	// (old pages, and leftovers from a run that stopped halfway).
	purge(nowMs: number): number {
		if (this.#dryRun || !existsSync(this.dir)) return 0
		const cutoff = nowMs - MAX_AGE_DAYS * DAY_MS
		const keep = new Set<string>()
		for (const [url, e] of this.#entries) {
			if (Date.parse(e.fetchedAt) < cutoff) this.#entries.delete(url)
			else keep.add(e.file)
		}
		let removed = 0
		for (const name of readdirSync(this.dir)) {
			const stale = (PAGE_FILE.test(name) && !keep.has(name)) || name.endsWith(".tmp")
			if (stale) {
				rmSync(join(this.dir, name))
				removed++
			}
		}
		return removed
	}
}
