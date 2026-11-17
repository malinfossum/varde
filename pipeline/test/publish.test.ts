import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { checkData } from "../src/check/dataCheck.ts"

// A repo root with an empty data/ and, when given, pipeline/test/known-wrong.json.
function repo(knownWrong?: unknown): string {
	const root = mkdtempSync(join(tmpdir(), "varde-publish-"))
	mkdirSync(join(root, "data", "curated"), { recursive: true })
	mkdirSync(join(root, "data", "lock"), { recursive: true })
	if (knownWrong !== undefined) {
		mkdirSync(join(root, "pipeline", "test"), { recursive: true })
		writeFileSync(
			join(root, "pipeline", "test", "known-wrong.json"),
			typeof knownWrong === "string" ? knownWrong : JSON.stringify(knownWrong)
		)
	}
	return root
}
const ENTRY = { kind: "disagreement", keyId: 12, unitId: "org:999999999", field: "phone" }

describe("data:check --publish", () => {
	it("fails while known-wrong.json has an entry", () => {
		expect(checkData(repo({ entries: [ENTRY] }), { publish: true })).toEqual([
			"known-wrong.json lists 1 value: nothing may be published while it has an entry",
		])
		const two = { entries: [ENTRY, { ...ENTRY, keyId: 13 }] }
		expect(checkData(repo(two), { publish: true })).toEqual([
			"known-wrong.json lists 2 values: nothing may be published while it has an entry",
		])
	})

	it("passes with an empty list", () => {
		expect(checkData(repo({ entries: [] }), { publish: true })).toEqual([])
	})

	it("changes nothing without --publish", () => {
		expect(checkData(repo({ entries: [ENTRY] }))).toEqual([])
		expect(checkData(repo({ entries: [ENTRY] }), { publish: false })).toEqual([])
	})

	it("fails on a missing or broken list, naming the file and never its text", () => {
		expect(checkData(repo(), { publish: true })).toEqual(["known-wrong.json is missing"])
		const problems = checkData(repo("{ Kari Nordmann"), { publish: true })
		expect(problems).toEqual(["known-wrong.json is not valid JSON"])
	})
})
