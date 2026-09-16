import { describe, expect, test } from "vitest"
import {
	applyQuery,
	compareResources,
	matchesMunicipality,
	matchesSearch,
	PAGE_SIZE,
} from "../src/services/query.ts"
import type { ResourceDto } from "../src/types/api.ts"

const row = (over: Partial<ResourceDto>): ResourceDto => ({
	id: 1,
	name: "NAV Hamar",
	description: "Økonomisk rådgivning",
	isFallbackTranslation: false,
	openingHours: null,
	isNational: false,
	isAlwaysOpen: false,
	municipalityId: 1,
	municipalityName: "Hamar",
	address: null,
	phone: null,
	email: null,
	website: null,
	chatUrl: null,
	lastVerified: "2026-08-17",
	categories: [],
	servedMunicipalityIds: [],
	...over,
})

describe("query mirrors ResourceRepository.SearchAsync", () => {
	test("municipality matches own or served", () => {
		expect(matchesMunicipality(row({ municipalityId: 1 }), 1)).toBe(true)
		expect(matchesMunicipality(row({ municipalityId: 9, servedMunicipalityIds: [1] }), 1)).toBe(
			true
		)
		expect(matchesMunicipality(row({ municipalityId: 9 }), 1)).toBe(false)
	})
	test("search is a trimmed case-insensitive substring on name or description, no folding", () => {
		expect(matchesSearch(row({}), "  hamar ")).toBe(true)
		expect(matchesSearch(row({}), "RÅDGIVNING")).toBe(true)
		expect(matchesSearch(row({}), "radgivning")).toBe(false)
	})
	test("order is local first, then name (nb collation), then id", () => {
		const rows = [
			row({ id: 3, name: "Ørn", isNational: true }),
			row({ id: 2, name: "Åsen" }),
			row({ id: 1, name: "Åsen" }),
			row({ id: 4, name: "Ask" }),
		]
		expect([...rows].sort(compareResources).map((r) => r.id)).toEqual([4, 1, 2, 3])
	})
	test("national wins over municipality, categories are any-of, pages are 20", () => {
		const rows = Array.from({ length: 25 }, (_, i) =>
			row({
				id: i + 1,
				name: `R${String(i + 1).padStart(2, "0")}`,
				isNational: i % 5 === 0,
				categories: [
					{ id: 1, slug: i % 2 ? "rus" : "bolig", name: "", isFallbackTranslation: false },
				],
			})
		)
		const page2 = applyQuery(rows, {
			search: "",
			categories: [],
			municipality: null,
			national: false,
			page: 2,
		})
		expect(page2.pageSize).toBe(PAGE_SIZE)
		expect(page2.totalCount).toBe(25)
		expect(page2.items).toHaveLength(5)
		const national = applyQuery(rows, {
			search: "",
			categories: [],
			municipality: 1,
			national: true,
			page: 1,
		})
		expect(national.items.every((r) => r.isNational)).toBe(true)
		const rus = applyQuery(rows, {
			search: "",
			categories: ["rus", "nope"],
			municipality: null,
			national: false,
			page: 1,
		})
		expect(rus.totalCount).toBe(12)
	})
	// The C# repository's municipality branch is `MunicipalityId == id || IsNational ||
	// ServedMunicipalities.Any(...)` (ResourceRepository.cs SearchAsync) — a municipality filter
	// is local-plus-national, not local-only. Mirrors the API's own
	// Municipality_filter_includes_national_services test.
	test("municipality filter includes national services (local plus national)", () => {
		const rows = [
			row({ id: 1, name: "Hamar Krisesenter", municipalityId: 1, isNational: false }),
			row({ id: 2, name: "Gjøvik Krisesenter", municipalityId: 2, isNational: false }),
			row({ id: 3, name: "Mental Helse", municipalityId: null, isNational: true }),
		]
		const result = applyQuery(rows, {
			search: "",
			categories: [],
			municipality: 1,
			national: false,
			page: 1,
		})
		expect(result.totalCount).toBe(2)
		expect(result.items.map((r) => r.name)).toEqual(["Hamar Krisesenter", "Mental Helse"])
	})
})
