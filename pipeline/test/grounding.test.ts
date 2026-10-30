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

	// These quotes classify as partly, so only the dedicated partly line can send them to review.
	it("always sends partly free to review", () => {
		const quotes = ["Gratis å delta.", "Kaffe koster 20 kr."]
		const c = candidate({
			field: "cost",
			value: "partly",
			evidence: { kind: "quote", quotes },
		})
		const page = quotes.join(" ")
		expect(groundingGate(c, context({ pageText: () => page }))).toMatchObject({
			pass: false,
			onFail: "review",
		})
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

	// The quote really says døgnåpen, so only the value check can drop a false.
	it("stores only an always-open claim, never its absence", () => {
		const quote = "Legevakten er døgnåpen."
		const c = candidate({
			field: "alwaysOpen",
			value: false,
			evidence: { kind: "quote", quotes: [quote] },
		})
		expect(groundingGate(c, context({ pageText: () => quote }))).toMatchObject({
			pass: false,
			onFail: "drop",
		})
	})

	it("drops an address that is only the start of a longer house number", () => {
		const page = "Besøksadresse: Storgata 12, 2317 Hamar"
		const quotes = ["Besøksadresse: Storgata 12, 2317 Hamar"]
		const ctx = context({ pageText: () => page })
		const short = candidate({
			field: "address",
			value: "Storgata 1",
			evidence: { kind: "quote", quotes },
		})
		expect(groundingGate(short, ctx)).toMatchObject({ pass: false, onFail: "drop" })
		const whole = candidate({
			field: "address",
			value: "Storgata 12",
			evidence: { kind: "quote", quotes },
		})
		expect(groundingGate(whole, ctx).pass).toBe(true)
	})

	it("sends a free cost grounded only on a free extra to review", () => {
		const page = "Gratis parkering. Egenandel kr 350 per time."
		const c = candidate({
			field: "cost",
			value: "free",
			evidence: { kind: "quote", quotes: ["Gratis parkering."] },
		})
		expect(groundingGate(c, context({ pageText: () => page }))).toMatchObject({
			pass: false,
			onFail: "review",
		})
	})

	it("sends an always-open claim on a qualified sentence to review", () => {
		for (const quote of [
			"Telefonen er stengt hele døgnet 24. desember.",
			"Åpent hele døgnet i helger og høytider.",
			"Døgnåpent fra fredag til mandag.",
			"Chatten er åpen 24/7 i sommerferien.",
		]) {
			const c = candidate({
				field: "alwaysOpen",
				value: true,
				evidence: { kind: "quote", quotes: [quote] },
			})
			expect(groundingGate(c, context({ pageText: () => quote })), quote).toMatchObject({
				pass: false,
				onFail: "review",
			})
		}
	})

	it("grounds an always-open claim on an unqualified sentence", () => {
		const quote = "Legevakten er døgnåpen."
		const c = candidate({
			field: "alwaysOpen",
			value: true,
			evidence: { kind: "quote", quotes: [quote] },
		})
		expect(groundingGate(c, context({ pageText: () => quote })).pass).toBe(true)
	})

	it("drops an always-open claim no quote makes", () => {
		const quote = "Åpent tirsdager."
		const c = candidate({
			field: "alwaysOpen",
			value: true,
			evidence: { kind: "quote", quotes: [quote] },
		})
		expect(groundingGate(c, context({ pageText: () => quote }))).toMatchObject({
			pass: false,
			onFail: "drop",
		})
	})
})
