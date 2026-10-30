import { describe, expect, test } from "vitest"
import {
	applyPatch,
	buildSearch,
	CLEAR_ALL,
	categorySearch,
	EMPTY_FILTERS,
	type Filters,
	hasFilters,
	parseFilters,
	resolveFilters,
	suggestionPatch,
} from "../src/services/filters.ts"
import type { MunicipalityDto } from "../src/types/api.ts"

const parse = (search: string) => parseFilters(new URLSearchParams(search))
const municipalities: MunicipalityDto[] = [
	{ id: 1, name: "Hamar", county: "Innlandet", number: "3403", countyNumber: "34" },
	{ id: 4, name: "Ringsaker", county: "Innlandet", number: "3411", countyNumber: "34" },
	{ id: 8, name: "Oslo", county: "Oslo", number: "0301", countyNumber: "03" },
]
const counties = [
	{ number: "03", name: "Oslo" },
	{ number: "34", name: "Innlandet" },
]
const full: Filters = {
	search: "rus hamar",
	counties: ["34"],
	municipalities: ["0301"],
	national: "exclude",
	categories: ["rus"],
	features: ["lavterskel"],
	costs: ["free"],
	page: 2,
}

describe("parseFilters", () => {
	test("an empty query is the empty filter", () => {
		expect(parse("")).toEqual(EMPTY_FILTERS)
	})

	test.each([
		["?national=true", "only"],
		["?national=only", "only"],
		["?national=exclude", "exclude"],
		["?national=yes", "include"],
		["", "include"],
	])("%s reads national as %s", (search, mode) => {
		expect(parse(search).national).toBe(mode)
	})

	test("an old Lavterskeltilbud category link becomes the Lavterskel Egenskap", () => {
		expect(parse("?category=lavterskeltilbud&category=rus")).toMatchObject({
			categories: ["rus"],
			features: ["lavterskel"],
		})
	})

	test("unknown values are dropped and repeats deduplicated, in catalog order", () => {
		expect(
			parse(
				"?category=rus&category=bogus&category=okonomi&category=rus&feature=dognapent&feature=akutt&feature=lavterskel&cost=paid&cost=free&cost=cheap"
			)
		).toMatchObject({
			categories: ["okonomi", "rus"],
			features: ["lavterskel", "dognapent"],
			costs: ["free", "paid"],
		})
	})

	test("places keep only their shape here: an old id, a kommunenummer or a fylkesnummer", () => {
		expect(
			parse(
				"?municipality=1&municipality=3403&municipality=abc&municipality=340&municipality=0&county=34&county=3&county=034"
			)
		).toMatchObject({ municipalities: ["1", "3403"], counties: ["34"] })
	})

	test("Bare nasjonale wins over Sted in one URL, as the old toggle did", () => {
		expect(parse("?national=true&municipality=1&county=34")).toMatchObject({
			national: "only",
			municipalities: [],
			counties: [],
		})
	})

	test("page is a positive integer, else 1", () => {
		expect(parse("?page=3").page).toBe(3)
		expect(parse("?page=0").page).toBe(1)
		expect(parse("?page=x").page).toBe(1)
	})
})

describe("resolveFilters", () => {
	test.each([
		["1", "3403"],
		["4", "3411"],
		["8", "0301"],
	])("old id %s maps to kommunenummer %s", (id, number) => {
		const resolved = resolveFilters(parse(`?municipality=${id}`), municipalities, counties)
		expect(resolved.municipalities).toEqual([number])
	})

	test("a place without data is dropped, so the list widens", () => {
		const resolved = resolveFilters(
			parse("?municipality=99&municipality=3420&county=50"),
			municipalities,
			counties
		)
		expect(resolved).toMatchObject({ municipalities: [], counties: [] })
	})

	test("an old id and its kommunenummer collapse to one pick, in number order", () => {
		const resolved = resolveFilters(
			parse("?municipality=3411&municipality=1&municipality=3403&municipality=8"),
			municipalities,
			counties
		)
		expect(resolved.municipalities).toEqual(["0301", "3403", "3411"])
	})

	test("a renumbered kommune follows the correspondence table", () => {
		// A made-up row: the real table arrives with spec B (storage).
		const resolved = resolveFilters(parse("?municipality=9999"), municipalities, counties, {
			"9999": "3403",
		})
		expect(resolved.municipalities).toEqual(["3403"])
	})
})

