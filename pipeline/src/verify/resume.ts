import { existsSync, readFileSync } from "node:fs"
import { extractionPath } from "../extract/extract.ts"
import { sha256Of } from "../io/files.ts"
import { LockFile, type LockInputs } from "../schema/lock.ts"
import { RULES_VERSION } from "./rules.ts"
import { findCuratedPath, lockPath, VerifyError } from "./verify.ts"

// The file's bytes hashed, or undefined when there is no file.
export function sha256File(path: string): string | undefined {
	return existsSync(path) ? sha256Of(readFileSync(path)) : undefined
}

// Everything verify reads for a kommune, by hash: its extraction file, the national file, its
// curated file, the NKLM edition and the rules. A resume compares these, never file times: a
// checkout gives every file a new time, and a gate change leaves every file alone.
export function lockInputs(o: {
	cacheDir: string
	dataDir: string
	kommune: string
	nklmDate?: string
}): LockInputs {
	const extraction = sha256File(extractionPath(o.cacheDir, o.kommune))
	if (extraction === undefined)
		throw new VerifyError(`${o.kommune}: no extraction file (run extract first)`)
	const national = sha256File(extractionPath(o.cacheDir, "national"))
	const curatedAt = findCuratedPath(o.dataDir, o.kommune)
	const curated = curatedAt === undefined ? undefined : sha256File(curatedAt)
	return {
		extraction,
		...(national === undefined ? {} : { national }),
		...(curated === undefined ? {} : { curated }),
		...(o.nklmDate === undefined ? {} : { nklm: o.nklmDate }),
		rules: RULES_VERSION,
	}
}

// True only when the kommune's lock parses, is not a failed lock, and was written from exactly
// these inputs, key by key (a key absent on both sides counts as equal). A failed lock is always
// written again: its reason comes from the crawl report, which is not an input, and it costs
// nothing.
export function canSkip(dataDir: string, kommune: string, inputs: LockInputs): boolean {
	const path = lockPath(dataDir, kommune)
	if (!existsSync(path)) return false
	let data: unknown
	try {
		data = JSON.parse(readFileSync(path, "utf8"))
	} catch {
		return false
	}
	const parsed = LockFile.safeParse(data)
	if (!parsed.success || parsed.data.kommune !== kommune || parsed.data.failed !== undefined)
		return false
	const had: Record<string, unknown> = parsed.data.inputs
	const now: Record<string, unknown> = inputs
	const keys = new Set([...Object.keys(had), ...Object.keys(now)])
	return [...keys].every((key) => had[key] === now[key])
}

// The kommuner a resumed run verifies, and the ones it skips. A kommune with no extraction file
// stays in todo, so the run still names it ("run extract first").
export function splitResume<K extends { kommune: string }>(
	kommuner: readonly K[],
	o: { cacheDir: string; dataDir: string; nklmDate?: string }
): { todo: K[]; skipped: K[] } {
	const todo: K[] = []
	const skipped: K[] = []
	for (const k of kommuner) {
		const extracted = existsSync(extractionPath(o.cacheDir, k.kommune))
		if (extracted && canSkip(o.dataDir, k.kommune, lockInputs({ ...o, kommune: k.kommune })))
			skipped.push(k)
		else todo.push(k)
	}
	return { todo, skipped }
}
