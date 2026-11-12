import { describe, expect, it } from "vitest"
import {
	isFrontPage,
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

	it("does not read an email's domain as a link", () => {
		expect(quoteHasUrl("E-post: postmottak@hamar.kommune.no", "https://hamar.kommune.no")).toBe(
			false
		)
		expect(quoteHasUrl("Se hamar.kommune.no for mer.", "https://hamar.kommune.no")).toBe(true)
	})
})

describe("isFrontPage", () => {
	const kommune = new Set(["lillehammer.kommune.no"])

	it("knows a site's front page, with or without www and the slash", () => {
		expect(isFrontPage("https://www.lillehammer.kommune.no/", kommune)).toBe(true)
		expect(isFrontPage("https://lillehammer.kommune.no", kommune)).toBe(true)
	})

	it("does not count a page under the front page or another site", () => {
		expect(isFrontPage("https://www.lillehammer.kommune.no/helsestasjon/", kommune)).toBe(false)
		expect(isFrontPage("https://www.hamar.kommune.no/", kommune)).toBe(false)
		expect(isFrontPage("not a url", kommune)).toBe(false)
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

describe("quoteHasPhone: dot-grouped numbers", () => {
	it("finds 2-2-2-2 and 3-2-3 dotted numbers", () => {
		expect(quoteHasPhone("Telefon 62.00.00.00", "62 00 00 00")).toBe(true)
		expect(quoteHasPhone("Telefon 620.00.000", "620 00 000")).toBe(true)
	})

	it("still blanks times and dates, so hours never glue onto a number", () => {
		expect(quoteHasPhone("Åpent 08.00-15.30, tlf 62 00 00 00", "62 00 00 00")).toBe(true)
		expect(quoteHasPhone("27.10.2026", "27102026")).toBe(false)
		expect(quoteHasPhone("62.00.00", "620000")).toBe(false)
	})

	it("finishes on a 1 MB run of digits and dots well within a second", () => {
		const started = performance.now()
		quoteHasPhone("12.".repeat(350_000), "62 00 00 00")
		expect(performance.now() - started).toBeLessThan(1000)
	})

	it("stays linear on a long run of single-digit groups", () => {
		// 1,999 characters, then 1 MB: every group starts a new try at the number.
		for (const groups of ["6 2 ".repeat(500).slice(0, 1999), "6 2 ".repeat(250_000)]) {
			const started = performance.now()
			expect(quoteHasPhone(groups, "62 00 00 00")).toBe(false)
			expect(performance.now() - started).toBeLessThan(1000)
		}
	})
})

describe("quoteHasPhone: a time after a number", () => {
	it("finds a number written before an opening time", () => {
		expect(quoteHasPhone("Telefon 62 00 00 00 08.00-15.30", "62 00 00 00")).toBe(true)
	})
})
