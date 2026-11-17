import { createHash } from "node:crypto"
import {
	appendFileSync,
	existsSync,
	readdirSync,
	readFileSync,
	rmSync,
	truncateSync,
} from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { z } from "zod"
import { ADAPTER_NAMES, type AdapterName } from "../adapters/types.ts"
import type { Fetched } from "../net/crawler.ts"
import { HttpsUrl, UtcTimestamp } from "../schema/common.ts"
import { writeFileAtomic, writeJsonAtomic } from "./files.ts"

// The cache folder when a command gets no --cache: .cache/ at the repo root, gitignored.
export const DEFAULT_CACHE_DIR = fileURLToPath(new URL("../../../.cache/", import.meta.url))

// Raw pages can hold staff names, so a local cache keeps them 90 days at most.
export const MAX_AGE_DAYS = 90
export const DAY_MS = 86_400_000
const PAGE_FILE = /^[0-9a-f]{32}\.html$/
// A fetch run's id. randomUUID() gives 36 of these characters.
const RUN_ID = /^[0-9a-z-]{8,40}$/
const JOURNAL = "manifest.jsonl"

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
	// The fetch run that stored the page, so fetch --resume skips it whatever its age.
	runId: z.string().regex(RUN_ID).optional(),
})
export type ManifestEntry = z.infer<typeof ManifestEntry>
const Manifest = z.strictObject({ entries: z.array(ManifestEntry) })
const RunFile = z.strictObject({ runId: z.string().regex(RUN_ID) })

const sha256 = (text: string) => createHash("sha256").update(text).digest("hex")
const byUrl = (a: ManifestEntry, b: ManifestEntry) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0)

function checkRunId(runId: string): void {
	if (!RUN_ID.test(runId))
		throw new Error("a run id is 8 to 40 lowercase letters, digits or hyphens")
}

// The run a fetch started without --resume, from <pages>/run.json. undefined when there is none
// or it does not parse; the file is never printed.
export function readRunId(dir: string): string | undefined {
	const path = join(dir, "run.json")
	if (!existsSync(path)) return undefined
	try {
		const parsed = RunFile.safeParse(JSON.parse(readFileSync(path, "utf8")))
		return parsed.success ? parsed.data.runId : undefined
	} catch {
		return undefined
	}
}

export function writeRunId(dir: string, runId: string): void {
	checkRunId(runId)
	writeJsonAtomic(join(dir, "run.json"), { runId })
}

// Raw pages plus their index: URL, status, final URL, fetch time, content hash and run id.
// Locally the folder is .cache/pages/ (gitignored); in Actions it is the job's temporary folder.
// Page text is never printed and never goes into the index.
//
// The index is a journal. Each stored page appends one JSON line to manifest.jsonl, so a run
// that stops loses only the pages in flight, and no file is rewritten per page (on Windows a
// rename onto a file Defender holds open can fail and end the run). Loading reads manifest.json,
// then folds the journal over it in order, the later line winning per URL. A line that does not
// parse (cut off by a stop) or does not fit an entry is skipped. read() still checks each page
// against its hash. save() writes manifest.json once and empties the journal.
export class PageCache {
	readonly dir: string
	readonly #dryRun: boolean
	readonly #runId: string | undefined
	readonly #entries = new Map<string, ManifestEntry>()
	// False when the journal on disk ends in a cut-off line: the next line then starts with a
	// line break of its own, so the cut-off text cannot swallow it.
	#journalEndsClean = true

	constructor(dir: string, options: { dryRun?: boolean; runId?: string } = {}) {
		this.dir = dir
		this.#dryRun = options.dryRun ?? false
		if (options.runId !== undefined) checkRunId(options.runId)
		this.#runId = options.runId
		this.#loadManifest()
		this.#foldJournal()
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
			...(this.#runId === undefined ? {} : { runId: this.#runId }),
		}
		if (!this.#dryRun) {
			// The page first, then its line. A stop between the two leaves a page no line describes:
			// for a new URL purge removes it later, and for a URL fetched before, the old line's hash
			// no longer matches, so read() refuses the page and --resume fetches it again.
			writeFileAtomic(join(this.dir, entry.file), page.body)
			const lead = this.#journalEndsClean ? "" : "\n"
			appendFileSync(join(this.dir, JOURNAL), `${lead}${JSON.stringify(entry)}\n`)
			this.#journalEndsClean = true
		}
		this.#entries.set(page.url, entry)
		return entry
	}

	get(url: string): ManifestEntry | undefined {
		return this.#entries.get(url)
	}

	// The page only when it is the one its entry describes: a run that stopped between writing a
	// page and its journal line leaves a page whose hash no longer matches.
	read(entry: ManifestEntry): string | undefined {
		const path = join(this.dir, entry.file)
		if (!existsSync(path)) return undefined
		const body = readFileSync(path, "utf8")
		return `sha256:${sha256(body)}` === entry.contentHash ? body : undefined
	}

	entries(): ManifestEntry[] {
		return [...this.#entries.values()].sort(byUrl)
	}

	// manifest.json then holds every entry, so the journal starts over.
	save(): void {
		if (this.#dryRun) return
		writeJsonAtomic(join(this.dir, "manifest.json"), { entries: this.entries() })
		const journal = join(this.dir, JOURNAL)
		if (existsSync(journal)) truncateSync(journal, 0)
		this.#journalEndsClean = true
	}

	// Drops entries fetched more than 90 days ago, and deletes every page file no entry keeps
	// (old pages, and leftovers from a run that stopped halfway). Every command purges before it
	// puts, and save() writes what is left. The journal file stays: it is no page file, and a line
	// for a purged page loads again only to be purged again, its file already gone.
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

	// A manifest that does not parse is started over: pages are cheap to fetch again.
	#loadManifest(): void {
		const path = join(this.dir, "manifest.json")
		if (!existsSync(path)) return
		let data: unknown
		try {
			data = JSON.parse(readFileSync(path, "utf8"))
		} catch {
			return
		}
		const parsed = Manifest.safeParse(data)
		if (parsed.success) for (const e of parsed.data.entries) this.#entries.set(e.url, e)
	}

	#foldJournal(): void {
		const path = join(this.dir, JOURNAL)
		if (!existsSync(path)) return
		const text = readFileSync(path, "utf8")
		this.#journalEndsClean = text === "" || text.endsWith("\n")
		for (const line of text.split("\n")) {
			if (line.trim() === "") continue
			let data: unknown
			try {
				data = JSON.parse(line)
			} catch {
				continue
			}
			const parsed = ManifestEntry.safeParse(data)
			if (parsed.success) this.#entries.set(parsed.data.url, parsed.data)
		}
	}
}
