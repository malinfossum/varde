import { describe, expect, it } from "vitest"
import {
	normaliseText,
	normaliseUrl,
	phoneDigits,
	quoteHasPhone,
	quoteHasText,
	quoteHasUrl,
} from "../src/text/normalise.ts"

describe("normaliseText", () => {
	it("treats typographic variants as the same text", () => {
		const page = "Hverdager\u00A008.00\u201315.30, Lavterskel\u00ADtilbud \u201Cfor alle\u201D"
		expect(normaliseText(page)).toBe('hverdager 08.00-15.30, lavterskeltilbud "for alle"')
	})

	it("collapses whitespace and trims", () => {
		expect(normaliseText("  Storgata   1,\n2317 Hamar ")).toBe("storgata 1, 2317 hamar")
	})

	it("turns a blank string into an empty one", () => {
		expect(normaliseText(" \u00A0\t ")).toBe("")
	})
})

describe("phoneDigits", () => {
	it("strips grouping and the country code", () => {
		expect(phoneDigits("62 00 00 00")).toBe("62000000")
		expect(phoneDigits("+47 62 00 00 00")).toBe("62000000")
		expect(phoneDigits("0047 62000000")).toBe("62000000")
	})

	it("keeps a 10-digit number without a plus as it is", () => {
		expect(phoneDigits("4762000000")).toBe("4762000000")
	})
})

describe("quoteHasPhone", () => {
	it("finds the number however it is grouped", () => {
		expect(quoteHasPhone("Telefon: 62 00 00 00", "62000000")).toBe(true)
		expect(quoteHasPhone("Ring +47 62000000", "62 00 00 00")).toBe(true)
		expect(quoteHasPhone("Ring 113", "113")).toBe(true)
	})

	it("finds a number that follows other digits", () => {
		expect(quoteHasPhone("Åpent kl. 08.00 62 00 00 00", "62 00 00 00")).toBe(true)
	})

	it("never glues the hours onto the number", () => {
		expect(quoteHasPhone("kl. 08.00 62 00 00 00", "0062000000")).toBe(false)
		expect(quoteHasPhone("Ring 11 30", "113")).toBe(false)
	})

	it("refuses an empty number", () => {
		expect(quoteHasPhone("Telefon: 62 00 00 00", "")).toBe(false)
	})
})

describe("URLs", () => {
	it("normalises scheme, www, case and the trailing slash", () => {
		expect(normaliseUrl("https://WWW.Hamar.kommune.no/Rusteamet/")).toBe(
			"hamar.kommune.no/rusteamet"
		)
	})

	it("finds a URL written without its scheme", () => {
		expect(
			quoteHasUrl(
				"Les mer på www.hamar.kommune.no/rusteamet.",
				"https://hamar.kommune.no/rusteamet/"
			)
		).toBe(true)
	})

	it("does not match a different path", () => {
		expect(
			quoteHasUrl("https://hamar.kommune.no/barnevern", "https://hamar.kommune.no/rusteamet")
		).toBe(false)
	})
})

describe("quoteHasText", () => {
	it("matches across typography", () => {
		expect(quoteHasText("Hverdager 08.00\u201315.30", "hverdager 08.00-15.30")).toBe(true)
	})

	it("refuses a blank value", () => {
		expect(quoteHasText("Storgata 1", "  ")).toBe(false)
	})

	it("refuses a value that is only the start or end of a longer word or number", () => {
		expect(quoteHasText("Storgata 12, 2317 Hamar", "Storgata 1")).toBe(false)
		expect(quoteHasText("Storgata 12, 2317 Hamar", "Storgata 12")).toBe(true)
		expect(quoteHasText("Rusteamet Hamar", "Ha")).toBe(false)
		expect(quoteHasText("Rusteamet Hamar", "teamet Hamar")).toBe(false)
	})

	it("tries every occurrence, not only the first", () => {
		expect(quoteHasText("Storgata 12 og Storgata 1.", "Storgata 1")).toBe(true)
	})
})
