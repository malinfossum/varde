import { describe, expect, test } from "vitest"
import { translate } from "../src/i18n/LanguageProvider.tsx"
import { activeFilters } from "../src/services/activeFilters.ts"
import { applyPatch } from "../src/services/filters.ts"
import { catalog, f } from "./filterFixture.ts"

const nb = (key: string) => translate("nb", key)
const en = (key: string) => translate("en", key)
const everything = f({
	search: "krise",
	counties: ["34"],
	municipalities: ["0301", "3403"],
	national: "exclude",
	categories: ["bolig", "rus"],
	features: ["lavterskel", "dognapent"],
	costs: ["free", "paid"],
})

describe("activeFilters", () => {
	test("one chip per value, in URL param order, and none for the search text", () => {
		expect(activeFilters(everything, catalog, nb).map((c) => c.label)).toEqual([
			"Innlandet",
			"Oslo",
			"Hamar",
			"Skjul nasjonale",
			"Bolig",
			"Rus og avhengighet",
			"Lavterskel",
			"Døgnåpent",
			"Gratis",
			"Koster penger",
		])
	})

	// Call C1: the Egenskaper and Pris chips read the card badge strings.
	test("English labels come from the same keys", () => {
		expect(activeFilters(everything, catalog, en).map((c) => c.label)).toEqual([
			"Innlandet",
			"Oslo",
			"Hamar",
			"Hide national",
			"Housing",
			"Substance use and addiction",
			"No referral",
			"Open 24/7",
			"Free",
			"Costs money",
		])
	})

	test("each chip's patch removes its own value and nothing else", () => {
		const ids = activeFilters(everything, catalog, nb).map((c) => c.id)
		for (const chip of activeFilters(everything, catalog, nb)) {
			const next = applyPatch(everything, chip.remove)
			expect(activeFilters(next, catalog, nb).map((c) => c.id)).toEqual(
				ids.filter((id) => id !== chip.id)
			)
			expect(next.search).toBe("krise")
		}
	})

	test.each([
		["include", []],
		["exclude", ["Skjul nasjonale"]],
		["only", ["Bare nasjonale"]],
	] as const)("national %s gives %j", (national, labels) => {
		expect(activeFilters(f({ national }), catalog, nb).map((c) => c.label)).toEqual(labels)
	})

	test("Bare nasjonale reads National only in English", () => {
		expect(activeFilters(f({ national: "only" }), catalog, en).map((c) => c.label)).toEqual([
			"National only",
		])
	})

	test("a place the catalog lacks gets no chip", () => {
		expect(activeFilters(f({ counties: ["99"], municipalities: ["9999"] }), catalog, nb)).toEqual(
			[]
		)
	})

	test("search text alone gives no chip", () => {
		expect(activeFilters(f({ search: "rus" }), catalog, nb)).toEqual([])
	})
})
