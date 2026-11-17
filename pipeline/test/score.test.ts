import { describe, expect, it } from "vitest"
import type { AnswerKey, KeyRow } from "../src/answerKey/schema.ts"
import { matchKeyRow, score } from "../src/answerKey/score.ts"
import type { LockFile, LockUnit } from "../src/schema/lock.ts"
import { acceptedField, lockUnit, testInputs } from "./helpers.ts"

function keyRow(id: number, name: string, over: Partial<KeyRow["fields"]> = {}): KeyRow {
	return {
		id,
		kommune: "3403",
		national: false,
		servedKommuner: [],
		parentId: null,
		name,
		nameEn: name,
		categories: ["rus"],
		fields: {
			phone: "62 00 00 00",
			address: null,
			email: null,
			website: null,
			chatUrl: null,
			openingHours: null,
			cost: null,
			costNote: null,
			alwaysOpen: false,
			lowThreshold: false,
			...over,
		},
	}
}

function unit(n: number, name: string, fields: LockUnit["fields"] = {}): LockUnit {
	return lockUnit({
		unitId: `org:${String(n).padStart(9, "0")}`,
		fields: {
			name: acceptedField({ value: name, evidence: { kind: "quote", quotes: [name] } }),
			phone: acceptedField(),
			...fields,
		},
	})
}

const names = Array.from({ length: 10 }, (_, i) => `Tjeneste ${i + 1}`)
const KEY: AnswerKey = {
	frozenOn: "2026-10-29",
	source: "https://varde.pages.dev/data/resources.nb.json",
	rows: names.map((n, i) => keyRow(i + 1, n)),
}
const lock = (units: LockUnit[]): LockFile => ({ kommune: "3403", inputs: testInputs(), units })
const run = (units: LockUnit[], decideOnce: number[] = []) =>
	score({ locks: [lock(units)], key: KEY, kommuner: ["3403"], decideOnce })

describe("score", () => {
	it("passes ten found rows with matching values", () => {
		const result = run(names.map((n, i) => unit(i, n)))
		expect(result).toMatchObject({ units: 10, found: 10, keyRows: 10, wrong: [], pass: true })
	})

	it("fails on one wrong value", () => {
		const units = names.map((n, i) => unit(i, n))
		units[3] = unit(3, names[3] ?? "", { phone: acceptedField({ value: "900 00 000" }) })
		const result = run(units)
		expect(result.wrong).toEqual([{ keyId: 4, unitId: "org:000000003", field: "phone" }])
		expect(result.pass).toBe(false)
	})

	it("allows one row in ten with a review field, not two", () => {
		const review = acceptedField({
			status: "review",
			reason: "agreement: 1 other source(s) disagree",
		})
		const one = names.map((n, i) => (i === 0 ? unit(i, n, { phone: review }) : unit(i, n)))
		expect(run(one).pass).toBe(true)
		const two = names.map((n, i) => (i < 2 ? unit(i, n, { phone: review }) : unit(i, n)))
		expect(run(two).pass).toBe(false)
	})

	it("needs nine in ten key rows found", () => {
		expect(run(names.slice(0, 9).map((n, i) => unit(i, n))).pass).toBe(true)
		expect(run(names.slice(0, 8).map((n, i) => unit(i, n))).pass).toBe(false)
	})

	it("counts a badge mismatch unless I decide that row once", () => {
		const badge = {
			lowThreshold: acceptedField({ value: true, evidence: { kind: "quote", quotes: ["x"] } }),
		}
		const units = names.map((n, i) => (i === 0 ? unit(i, n, badge) : unit(i, n)))
		expect(run(units).badgeMismatches).toEqual([1])
		expect(run(units, [1]).badgeMismatches).toEqual([])
	})

	it("matches a renamed unit by address and phone", () => {
		const keyed: AnswerKey = {
			...KEY,
			rows: [keyRow(1, "Rusteamet", { address: "Storgata 1, 2317 Hamar" })],
		}
		const u = unit(0, "Rus- og psykiatritjenesten", {
			address: acceptedField({
				value: "Storgata 1, 2317 Hamar",
				evidence: { kind: "quote", quotes: ["Storgata 1, 2317 Hamar"] },
			}),
		})
		const result = score({ locks: [lock([u])], key: keyed, kommuner: ["3403"], decideOnce: [] })
		expect(result.found).toBe(1)
	})
})

describe("matchKeyRow", () => {
	const rows = [keyRow(1, "Rusteamet", { address: "Storgata 1, 2999 Eksempelby" })]
	const inReview = (value: string) =>
		acceptedField({
			status: "review",
			reason: "agreement: 1 other source(s) disagree",
			value,
			evidence: { kind: "quote", quotes: [value] },
		})

	it("reads accepted names only, unless asked for any status", () => {
		const u = unit(0, "Annet navn", { name: inReview("Rusteamet") })
		expect(matchKeyRow(u, rows)).toBeUndefined()
		expect(matchKeyRow(u, rows, { anyStatus: true })?.id).toBe(1)
	})

	it("reads an address and phone pair in review only when asked for any status", () => {
		const u = unit(0, "Annet navn", {
			address: inReview("Storgata 1, 2999 Eksempelby"),
			phone: inReview("62 00 00 00"),
		})
		expect(matchKeyRow(u, rows)).toBeUndefined()
		expect(matchKeyRow(u, rows, { anyStatus: true })?.id).toBe(1)
	})

	it("never reads a dropped field", () => {
		const dropped = acceptedField({
			status: "dropped",
			value: undefined,
			evidence: undefined,
			reason: "grounding: no quote holds the value",
		})
		const u = unit(0, "Rusteamet", { name: dropped })
		expect(matchKeyRow(u, rows, { anyStatus: true })).toBeUndefined()
	})
})

describe("score: badge mismatches for the ratchet", () => {
	it("gives each badge mismatch with its unit and the field lowThreshold", () => {
		const badge = {
			lowThreshold: acceptedField({ value: true, evidence: { kind: "quote", quotes: ["x"] } }),
		}
		const units = names.map((n, i) => (i === 0 ? unit(i, n, badge) : unit(i, n)))
		expect(run(units).badgeWrong).toEqual([
			{ keyId: 1, unitId: "org:000000000", field: "lowThreshold" },
		])
		expect(run(units, [1]).badgeWrong).toEqual([])
	})
})
