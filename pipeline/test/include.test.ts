import { describe, expect, it } from "vitest"
import { foldParents, matchUnits } from "../src/curate/include.ts"
import type { DiscoveredUnit } from "../src/discover/types.ts"
import type { ExtractedPage } from "../src/schema/extraction.ts"

const K = "https://www.eksempel.kommune.no"
const unit = (over: Partial<DiscoveredUnit> = {}): DiscoveredUnit => ({
	orgNumber: "999999991",
	name: "EKSEMPEL KOMMUNE BARNEVERNTJENESTE",
	orgForm: "BEDR",
	naeringskode: "88.991",
	address: "Storgata 1, 2609 LILLEHAMMER",
	kommune: "3405",
	website: `${K}/barnevern/`,
	register: "underenheter",
	...over,
})
const page = (
	url: string,
	over: Partial<ExtractedPage> = {},
	h1 = "Eksempel barneverntjeneste"
): ExtractedPage => ({
	url,
	finalUrl: url,
	fetchedAt: "2026-11-06T09:00:00Z",
	adapter: "acos",
	fallback: false,
	blocks: [],
	candidates: [
		{ field: "name", value: h1, evidence: { kind: "quote", quotes: [h1] }, origin: "unitPage" },
		{
			field: "address",
			value: "Storgata 1, 2609 Lillehammer",
			evidence: { kind: "quote", quotes: ["Storgata 1, 2609 Lillehammer"] },
			origin: "unitContact",
		},
	],
	lavterskelQuotes: [],
	...over,
})
const base = {
	national: new Set<string>(),
	addressId: (a: string) => (/storgata 1,/i.test(a) ? "adr-1" : undefined),
	kommuneHost: "www.eksempel.kommune.no",
	nklmLegevakt: () => false,
}

