import { expect, test } from "vitest"
import { fold, matchesEitherWay, suggest } from "../src/services/match.ts"

const catalog = {
	municipalities: [
		{ id: 1, name: "Hamar", county: "Innlandet", number: "3403", countyNumber: "34" },
		{ id: 6, name: "Løten", county: "Innlandet", number: "3412", countyNumber: "34" },
	],
	categories: [
		{ id: 4, slug: "rus", name: "Rus", isFallbackTranslation: false },
		{ id: 2, slug: "bolig", name: "Bolig", isFallbackTranslation: false },
	],
	kommuner: [],
	counties: [],
	aliases: [],
}

test("fold normalises norwegian letters and case", () => {
	expect(fold("Løten")).toBe("loten")
	expect(fold("GJØVIK")).toBe("gjovik")
	expect(fold("Nærbø")).toBe("naerbo")
	expect(fold("Hamar")).toBe("hamar")
})

test("containment matches both directions", () => {
	expect(matchesEitherWay("rusbehandling", "Rus")).toBe(true) // query contains name
	expect(matchesEitherWay("ham", "Hamar")).toBe(true) // name contains query
	expect(matchesEitherWay("bolig", "Rus")).toBe(false)
})

test("suggest finds kommuner and categories, ignores short queries", () => {
	expect(suggest("h", catalog)).toEqual([])
	expect(suggest("loten", catalog)).toEqual([
		{ kind: "municipality", number: "3412", name: "Løten" },
	])
	expect(suggest("rusbehandling", catalog)).toEqual([
		{ kind: "category", slug: "rus", name: "Rus" },
	])
})

test("typing lavterskel suggests the category by its API name", () => {
	const lavCatalog = {
		...catalog,
		categories: [
			{ id: 10, slug: "lavterskeltilbud", name: "Lavterskeltilbud", isFallbackTranslation: false },
		],
	}
	expect(suggest("lavterskel", lavCatalog)).toContainEqual({
		kind: "category",
		slug: "lavterskeltilbud",
		name: "Lavterskeltilbud",
	})
})
