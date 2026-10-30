import { describe, expect, test } from "vitest"
import { facetCounts } from "../src/services/facets.ts"
import type { Filters } from "../src/services/filters.ts"
import { applyFilters } from "../src/services/query.ts"
import { f, places, rows } from "./filterFixture.ts"

describe("facetCounts: the list each option would give if ticked, every other tick kept", () => {
	test("with nothing ticked, each option counts the rows it alone would show", () => {
		const counts = facetCounts(rows, f(), places)
		expect(counts.categories.rus).toBe(3)
		expect(counts.categories.bolig).toBe(1)
		expect(counts.categories.okonomi).toBe(0)
		expect(counts.features).toEqual({ lavterskel: 1, dognapent: 1 })
		expect(counts.costs).toEqual({ free: 1, partly: 0, paid: 0 })
		expect(counts.national).toEqual({ include: 5, exclude: 4, only: 1 })
	})

	test("an any-of group widens: with Rus ticked, Bolig counts rows that are rus or bolig", () => {
		const counts = facetCounts(rows, f({ categories: ["rus"] }), places)
		expect(counts.categories.bolig).toBe(4)
		expect(counts.categories.rus).toBe(3)
	})

	test("Egenskaper narrow: with Døgnåpent ticked, Lavterskel counts rows that are both", () => {
		expect(facetCounts(rows, f({ features: ["dognapent"] }), places).features).toEqual({
			lavterskel: 0,
			dognapent: 1,
		})
	})

	test("the radio counts the list with that option chosen; Bare nasjonale ignores Sted", () => {
		expect(facetCounts(rows, f({ counties: ["34"] }), places).national).toEqual({
			include: 4,
			exclude: 3,
			only: 1,
		})
	})

	test("search narrows every count", () => {
		expect(facetCounts(rows, f({ search: "e" }), places).national).toEqual({
			include: 1,
			exclude: 0,
			only: 1,
		})
	})

	test("Lavterskeltilbud has no category count", () => {
		expect("lavterskeltilbud" in facetCounts(rows, f(), places).categories).toBe(false)
	})

	test.each<Partial<Filters>>([
		{ categories: ["rus", "bolig"] },
		{ features: ["lavterskel"] },
		{ costs: ["free"] },
		{ municipalities: ["0301"], categories: ["rus"] },
		{ national: "exclude", counties: ["34"] },
	])("a ticked option shows the list as it is now (%o)", (over) => {
		const filters = f(over)
		const total = applyFilters(rows, filters, places).totalCount
		const counts = facetCounts(rows, filters, places)
		for (const slug of filters.categories) expect(counts.categories[slug]).toBe(total)
		for (const feature of filters.features) expect(counts.features[feature]).toBe(total)
		for (const cost of filters.costs) expect(counts.costs[cost]).toBe(total)
		expect(counts.national[filters.national]).toBe(total)
	})
})