describe("buildSearch", () => {
	test("writes the params in one fixed order", () => {
		expect(buildSearch(full)).toBe(
			"?search=rus+hamar&county=34&municipality=0301&national=exclude&category=rus&feature=lavterskel&cost=free&page=2"
		)
	})

	test("the empty filter is no query at all", () => {
		expect(buildSearch(EMPTY_FILTERS)).toBe("")
	})

	test.each([
		"?search=%C3%A6%C3%B8%C3%A5+rus&municipality=3403&category=rus",
		"?county=34&national=exclude&feature=dognapent&cost=partly&page=4",
	])("parse then build gives the same URL: %s", (search) => {
		expect(buildSearch(parse(search))).toBe(search)
	})

	test("two orders of the same params build one URL", () => {
		expect(buildSearch(parse("?category=rus&municipality=3403&category=bolig"))).toBe(
			buildSearch(parse("?municipality=3403&category=bolig&category=rus"))
		)
	})
})

describe("applyPatch", () => {
	const base: Filters = { ...EMPTY_FILTERS, page: 3 }

	test("choosing Bare nasjonale clears the Sted picks", () => {
		expect(
			applyPatch({ ...base, municipalities: ["3403"], counties: ["34"] }, { national: "only" })
		).toMatchObject({ national: "only", municipalities: [], counties: [] })
	})

	test("picking a place while Bare nasjonale is on switches the radio back to Ta med", () => {
		expect(applyPatch({ ...base, national: "only" }, { municipalities: ["3403"] })).toMatchObject({
			national: "include",
			municipalities: ["3403"],
		})
	})

	test("Skjul keeps the Sted picks", () => {
		expect(
			applyPatch({ ...base, municipalities: ["3403"] }, { national: "exclude" })
		).toMatchObject({ national: "exclude", municipalities: ["3403"] })
	})

	test("any filter change resets the page, a page change keeps it", () => {
		expect(applyPatch(base, { costs: ["free"] }).page).toBe(1)
		expect(applyPatch(base, { page: 5 }).page).toBe(5)
	})

	test("values come back deduplicated and in catalog order", () => {
		expect(
			applyPatch(base, {
				categories: ["rus", "bolig", "rus"],
				municipalities: ["3411", "3403", "3411"],
				features: ["dognapent", "lavterskel"],
			})
		).toMatchObject({
			categories: ["bolig", "rus"],
			municipalities: ["3403", "3411"],
			features: ["lavterskel", "dognapent"],
		})
	})

	test("CLEAR_ALL clears every filter and the search text", () => {
		expect(applyPatch(full, CLEAR_ALL)).toEqual(EMPTY_FILTERS)
	})
})

describe("picks and links", () => {
	const current: Filters = { ...EMPTY_FILTERS, categories: ["rus"], municipalities: ["0301"] }

	test("a suggestion adds to the filter instead of replacing it", () => {
		expect(
			applyPatch(current, suggestionPatch(current, { kind: "category", slug: "bolig" }))
		).toMatchObject({ categories: ["bolig", "rus"] })
		expect(
			applyPatch(current, suggestionPatch(current, { kind: "municipality", number: "3403" }))
		).toMatchObject({ municipalities: ["0301", "3403"] })
	})

	test("a Lavterskeltilbud suggestion ticks the Lavterskel Egenskap", () => {
		expect(
			applyPatch(current, suggestionPatch(current, { kind: "category", slug: "lavterskeltilbud" }))
		).toMatchObject({ categories: ["rus"], features: ["lavterskel"] })
	})

	test("a category link goes to its category, Lavterskeltilbud to the Egenskap", () => {
		expect(categorySearch("rus")).toBe("?category=rus")
		expect(categorySearch("lavterskeltilbud")).toBe("?feature=lavterskel")
	})

	test("hasFilters ignores the page", () => {
		expect(hasFilters({ ...EMPTY_FILTERS, page: 4 })).toBe(false)
		expect(hasFilters({ ...EMPTY_FILTERS, costs: ["paid"] })).toBe(true)
	})
})
