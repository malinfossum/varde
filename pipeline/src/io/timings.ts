import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { z } from "zod"
import { writeJsonAtomic } from "./files.ts"

// How long each stage took, in milliseconds, by stage name. It lives in the cache folder, never
// in the report: a duration changes on every run, and the report must not. score --pr-body reads
// it for the PR body's scale numbers.
const Timings = z.record(z.string(), z.number().int().nonnegative())
const FILE = "timings.json"

// {} when the file is missing, does not parse or does not fit: the next stage starts it over.
export function readTimings(cacheDir: string): Record<string, number> {
	const path = join(cacheDir, FILE)
	if (!existsSync(path)) return {}
	try {
		const parsed = Timings.safeParse(JSON.parse(readFileSync(path, "utf8")))
		return parsed.success ? parsed.data : {}
	} catch {
		return {}
	}
}

// Sets one stage's time and writes the file whole, its keys sorted.
export function recordTiming(cacheDir: string, stage: string, ms: number): void {
	const timings = { ...readTimings(cacheDir), [stage]: Math.max(0, Math.round(ms)) }
	const sorted = Object.fromEntries(
		Object.entries(timings).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
	)
	writeJsonAtomic(join(cacheDir, FILE), sorted)
}
