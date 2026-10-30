import { describe, expect, it } from "vitest"
import { KommuneNumber } from "../src/schema/common.ts"
import { CuratedFile } from "../src/schema/curated.ts"
import { unitId } from "../src/schema/ids.ts"
import { LockField, LockFile } from "../src/schema/lock.ts"
import { acceptedField, allGatesPass, curatedUnit, lockUnit, T } from "./helpers.ts"

describe("KommuneNumber", () => {
	it("keeps Oslo's leading zero", () => {
		expect(KommuneNumber.safeParse("0301").success).toBe(true)
		expect(KommuneNumber.safeParse("301").success).toBe(false)
		expect(KommuneNumber.safeParse(301).success).toBe(false)
	})
})

// What runGates writes for a field the safety gate drops: all five results, one failed.
function droppedGates() {
	return allGatesPass().map((g) =>
		g.gate === "safety" ? { ...g, pass: false, onFail: "drop" as const, reason: "x" } : g
	)
}

describe("LockField", () => {
	it("accepts a fully gated field", () => {
		expect(LockField.safeParse(acceptedField()).success).toBe(true)
	})

	it("rejects an accepted field without evidence", () => {
		const { evidence: _evidence, ...field } = acceptedField()
		expect(LockField.safeParse(field).success).toBe(false)
	})

	it("rejects an accepted field with a failed gate", () => {
		const gates = acceptedField().gates.map((g) =>
			g.gate === "safety" ? { ...g, pass: false, onFail: "review" as const, reason: "x" } : g
		)
		expect(LockField.safeParse(acceptedField({ gates })).success).toBe(false)
	})

	it("rejects a dropped field that keeps its value", () => {
		const dropped = { ...acceptedField(), status: "dropped", reason: "a mobile from a staff list" }
		expect(LockField.safeParse(dropped).success).toBe(false)
	})

	it("accepts a dropped field with only a reason and the source", () => {
		const dropped = {
			status: "dropped",
			sourceUrl: acceptedField().sourceUrl,
			fetchedAt: T,
			verifiedAt: T,
			gates: droppedGates(),
			reason: "a mobile from a staff list",
		}
		expect(LockField.safeParse(dropped).success).toBe(true)
	})

	it("rejects a dropped field that carries an address id, since that points at a value", () => {
		const dropped = {
			status: "dropped",
			sourceUrl: acceptedField().sourceUrl,
			fetchedAt: T,
			verifiedAt: T,
			gates: droppedGates(),
			reason: "an address from a register",
			addressId: "3403-1234",
		}
		expect(LockField.safeParse(dropped).success).toBe(false)
	})

	it("rejects a review field without its five gate results", () => {
		const review = { ...acceptedField(), status: "review", reason: "validity: x" }
		expect(LockField.safeParse(review).success).toBe(true)
		expect(LockField.safeParse({ ...review, gates: [] }).success).toBe(false)
		expect(LockField.safeParse({ ...review, gates: allGatesPass().slice(1) }).success).toBe(false)
		// Each gate is there, one twice: only the length rule catches this.
		const six = [...allGatesPass(), { gate: "safety" as const, pass: true }]
		expect(LockField.safeParse({ ...review, gates: six }).success).toBe(false)
	})

	it("rejects a gate that appears twice in place of another", () => {
		const gates = allGatesPass().map((g) => (g.gate === "safety" ? { ...g, gate: "source" } : g))
		const review = { ...acceptedField(), status: "review", reason: "validity: x", gates }
		expect(LockField.safeParse(review).success).toBe(false)
	})

	it("rejects a blank quote", () => {
		const field = acceptedField({ evidence: { kind: "quote", quotes: ["   "] } })
		expect(LockField.safeParse(field).success).toBe(false)
	})

	it("rejects a quote over 400 characters", () => {
		const field = acceptedField({ evidence: { kind: "quote", quotes: ["x".repeat(401)] } })
		expect(LockField.safeParse(field).success).toBe(false)
	})

	it("rejects a timestamp that is not UTC", () => {
		expect(
			LockField.safeParse(acceptedField({ verifiedAt: "2026-10-29T10:00:00+02:00" })).success
		).toBe(false)
	})
})