describe("matchUnits", () => {
	it("includes one unit with one page and a known category, automatically", () => {
		const result = matchUnits({ ...base, units: [unit()], pages: [page(`${K}/barnevern/`)] })
		expect(result.groups).toMatchObject([
			{
				unitId: "org:999999991",
				name: "Eksempel barneverntjeneste",
				categories: ["familie-og-barn"],
				providerType: "offentlig",
				inclusion: { status: "auto", reason: "one register unit, one page, a known category" },
			},
		])
	})

	it("matches by name and Kartverket address id when the unit lists no website", () => {
		const result = matchUnits({
			...base,
			units: [unit({ website: undefined })],
			pages: [page(`${K}/familie/bv/`)],
		})
		expect(result.groups[0]?.unitId).toBe("org:999999991")
	})

	it("never includes a page that two register units match: both are review questions", () => {
		const two = [unit(), unit({ orgNumber: "999999992", name: "EKSEMPEL BARNEVERNTJENESTE NORD" })]
		const result = matchUnits({ ...base, units: two, pages: [page(`${K}/barnevern/`)] })
		expect(result.groups.map((g) => [g.unitId, g.inclusion.status, g.inclusion.reason])).toEqual([
			["org:999999991", "review", "two or more register units share the page"],
			["org:999999992", "review", "two or more register units share the page"],
		])
		expect(result.groups[1]?.name).toBe("EKSEMPEL BARNEVERNTJENESTE NORD")
	})

	it("lets a website match leave out a unit that matches by name and address only", () => {
		const twin = unit({ orgNumber: "999999992", website: undefined })
		const result = matchUnits({ ...base, units: [unit(), twin], pages: [page(`${K}/barnevern/`)] })
		expect(result.groups.map((g) => [g.unitId, g.inclusion.status])).toEqual([
			["org:999999991", "auto"],
		])
		expect(result.unitsWithoutPage).toBe(1)
	})

	it("folds a main unit and its only sub-unit into one, so their page is one auto include", () => {
		const parent = unit({
			orgNumber: "999999990",
			orgForm: "FLI",
			register: "enheter",
			website: "https://www.eksempel-forening.no/",
		})
		const child = unit({
			orgNumber: "999999991",
			orgForm: "BEDR",
			website: undefined,
			parent: "999999990",
		})
		const result = matchUnits({
			...base,
			units: [parent, child],
			pages: [page("https://www.eksempel-forening.no/")],
		})
		expect(result.foldedParents).toBe(1)
		expect(result.groups).toMatchObject([
			{ unitId: "org:999999991", providerType: "frivillig", inclusion: { status: "auto" } },
		])
	})

	it("keeps a main unit with two sub-units apart from them", () => {
		const parent = unit({ orgNumber: "999999990", orgForm: "FLI", register: "enheter" })
		const kids = [
			unit({ orgNumber: "999999991", parent: "999999990" }),
			unit({ orgNumber: "999999992", parent: "999999990" }),
		]
		expect(foldParents([parent, ...kids])).toMatchObject({ folded: 0, units: [parent, ...kids] })
	})

	it("sends a unit to review when its page's heading does not name it, and shows the Brreg name", () => {
		const hub = matchUnits({
			...base,
			units: [unit({ website: `${K}/familie/` })],
			pages: [page(`${K}/familie/`, {}, "Familie og oppvekst")],
		})
		expect(hub.groups[0]).toMatchObject({
			name: "EKSEMPEL KOMMUNE BARNEVERNTJENESTE",
			inclusion: { status: "review", reason: "the page heading does not name the unit" },
		})
	})

	it("asks about a unit with two pages, about a unit with no known category, and about a helsestasjon", () => {
		const twoPages = matchUnits({
			...base,
			units: [unit({ website: undefined })],
			pages: [page(`${K}/a/`), page(`${K}/b/`)],
		})
		expect(twoPages.groups[0]?.inclusion).toMatchObject({
			status: "review",
			reason: "the unit has two or more pages",
		})
		const unknown = matchUnits({
			...base,
			units: [unit({ naeringskode: "88.995", website: `${K}/tjenester/` })],
			pages: [page(`${K}/tjenester/`)],
		})
		expect(unknown.groups[0]?.inclusion).toMatchObject({
			status: "review",
			reason: "no known category",
		})
		const hs = matchUnits({
			...base,
			units: [
				unit({
					name: "EKSEMPEL HELSESTASJON",
					naeringskode: "86.942",
					website: `${K}/helsestasjon/`,
				}),
			],
			pages: [page(`${K}/helsestasjon/`, {}, "Eksempel helsestasjon")],
		})
		expect(hs.groups[0]?.inclusion).toEqual({
			status: "review",
			reason: "no known category",
			suggestedCategories: ["familie-og-barn"],
			providerType: "offentlig",
		})
	})

	it("gives a page with no unit an address id, and counts a page it cannot name", () => {
		const result = matchUnits({
			...base,
			units: [],
			pages: [page(`${K}/x/`), page(`${K}/y/`, { candidates: [] })],
		})
		expect(result.groups.map((g) => [g.unitId, g.inclusion.reason])).toEqual([
			["adr:adr-1:eksempel-barneverntjeneste", "no register unit matches the page"],
		])
		expect(result.noUnitId).toBe(1)
	})

	it("counts a unit without a page, a page with a problem, and a national page no unit claims", () => {
		const result = matchUnits({
			...base,
			national: new Set(["https://www.nav.no/kontor/nav-eksempel"]),
			units: [unit({ website: undefined, address: undefined })],
			pages: [
				page(`${K}/z/`, { problem: "cacheMismatch", candidates: [] }),
				page("https://www.nav.no/kontor/nav-eksempel", { orgNumber: "999999993" }),
			],
		})
		expect(result).toMatchObject({
			groups: [],
			unitsWithoutPage: 1,
			pagesWithProblem: 1,
			nationalUnmatched: 1,
		})
	})

	it("joins a Nav office page by its org number", () => {
		const nav = unit({
			orgNumber: "999999993",
			naeringskode: "88.995",
			website: undefined,
			address: undefined,
		})
		const result = matchUnits({
			...base,
			national: new Set(["https://www.nav.no/kontor/nav-eksempel"]),
			units: [nav],
			pages: [page("https://www.nav.no/kontor/nav-eksempel", { orgNumber: "999999993" })],
		})
		expect(result.groups[0]).toMatchObject({ unitId: "org:999999993", providerType: "offentlig" })
	})
})
