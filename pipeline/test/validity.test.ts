import { describe, expect, it } from "vitest"
import { fitsNumberPlan, MAX_HOURS, validityGate } from "../src/gates/validity.ts"
import { candidate, context } from "./helpers.ts"

describe("fitsNumberPlan", () => {
	it("accepts the four shapes in the Nkom plan", () => {
		for (const ok of ["62 00 00 00", "+47 62 00 00 00", "900 00 000", "113", "116 123", "02800"]) {
			expect(fitsNumberPlan(ok), ok).toBe(true)
		}
	})

	it("rejects everything else", () => {
		for (const bad of ["12345678", "0123", "6200000", "620000000", "1234", "116 12", "abc"]) {
			expect(fitsNumberPlan(bad), bad).toBe(false)
		}
	})
})

describe("validity gate", () => {
	it("passes a valid phone", () => {
		expect(validityGate(candidate(), context()).pass).toBe(true)
	})

	it("drops a phone outside the plan", () => {
		expect(validityGate(candidate({ value: "1234" }), context())).toMatchObject({
			pass: false,
			onFail: "drop",
		})
	})

	it("sends a URL that does not answer 200 to review", () => {
		const c = candidate({ field: "website", value: "https://hamar.kommune.no/rusteamet" })
		expect(validityGate(c, context({ urlStatus: () => 404 }))).toMatchObject({
			pass: false,
			onFail: "review",
		})
		expect(validityGate(c, context({ urlStatus: () => undefined }))).toMatchObject({
			pass: false,
			onFail: "review",
		})
		expect(validityGate(c, context()).pass).toBe(true)
	})

	it("sends an address Kartverket cannot find, or finds elsewhere, to review", () => {
		const c = candidate({ field: "address", value: "Storgata 1, 2317 Hamar" })
		expect(validityGate(c, context()).pass).toBe(true)
		expect(validityGate(c, context({ findAddress: () => undefined }))).toMatchObject({
			pass: false,
			onFail: "review",
		})
		const elsewhere = () => ({ addressId: "3405-0001", kommune: "3405" })
		expect(validityGate(c, context({ findAddress: elsewhere }))).toMatchObject({
			pass: false,
			onFail: "review",
		})
	})

	it("allows hours up to the database limit and no further", () => {
		const at = candidate({ field: "openingHours", value: "x".repeat(MAX_HOURS) })
		expect(validityGate(at, context()).pass).toBe(true)
		const over = candidate({ field: "openingHours", value: "x".repeat(MAX_HOURS + 1) })
		expect(validityGate(over, context())).toMatchObject({ pass: false, onFail: "review" })
		const phoneHours = candidate({ field: "phoneHours", value: "x".repeat(MAX_HOURS + 1) })
		expect(validityGate(phoneHours, context())).toMatchObject({ pass: false, onFail: "review" })
	})

	it("sends a kommune number KLASS does not know to review", () => {
		expect(validityGate(candidate({ kommune: "3499" }), context())).toMatchObject({
			pass: false,
			onFail: "review",
		})
	})
})

const decided = {
	kind: "decision" as const,
	decidedOn: "2026-11-06",
	original: { kind: "quote" as const, quotes: ["x"] },
}

describe("validity: my decision and invisible characters", () => {
	it("lets my decision settle a review, but never a drop", () => {
		const site = candidate({ field: "website", value: "https://www.hamar.kommune.no/rusteamet/" })
		const forbidden = context({ urlStatus: () => 403 })
		expect(validityGate(site, forbidden).pass).toBe(false)
		expect(validityGate({ ...site, evidence: decided }, forbidden)).toEqual({
			gate: "validity",
			pass: true,
			reason: "my decision of 06.11.2026",
		})
		expect(validityGate(candidate({ value: "12", evidence: decided }), context()).pass).toBe(false)
	})

	it("drops a value that holds an invisible character", () => {
		const c = candidate({ field: "openingHours", value: "Mandag\u200B kl. 08:00" })
		expect(validityGate(c, context())).toMatchObject({ pass: false, onFail: "drop" })
	})
})