describe("LockFile", () => {
	it("accepts a valid file", () => {
		expect(LockFile.safeParse({ kommune: "3403", units: [lockUnit()] }).success).toBe(true)
	})

	it("rejects a file-level timestamp, so a plain re-run cannot change it", () => {
		const file = { kommune: "3403", generatedAt: T, units: [lockUnit()] }
		expect(LockFile.safeParse(file).success).toBe(false)
	})

	it("rejects two units with the same id", () => {
		expect(LockFile.safeParse({ kommune: "3403", units: [lockUnit(), lockUnit()] }).success).toBe(
			false
		)
	})

	it("rejects a field name outside the twelve", () => {
		const unit = { ...lockUnit(), fields: { ...lockUnit().fields, fax: acceptedField() } }
		expect(LockFile.safeParse({ kommune: "3403", units: [unit] }).success).toBe(false)
	})

	it("rejects a value of the wrong kind for its field", () => {
		const unit = lockUnit({ fields: { alwaysOpen: acceptedField({ value: "ja" }) } })
		expect(LockFile.safeParse({ kommune: "3403", units: [unit] }).success).toBe(false)
		const cost = lockUnit({ fields: { cost: acceptedField({ value: "cheap" }) } })
		expect(LockFile.safeParse({ kommune: "3403", units: [cost] }).success).toBe(false)
	})
})

describe("CuratedFile", () => {
	const file = (units: unknown[]) => ({ kommune: "3403", name: "Hamar", units })

	it("accepts a valid file", () => {
		expect(CuratedFile.safeParse(file([curatedUnit()])).success).toBe(true)
	})

	it("needs a reason when a unit is left out", () => {
		expect(CuratedFile.safeParse(file([curatedUnit({ include: false })])).success).toBe(false)
		const out = curatedUnit({ include: false, excludeReason: "Treatment by referral only" })
		expect(CuratedFile.safeParse(file([out])).success).toBe(true)
	})

	it("needs a category for an included unit", () => {
		expect(CuratedFile.safeParse(file([curatedUnit({ categories: [] })])).success).toBe(false)
	})

	it("rejects a provider type outside the two", () => {
		const unit = { ...curatedUnit(), providerType: "privat" }
		expect(CuratedFile.safeParse(file([unit])).success).toBe(false)
	})

	it("rejects an unknown key", () => {
		const unit = { ...curatedUnit(), frivillig: true }
		expect(CuratedFile.safeParse(file([unit])).success).toBe(false)
	})

	it("allows the $schema key editors use", () => {
		const withSchema = { $schema: "../../pipeline/schema/curated.schema.json", ...file([]) }
		expect(CuratedFile.safeParse(withSchema).success).toBe(true)
	})

	it("rejects a lowThreshold quote over 400 characters", () => {
		const lowThreshold = { value: true, quotes: ["x".repeat(401)], decidedBy: "me" as const }
		expect(CuratedFile.safeParse(file([curatedUnit({ lowThreshold })])).success).toBe(false)
		const fine = { ...lowThreshold, quotes: ["x".repeat(400)] }
		expect(CuratedFile.safeParse(file([curatedUnit({ lowThreshold: fine })])).success).toBe(true)
	})
})

describe("unitId", () => {
	it("prefers the org number", () => {
		expect(unitId({ orgNumber: "999999999", addressId: "a1", name: "X" })).toBe("org:999999999")
	})

	it("falls back to the address id and a name slug", () => {
		expect(unitId({ addressId: "3403-1234", name: "Kafé Møteplassen" })).toBe(
			"adr:3403-1234:kafe-moteplassen"
		)
	})

	it("refuses a unit with neither", () => {
		expect(() => unitId({ name: "X" })).toThrow()
	})

	it("refuses a malformed org number", () => {
		expect(() => unitId({ orgNumber: "12345", name: "X" })).toThrow()
	})
})
