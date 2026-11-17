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

const VerifyStats = z.strictObject({
	lookups: z.number().int().nonnegative(),
	hits: z.number().int().nonnegative(),
})
const STATS = "verify-stats.json"

// verify's Kartverket counts and its time, for the PR body. A full online run replaces the
// earlier numbers; a resumed one adds to them, the way fetch adds its time, so a verify that
// stopped on a Kartverket error and went on with --resume counts every lookup once. Offline the
// answers come from the cache and the time is no measure, so nothing is written. Counts only.
export function recordVerifyRun(
	cacheDir: string,
	run: { lookups: number; hits: number; ms: number },
	mode: { resume: boolean; offline: boolean }
): void {
	if (mode.offline) return
	const path = join(cacheDir, STATS)
	let before = { lookups: 0, hits: 0 }
	if (mode.resume && existsSync(path)) {
		try {
			const parsed = VerifyStats.safeParse(JSON.parse(readFileSync(path, "utf8")))
			if (parsed.success) before = parsed.data
		} catch {
			// A broken file starts over, as readTimings does.
		}
	}
	writeJsonAtomic(path, { lookups: before.lookups + run.lookups, hits: before.hits + run.hits })
	const earlier = mode.resume ? (readTimings(cacheDir).verify ?? 0) : 0
	recordTiming(cacheDir, "verify", earlier + run.ms)
}
