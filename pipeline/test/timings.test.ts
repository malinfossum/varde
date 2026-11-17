import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { readTimings, recordTiming } from "../src/io/timings.ts"

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
