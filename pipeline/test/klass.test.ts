import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { KOMMUNE_NUMBERS } from "../src/answerKey/freeze.ts"
import { AnswerKey } from "../src/answerKey/schema.ts"
import {
	changesQuery,
	codesAtQuery,
	kommuneNameMismatches,
	parseChanges,
	parseCodesAt,
	renumberings,
} from "../src/registers/klass.ts"

const read = (path: string): unknown =>
	JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"))
const kommuner = parseCodesAt(read("./fixtures/klass/codes-at-2026-11-03.json")) ?? []

describe("parseCodesAt", () => {
	it("reads the kommuner, keeps Oslo's leading zero and drops 9999", () => {
		expect(kommuner).toHaveLength(47)
		expect(kommuner.filter((k) => k.code.startsWith("34"))).toHaveLength(46)
		expect(kommuner.find((k) => k.code === "0301")).toEqual({ code: "0301", name: "Oslo" })
		expect(kommuner.some((k) => k.code === "9999")).toBe(false)
	})

	it("refuses a body that is not a KLASS code list", () => {
		expect(parseCodesAt({ feil: "x" })).toBeUndefined()
	})
})

describe("the kommune number against the kommune name", () => {
	it("finds PR 1's hand-typed kommune numbers in KLASS under the same names", () => {
		expect(kommuneNameMismatches(KOMMUNE_NUMBERS, kommuner)).toEqual([])
	})

	it("catches a number given the wrong name, and one KLASS does not know", () => {
		expect(kommuneNameMismatches({ Hamar: "3405", Atlantis: "3499" }, kommuner)).toEqual([
			"Hamar: KLASS names 3405 Lillehammer",
			"Atlantis: 3499 is not a kommune in KLASS",
		])
	})

	it("finds every kommune the answer key names in KLASS", () => {
		const key = AnswerKey.parse(read("./answer-key.json"))
		const codes = new Set(kommuner.map((k) => k.code))
		const named = key.rows.flatMap((r) => [
			...(r.kommune === null ? [] : [r.kommune]),
			...r.servedKommuner,
		])
		expect(named.filter((code) => !codes.has(code))).toEqual([])
	})
})

describe("KLASS changes", () => {
	const changes = parseChanges({
		codeChanges: [
			{
				oldCode: "0301",
				oldName: "Oslo",
				oldShortName: "",
				newCode: "0301",
				newName: "Oslo - Oslove",
				newShortName: "",
				changeOccurred: "2026-01-01",
			},
			{
				oldCode: "3499",
				oldName: "Eksempel",
				oldShortName: "",
				newCode: "3498",
				newName: "Eksempel",
				newShortName: "",
				changeOccurred: "2027-01-01",
			},
		],
	})

	it("counts a new number as a change to review, and a new name alone as none", () => {
		expect(renumberings(changes ?? []).map((c) => c.oldCode)).toEqual(["3499"])
	})

	it("asks KLASS in JSON-friendly URLs", () => {
		expect(codesAtQuery("2026-11-03")).toBe(
			"https://data.ssb.no/api/klass/v1/classifications/131/codesAt?date=2026-11-03"
		)
		expect(changesQuery("2025-01-01", "2026-11-03")).toBe(
			"https://data.ssb.no/api/klass/v1/classifications/131/changes?from=2025-01-01&to=2026-11-03"
		)
	})
})
