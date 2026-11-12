import { describe, expect, it } from "vitest"
import { categoriesFor, providerTypeFor } from "../src/curate/categories.ts"

const K = "https://www.eksempel.kommune.no"

describe("categoriesFor", () => {
	it("knows a category from an SN2025 code or a path word, one-to-one", () => {
		expect(categoriesFor({ naeringskode: "88.992", urls: [], nklmLegevakt: false })).toEqual({
			categories: ["familie-og-barn"],
			known: true,
			isKrisesenter: false,
		})
		expect(categoriesFor({ urls: [`${K}/helse/legevakt/`], nklmLegevakt: false })).toMatchObject({
			categories: ["nodtjenester"],
			known: true,
		})
	})

	it("knows a legevakt from NKLM", () => {
		expect(categoriesFor({ urls: [`${K}/helse/`], nklmLegevakt: true })).toMatchObject({
			categories: ["nodtjenester"],
			known: true,
		})
	})

	it("sends a helsestasjon to review, suggesting familie-og-barn", () => {
		expect(
			categoriesFor({
				naeringskode: "86.942",
				urls: [`${K}/helse/helsestasjon/`],
				nklmLegevakt: false,
			})
		).toEqual({
			categories: ["familie-og-barn"],
			known: false,
			isKrisesenter: false,
		})
		expect(
			categoriesFor({
				naeringskode: "88.991",
				urls: [`${K}/helsestasjon-for-ungdom/`],
				nklmLegevakt: false,
			}).known
		).toBe(false)
	})

	it("knows 87.999 only beside a krisesenter word, and marks it a krisesenter either way", () => {
		expect(
			categoriesFor({ naeringskode: "87.999", urls: [`${K}/helse/bolig/`], nklmLegevakt: false })
		).toEqual({
			categories: ["vold-og-overgrep", "nodtjenester"],
			known: false,
			isKrisesenter: true,
		})
		expect(
			categoriesFor({
				naeringskode: "87.999",
				urls: ["https://www.eksempel-krisesenter.no/"],
				names: ["EKSEMPEL KRISESENTER IKS"],
				nklmLegevakt: false,
			})
		).toEqual({
			categories: ["vold-og-overgrep", "nodtjenester"],
			known: true,
			isKrisesenter: true,
		})
		expect(
			categoriesFor({ naeringskode: "87.999", urls: [`${K}/krisesenter/`], nklmLegevakt: false })
				.known
		).toBe(true)
	})

	it("reads krisesentret and krisesentre as krisesenter words, in a name and in a path", () => {
		expect(
			categoriesFor({
				naeringskode: "88.991",
				urls: [`${K}/eksempel/`],
				names: ["Krisesentret i Eksempel"],
				nklmLegevakt: false,
			}).isKrisesenter
		).toBe(true)
		for (const path of ["krisesentret", "krisesentre"]) {
			expect(
				categoriesFor({ naeringskode: "88.991", urls: [`${K}/${path}/`], nklmLegevakt: false })
					.isKrisesenter,
				path
			).toBe(true)
		}
	})

	it("keeps the ambiguous codes and barnevernvakt in review, even beside a path word", () => {
		for (const code of ["86.941", "88.995", "88.994", "88.996"]) {
			expect(categoriesFor({ naeringskode: code, urls: [], nklmLegevakt: false }).known).toBe(false)
			expect(
				categoriesFor({ naeringskode: code, urls: [`${K}/gjeldsradgivning/`], nklmLegevakt: false })
					.known
			).toBe(false)
		}
		expect(categoriesFor({ urls: [`${K}/barnevernvakt/`], nklmLegevakt: false }).known).toBe(false)
	})

	it("reads the last path segment only: a page under a service is not that service", () => {
		expect(
			categoriesFor({ urls: [`${K}/legevakt/kommunal-akutt-dognplass/`], nklmLegevakt: false })
		).toEqual({
			categories: [],
			known: false,
			isKrisesenter: false,
		})
		expect(
			categoriesFor({ urls: [`${K}/krisesenter/samarbeid/`], nklmLegevakt: false }).isKrisesenter
		).toBe(false)
	})

	it("is not known when the code and the path disagree, but suggests both", () => {
		expect(
			categoriesFor({
				naeringskode: "88.991",
				urls: [`${K}/gjeldsradgivning/`],
				nklmLegevakt: false,
			})
		).toEqual({
			categories: ["okonomi", "familie-og-barn"],
			known: false,
			isKrisesenter: false,
		})
	})
})

describe("providerTypeFor", () => {
	it("is offentlig on the kommune's site, on nav.no, or for a public form", () => {
		expect(providerTypeFor({ urls: [`${K}/x/`], kommuneHost: "www.eksempel.kommune.no" })).toBe(
			"offentlig"
		)
		expect(providerTypeFor({ urls: ["https://www.nav.no/kontor/nav-eksempel"] })).toBe("offentlig")
		expect(providerTypeFor({ orgForm: "IKS", urls: ["https://www.krisesenter.no/"] })).toBe(
			"offentlig"
		)
	})

	it("is frivillig for an association or a foundation, and unknown otherwise", () => {
		expect(providerTypeFor({ orgForm: "FLI", urls: ["https://www.eksempel-forening.no/"] })).toBe(
			"frivillig"
		)
		expect(
			providerTypeFor({ orgForm: "BEDR", urls: ["https://www.eksempel-forening.no/"] })
		).toBeUndefined()
	})

	it("reads the org form before the host, and is unknown when they disagree", () => {
		expect(
			providerTypeFor({ orgForm: "FLI", urls: [`${K}/x/`], kommuneHost: "www.eksempel.kommune.no" })
		).toBeUndefined()
		expect(
			providerTypeFor({
				orgForm: "KOMM",
				urls: [`${K}/x/`],
				kommuneHost: "www.eksempel.kommune.no",
			})
		).toBe("offentlig")
	})
})
