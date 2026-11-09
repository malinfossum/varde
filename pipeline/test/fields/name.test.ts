import { describe, expect, it } from "vitest"
import { nameCandidate } from "../../src/extract/fields/name.ts"
import { websiteCandidate } from "../../src/extract/fields/website.ts"

const main = [{ text: "Eksempel helsestasjon", heading: 1 }, { text: "Vi har drop-in." }]
const URL_A = "https://www.eksempel.kommune.no/helsestasjon/"

describe("nameCandidate", () => {
	it("is the page's h1, quoted", () => {
		expect(nameCandidate(main)).toEqual({
			field: "name",
			value: "Eksempel helsestasjon",
			evidence: { kind: "quote", quotes: ["Eksempel helsestasjon"] },
			origin: "unitPage",
		})
	})

	it("is undefined without an h1", () => {
		expect(
			nameCandidate([{ text: "Vi har drop-in." }, { text: "Mer", heading: 2 }])
		).toBeUndefined()
	})
})

describe("websiteCandidate", () => {
	it("is the page's own final URL, with the h1 as the quote that proves the page", () => {
		expect(websiteCandidate(URL_A, main)).toEqual({
			field: "website",
			value: URL_A,
			evidence: { kind: "quote", quotes: ["Eksempel helsestasjon"] },
			origin: "unitPage",
		})
	})
})
