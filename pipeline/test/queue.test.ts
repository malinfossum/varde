import { describe, expect, it } from "vitest"
import {
	buildQueue,
	canAccept,
	type FieldItem,
	kommuneArg,
	readKommuneFiles,
} from "../src/review/queue.ts"
import { acceptedField, curatedUnit, lockUnit, PAGE_URL } from "./helpers.ts"
import { curatedWith, dataDir, lockWith } from "./reviewHelpers.ts"

describe("buildQueue", () => {
	it("asks about acute units first, an include question before a unit's fields", () => {
		const items = buildQueue(readKommuneFiles(dataDir()))
		expect(items.map((i) => [i.kind, i.unitId, i.acute])).toEqual([
			["include", "org:999999992", true],
			["field", "org:999999991", false],
		])
	})

	it("drops every question the curated file already answers", () => {
		const answered = curatedWith({
			units: [
				curatedUnit({
					unitId: "org:999999991",
					decisions: [
						{
							field: "phone",
							value: "62 00 00 00",
							sourceUrl: PAGE_URL,
							decision: "accept",
							decidedOn: "2026-11-06",
						},
					],
				}),
				curatedUnit({
					unitId: "org:999999992",
					include: false,
					excludeReason: "Ikke en tjeneste",
					categories: [],
				}),
			],
		})
		expect(buildQueue(readKommuneFiles(dataDir(lockWith(), answered)))).toEqual([])
	})

	it("asks again, labelled, when verify could not accept my earlier answer", () => {
		const decided = {
			kind: "decision" as const,
			decidedOn: "2026-11-06",
			original: { kind: "quote" as const, quotes: ["900 00 000"] },
		}
		const stuck = acceptedField({
			status: "review",
			value: "900 00 000",
			evidence: decided,
			origin: "unitContact",
			reason: "safety: a mobile on the unit page needs its role label",
		})
		const lock = {
			kommune: "3405",
			units: [lockUnit({ unitId: "org:999999991", fields: { phone: stuck } })],
		}
		const answered = curatedWith({
			units: [
				curatedUnit({
					unitId: "org:999999991",
					decisions: [
						{
							field: "phone",
							value: "900 00 000",
							sourceUrl: PAGE_URL,
							decision: "accept",
							decidedOn: "2026-11-06",
						},
					],
				}),
			],
		})
		const [item] = buildQueue(readKommuneFiles(dataDir(lock, answered)))
		expect(item).toMatchObject({
			kind: "field",
			unsettled: "2026-11-06",
			answerKey: "900 00 000",
			origin: "unitContact",
			reason:
				"my answer of 06.11.2026 did not settle it: safety: a mobile on the unit page needs its role label",
		})
	})
})

describe("canAccept", () => {
	const item = (over: Partial<FieldItem>): FieldItem => ({
		kind: "field",
		kommune: "3405",
		unitId: "org:999999991",
		unitName: "Eksempel barneverntjeneste",
		field: "phone",
		value: "62 00 00 00",
		evidence: { kind: "quote", quotes: ["Telefon: 62 00 00 00"] },
		sourceUrl: PAGE_URL,
		reason: "agreement: 1 other source(s) disagree",
		acute: false,
		categories: ["familie-og-barn"],
		...over,
	})

	it("offers no accept for a mobile with no role: only an edit with a role, or a reject, settles it", () => {
		expect(canAccept(item({}))).toBe(true)
		expect(canAccept(item({ value: "900 00 000" }))).toBe(false)
		expect(canAccept(item({ value: "900 00 000", role: "Avdelingsleder" }))).toBe(true)
	})
})

describe("kommuneArg", () => {
	const known = new Set(["3405", "0301"])

	it("takes a KLASS kommune number the last discover run read, or none", () => {
		expect(kommuneArg("3405", known)).toEqual({ ok: true, kommune: "3405" })
		expect(kommuneArg(undefined, known)).toEqual({ ok: true })
	})

	it("refuses anything else before it is used in a path", () => {
		for (const bad of ["../x", "3405/../../etc", "9999", "34050", "", " 3405"])
			expect(kommuneArg(bad, known)).toEqual({ ok: false })
	})
})
