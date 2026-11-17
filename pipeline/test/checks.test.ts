import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import type { LockFile, LockUnit } from "../src/schema/lock.ts"
import {
	ChecksFileError,
	checksAgree,
	goneSamples,
	KnownWrong,
	type KnownWrongEntry,
	keyIsWrong,
	type PilotCheck,
	PilotChecks,
	ratchet,
	readKnownWrong,
	readPilotChecks,
} from "../src/score/checks.ts"
import { acceptedField, lockUnit, testInputs } from "./helpers.ts"

const check = (over: Partial<PilotCheck> = {}): PilotCheck => ({
	kind: "disagreement",
	keyId: 12,
	unitId: "org:999999999",
	field: "phone",
	ruling: "pipelineWrong",
	note: "The source page shows another number.",
	by: "me",
	...over,
})
const entry = (over: Partial<KnownWrongEntry> = {}): KnownWrongEntry => ({
	kind: "disagreement",
	keyId: 12,
	unitId: "org:999999999",
	field: "phone",
	...over,
})
const sample = (over: Partial<KnownWrongEntry> = {}): KnownWrongEntry => {
	const { keyId: _keyId, ...rest } = entry({ kind: "sample", ...over })
	return rest
}
const fileWith = (name: string, text: string) => {
	const path = join(mkdtempSync(join(tmpdir(), "varde-checks-")), name)
	writeFileSync(path, text)
	return path
}

describe("PilotChecks", () => {
	it("takes a disagreement with its key row and a sample without one", () => {
		const { keyId: _keyId, ...noKey } = check({ kind: "sample", ruling: "right" })
		expect(PilotChecks.safeParse({ checks: [check(), noKey] }).success).toBe(true)
	})

	it("refuses a disagreement with no key row, and a sample with one", () => {
		const { keyId: _keyId, ...noKey } = check()
		expect(PilotChecks.safeParse({ checks: [noKey] }).success).toBe(false)
		expect(PilotChecks.safeParse({ checks: [check({ kind: "sample" })] }).success).toBe(false)
	})

	it("refuses a sample ruled key stale: a sample has no key to be stale", () => {
		const { keyId: _keyId, ...noKey } = check({ kind: "sample", ruling: "keyStale" })
		expect(PilotChecks.safeParse({ checks: [noKey] }).success).toBe(false)
	})

	it("refuses two checks of one field, a long note and an unknown author", () => {
		expect(PilotChecks.safeParse({ checks: [check(), check({ ruling: "unclear" })] }).success).toBe(
			false
		)
		expect(PilotChecks.safeParse({ checks: [check({ note: "x".repeat(301) })] }).success).toBe(
			false
		)
		expect(PilotChecks.safeParse({ checks: [{ ...check(), by: "someone" }] }).success).toBe(false)
		expect(
			PilotChecks.safeParse({ checks: [check({ by: "proposed" }), check({ by: "me" })] }).success
		).toBe(true)
	})
})

describe("KnownWrong", () => {
	it("refuses a disagreement with no key row, a sample with one, and a repeated entry", () => {
		const { keyId: _keyId, ...noKey } = entry()
		expect(KnownWrong.safeParse({ entries: [noKey] }).success).toBe(false)
		expect(KnownWrong.safeParse({ entries: [entry({ kind: "sample" })] }).success).toBe(false)
		expect(KnownWrong.safeParse({ entries: [entry(), entry()] }).success).toBe(false)
		expect(KnownWrong.safeParse({ entries: [entry(), sample()] }).success).toBe(true)
	})
})

describe("readPilotChecks and readKnownWrong", () => {
	it("read a valid file", () => {
		const path = fileWith("known-wrong.json", JSON.stringify({ entries: [entry()] }))
		expect(readKnownWrong(path)).toEqual({ entries: [entry()] })
		const checks = fileWith("pilot-checks.json", JSON.stringify({ checks: [check()] }))
		expect(readPilotChecks(checks)).toEqual({ checks: [check()] })
	})

	it("name the file, never its text, when it is missing, broken or off the schema", () => {
		const dir = mkdtempSync(join(tmpdir(), "varde-checks-"))
		expect(() => readPilotChecks(join(dir, "pilot-checks.json"))).toThrow(
			new ChecksFileError("pilot-checks.json is missing")
		)
		const broken = fileWith("known-wrong.json", "{ Kari Nordmann")
		expect(() => readKnownWrong(broken)).toThrow("known-wrong.json is not valid JSON")
		const odd = fileWith(
			"known-wrong.json",
			JSON.stringify({ entries: [{ ...entry(), "Kari Nordmann": "62 00 00 00" }] })
		)
		let message = ""
		try {
			readKnownWrong(odd)
		} catch (err) {
			message = err instanceof ChecksFileError ? err.message : "not a ChecksFileError"
		}
		expect(message).toMatch(/^known-wrong\.json does not match its schema/)
		expect(message).not.toContain("Kari")
		expect(message).not.toContain("62 00 00 00")
	})
})

