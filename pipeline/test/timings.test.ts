import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { readTimings, recordTiming, recordVerifyRun } from "../src/io/timings.ts"

const tmp = () => mkdtempSync(join(tmpdir(), "varde-timings-"))

describe("stage timings", () => {
	it("merges each stage's time into timings.json, sorted, the newest time per stage winning", () => {
		const dir = tmp()
		expect(readTimings(dir)).toEqual({})
		recordTiming(dir, "verify", 1_500.4)
		recordTiming(dir, "fetch", 60_000)
		recordTiming(dir, "verify", 2_000)
		expect(readTimings(dir)).toEqual({ fetch: 60_000, verify: 2_000 })
		const text = readFileSync(join(dir, "timings.json"), "utf8")
		expect(Object.keys(JSON.parse(text))).toEqual(["fetch", "verify"])
		expect(readdirSync(dir)).toEqual(["timings.json"])
	})

	it("rounds to whole milliseconds", () => {
		const dir = tmp()
		recordTiming(dir, "extract", 1_500.4)
		expect(readTimings(dir)).toEqual({ extract: 1_500 })
	})

	it("starts over from a file that does not parse or does not fit", () => {
		const dir = tmp()
		writeFileSync(join(dir, "timings.json"), "{ ikke json")
		expect(readTimings(dir)).toEqual({})
		writeFileSync(join(dir, "timings.json"), JSON.stringify({ fetch: "lenge" }))
		expect(readTimings(dir)).toEqual({})
		recordTiming(dir, "extract", 10)
		expect(readTimings(dir)).toEqual({ extract: 10 })
	})
})

describe("recordVerifyRun", () => {
	const stats = (dir: string) => JSON.parse(readFileSync(join(dir, "verify-stats.json"), "utf8"))

	it("replaces the numbers on a full run and adds to them on a resume", () => {
		const dir = tmp()
		recordVerifyRun(dir, { lookups: 40, hits: 30, ms: 1_000 }, { resume: false, offline: false })
		expect(stats(dir)).toEqual({ lookups: 40, hits: 30 })
		recordVerifyRun(dir, { lookups: 5, hits: 2, ms: 500 }, { resume: true, offline: false })
		expect(stats(dir)).toEqual({ lookups: 45, hits: 32 })
		expect(readTimings(dir).verify).toBe(1_500)
		recordVerifyRun(dir, { lookups: 1, hits: 1, ms: 10 }, { resume: false, offline: false })
		expect(stats(dir)).toEqual({ lookups: 1, hits: 1 })
		expect(readTimings(dir).verify).toBe(10)
	})

	it("writes nothing offline, full or resumed", () => {
		const dir = tmp()
		recordVerifyRun(dir, { lookups: 40, hits: 30, ms: 1_000 }, { resume: false, offline: false })
		recordVerifyRun(dir, { lookups: 0, hits: 0, ms: 5 }, { resume: false, offline: true })
		recordVerifyRun(dir, { lookups: 0, hits: 0, ms: 5 }, { resume: true, offline: true })
		expect(stats(dir)).toEqual({ lookups: 40, hits: 30 })
		expect(readTimings(dir).verify).toBe(1_000)
	})
})
