import { describe, expect, it } from "vitest"
import { groundingGate } from "../src/gates/grounding.ts"
import { candidate, context } from "./helpers.ts"

describe("grounding gate", () => {
	it("passes a register value by its record id", () => {
		const c = candidate({
			sourceUrl: "https://data.brreg.no/enhetsregisteret/api/enheter/999999999",
			evidence: { kind: "register", register: "brreg", recordId: "999999999" },
			origin: "register",
		})
		expect(groundingGate(c, context()).pass).toBe(true)
	})

	it("passes a quote that is on the page and holds the value", () => {
		expect(groundingGate(candidate(), context()).pass).toBe(true)
	})

	it("sees through typography", () => {
		const c = candidate({
			field: "openingHours",
			value: "hverdager 08.00-15.30",
			evidence: { kind: "quote", quotes: ["(hverdager 08.00-15.30)"] },
		})
		expect(groundingGate(c, context()).pass).toBe(true)
	})

	it("drops an invented value whose quote is not on the page", () => {
		const c = candidate({
			value: "62 99 99 99",
			evidence: { kind: "quote", quotes: ["Telefon: 62 99 99 99"] },
		})
		expect(groundingGate(c, context())).toMatchObject({ pass: false, onFail: "drop" })
	})

	it("drops a value the quote does not hold", () => {
		const c = candidate({ value: "62 99 99 99" })
		expect(groundingGate(c, context())).toMatchObject({ pass: false, onFail: "drop" })
	})

	// The valid quote beside the blank one holds the value, so only the blank-quote check can
	// drop this candidate.
	it("drops a blank quote, which every page would contain", () => {
		const c = candidate({
			evidence: { kind: "quote", quotes: ["Telefon: 62 00 00 00", "    "] },
		})
		expect(groundingGate(c, context())).toMatchObject({ pass: false, onFail: "drop" })
	})

	it("drops a value with no cached page", () => {
		expect(groundingGate(candidate(), context({ pageText: () => undefined }))).toMatchObject({
			pass: false,
			onFail: "drop",
		})
	})

	it("grounds a website from the href in the cleaned text", () => {
		const c = candidate({
			field: "website",
			value: "https://hamar.kommune.no/rusteamet",
			evidence: { kind: "quote", quotes: ["Nettside: https://www.hamar.kommune.no/rusteamet/"] },
		})
		expect(groundingGate(c, context()).pass).toBe(true)
	})

	it("checks a cost value against its quotes", () => {
		const free = candidate({
			field: "cost",
			value: "free",
			evidence: { kind: "quote", quotes: ["Tilbudet er gratis"] },
		})
		expect(groundingGate(free, context()).pass).toBe(true)
		const paid = { ...free, value: "paid" }
		expect(groundingGate(paid, context())).toMatchObject({ pass: false, onFail: "review" })
	})

	it("always sends partly free to review", () => {
		const c = candidate({
			field: "cost",
			value: "partly",
			evidence: { kind: "quote", quotes: ["Tilbudet er gratis"] },
		})
		expect(groundingGate(c, context())).toMatchObject({ pass: false, onFail: "review" })
	})

	it("drops a quote over 400 characters, which would ground anything", () => {
		const long = `Telefon: 62 00 00 00 ${"x".repeat(400)}`
		const c = candidate({ evidence: { kind: "quote", quotes: [long] } })
		const page = `${long}`
		expect(groundingGate(c, context({ pageText: () => page }))).toMatchObject({
			pass: false,
			onFail: "drop",
		})
	})

	it("stores only an always-open claim, never its absence", () => {
		const c = candidate({
			field: "alwaysOpen",
			value: false,
			evidence: { kind: "quote", quotes: ["Rusteamet Hamar"] },
		})
		expect(groundingGate(c, context())).toMatchObject({ pass: false, onFail: "drop" })
	})
})
