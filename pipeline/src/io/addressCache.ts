import { createHash } from "node:crypto"
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import { z } from "zod"
import { isoSeconds } from "../net/clock.ts"
import type { AddressRecord } from "../registers/kartverket.ts"
import { UtcTimestamp } from "../schema/common.ts"
import { normaliseText } from "../text/normalise.ts"
import { writeJsonAtomic } from "./files.ts"
import { OfflineMissError } from "./offline.ts"
import { DAY_MS, MAX_AGE_DAYS } from "./pageCache.ts"

// A Kartverket answer is used for 30 days, then asked again (spec, "Kartverket pace and cache").
export const ADDRESS_MAX_AGE_DAYS = 30
const ANSWER_FILE = /^[0-9a-f]{64}\.json$/

const CachedAnswer = z.strictObject({
	cachedAt: UtcTimestamp,
	records: z.array(
		z.strictObject({
			addressId: z.string(),
			kommune: z.string(),
			text: z.string(),
			postcode: z.string().optional(),
			poststed: z.string().optional(),
		})
	),
})
type CachedAnswer = z.infer<typeof CachedAnswer>

// Kartverket's answers on disk, next to the page cache (<cache>/kartverket/), one file per search
// and kommune. The search is page text and can hold a name, or a character a Windows file name
// cannot, so each file is named by the sha256 of the normalised key, never the key itself. Only
// an answer that parsed is written, an empty one included: a 503 or a timeout never pins a wrong
// answer for 30 days. Offline, any age counts and a miss is an error. Locally the folder is
// gitignored like the rest of .cache/; in Actions it is the job's temporary folder.
export class AddressCache {
	readonly dir: string
	lookups = 0
	hits = 0
	readonly #offline: boolean
	readonly #dryRun: boolean
	readonly #now: () => number

	constructor(
		dir: string,
		options: { offline?: boolean; dryRun?: boolean; now?: () => number } = {}
	) {
		this.dir = dir
		this.#offline = options.offline ?? false
		this.#dryRun = options.dryRun ?? false
		this.#now = options.now ?? Date.now
	}

	// The cached records for a search, when fresh (any age offline). Each call counts a lookup.
	read(search: string, kommune: string): AddressRecord[] | undefined {
		this.lookups++
		const answer = this.#load(this.#path(search, kommune))
		if (answer !== undefined && (this.#offline || this.#fresh(answer))) {
			this.hits++
			return answer.records
		}
		if (this.#offline) {
			throw new OfflineMissError(`address search "${search}" in kommune ${kommune}`)
		}
		return undefined
	}

	write(search: string, kommune: string, records: readonly AddressRecord[]): void {
		if (this.#dryRun) return
		writeJsonAtomic(this.#path(search, kommune), {
			cachedAt: isoSeconds(this.#now()),
			records,
		})
	}

	// Deletes answers cached over 90 days ago (the page cache's limit), answer files that do not
	// parse (their age is unknown), and .tmp leftovers from a write that stopped halfway.
	purge(nowMs: number): number {
		if (this.#dryRun || !existsSync(this.dir)) return 0
		const cutoff = nowMs - MAX_AGE_DAYS * DAY_MS
		let removed = 0
		for (const name of readdirSync(this.dir)) {
			let stale = name.endsWith(".tmp")
			if (ANSWER_FILE.test(name)) {
				const answer = this.#load(join(this.dir, name))
				stale = answer === undefined || Date.parse(answer.cachedAt) < cutoff
			}
			if (stale) {
				rmSync(join(this.dir, name))
				removed++
			}
		}
		return removed
	}

	#path(search: string, kommune: string): string {
		const key = `${kommune}\n${normaliseText(search)}`
		return join(this.dir, `${createHash("sha256").update(key).digest("hex")}.json`)
	}

	#fresh(answer: CachedAnswer): boolean {
		return this.#now() - Date.parse(answer.cachedAt) < ADDRESS_MAX_AGE_DAYS * DAY_MS
	}

	// A file that is missing or does not parse is a miss. Its text is never printed.
	#load(path: string): CachedAnswer | undefined {
		if (!existsSync(path)) return undefined
		try {
			const parsed = CachedAnswer.safeParse(JSON.parse(readFileSync(path, "utf8")))
			return parsed.success ? parsed.data : undefined
		} catch {
			return undefined
		}
	}
}