describe("ratchet", () => {
	const wrong = { keyId: 12, unitId: "org:999999999", field: "phone" }

	it("passes a wrong value the list holds", () => {
		expect(ratchet([wrong], { entries: [entry()] })).toEqual({ unlisted: [], gone: [] })
	})

	it("gives a wrong value the list lacks, and a listed one that no longer occurs", () => {
		expect(ratchet([wrong], { entries: [] }).unlisted).toEqual([wrong])
		expect(ratchet([], { entries: [entry()] }).gone).toEqual([entry()])
	})

	it("matches on key row, unit and field together", () => {
		const other = entry({ keyId: 13 })
		expect(ratchet([wrong], { entries: [other] })).toEqual({ unlisted: [wrong], gone: [other] })
	})

	it("leaves sample entries to goneSamples", () => {
		expect(ratchet([], { entries: [sample()] })).toEqual({ unlisted: [], gone: [] })
	})
})

describe("goneSamples", () => {
	const lock = (fields: LockUnit["fields"]): LockFile => ({
		kommune: "3405",
		inputs: testInputs(),
		units: [lockUnit({ fields })],
	})

	it("keeps a sample entry whose field is still accepted in a lock", () => {
		expect(goneSamples({ entries: [sample()] }, [lock({ phone: acceptedField() })])).toEqual([])
	})

	it("gives a sample entry whose field left accepted, or whose unit is gone", () => {
		const review = acceptedField({
			status: "review",
			reason: "agreement: 1 other source(s) disagree",
		})
		expect(goneSamples({ entries: [sample()] }, [lock({ phone: review })])).toEqual([sample()])
		expect(goneSamples({ entries: [sample({ unitId: "org:999999998" })] }, [lock({})])).toEqual([
			sample({ unitId: "org:999999998" }),
		])
	})
})

describe("checksAgree", () => {
	it("passes when every pipeline wrong ruling of mine is listed, and nothing else is", () => {
		expect(checksAgree({ checks: [check()] }, { entries: [entry()] })).toEqual([])
	})

	it("names a pipeline wrong ruling of mine that the list lacks", () => {
		expect(checksAgree({ checks: [check()] }, { entries: [] })).toEqual([
			"pilot-checks.json rules disagreement with key row 12, unit org:999999999, field phone pipeline wrong, and known-wrong.json does not list it",
		])
	})

	it("names a listed value with no pipeline wrong ruling of mine, a proposal included", () => {
		const problem =
			"known-wrong.json lists disagreement with key row 12, unit org:999999999, field phone, and pilot-checks.json has no pipeline wrong ruling of mine for it"
		expect(checksAgree({ checks: [] }, { entries: [entry()] })).toEqual([problem])
		expect(checksAgree({ checks: [check({ by: "proposed" })] }, { entries: [entry()] })).toEqual([
			problem,
		])
		expect(checksAgree({ checks: [check({ ruling: "right" })] }, { entries: [entry()] })).toEqual([
			problem,
		])
	})

	it("ignores a proposal and a ruling other than pipeline wrong when the list lacks them", () => {
		const checks = [check({ by: "proposed" }), check({ keyId: 13, ruling: "keyStale" })]
		expect(checksAgree({ checks }, { entries: [] })).toEqual([])
	})

	it("names a sample by unit and field", () => {
		const { keyId: _keyId, ...mine } = check({ kind: "sample" })
		expect(checksAgree({ checks: [mine] }, { entries: [] })).toEqual([
			"pilot-checks.json rules sample, unit org:999999999, field phone pipeline wrong, and known-wrong.json does not list it",
		])
	})
})

describe("keyIsWrong", () => {
	it("lets a value pass that I ruled key stale or right, never a proposal or unclear", () => {
		const w = { keyId: 12, unitId: "org:999999999", field: "phone" as const }
		expect(keyIsWrong({ checks: [check({ ruling: "keyStale" })] }, w)).toBe(true)
		expect(keyIsWrong({ checks: [check({ ruling: "right" })] }, w)).toBe(true)
		expect(keyIsWrong({ checks: [check({ ruling: "keyStale", by: "proposed" })] }, w)).toBe(false)
		expect(keyIsWrong({ checks: [check({ ruling: "unclear" })] }, w)).toBe(false)
	})
})
