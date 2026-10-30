import { describe, expect, test } from "vitest"
import {
	applyFilters,
	applyQuery,
	compareResources,
	matchesMunicipality,
	matchesSearch,
	PAGE_SIZE,
	pickedIds,
} from "../src/services/query.ts"
import type { ResourceDto } from "../src/types/api.ts"
import { f, hamarRus, places, rows } from "./filterFixture.ts"

const row = (over: Partial<ResourceDto>): ResourceDto => ({
	id: 1,
	name: "NAV Hamar",
	description: "Økonomisk rådgivning",
	isFallbackTranslation: false,
	openingHours: null,
	isNational: false,
	isAlwaysOpen: false,
	isLowThreshold: false,
	cost: null,
	costNote: null,
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
	parentId: null,
	phoneMenuOption: null,
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

describe("applyFilters", () => {
	const ids = (over: Parameters<typeof f>[0]) =>
		applyFilters(rows, f(over), places).items.map((r) => r.id)

	test.each([
		["no filter: every row, local first", {}, [1, 2, 3, 4, 5]],
		["a kommune: located there, serving it, or national", { municipalities: ["3403"] }, [1, 4, 5]],
		["a fylke expands to its kommuner", { counties: ["34"] }, [1, 2, 4, 5]],
		["two kommuner are a union", { municipalities: ["0301", "3411"] }, [2, 3, 4, 5]],
		["Skjul drops national rows", { municipalities: ["3403"], national: "exclude" }, [1, 4]],
		["Skjul with no place starts from every row", { national: "exclude" }, [1, 2, 3, 4]],
		["Bare nasjonale", { national: "only" }, [5]],
		["Kategorier are any-of", { categories: ["bolig", "rus"] }, [1, 2, 3, 5]],
		["one Egenskap", { features: ["lavterskel"] }, [3]],
		["Egenskaper are all-of", { features: ["lavterskel", "dognapent"] }, []],
		["Pris drops rows with no stated cost", { costs: ["free"] }, [5]],
		["search narrows", { search: "c" }, [3]],
		[
			"groups AND together",
			{ municipalities: ["0301"], categories: ["rus"], features: ["lavterskel"] },
			[3],
		],
	] as const)("%s", (_, over, expected) => {
		expect(ids(over as Parameters<typeof f>[0])).toEqual(expected)
	})

	test("a local row with no kommune and no served kommuner drops out under any Sted pick", () => {
		const orphan = {
			...hamarRus,
			id: 9,
			name: "F",
			municipalityId: null,
			servedMunicipalityIds: [],
		}
		expect(applyFilters([orphan], f(), places).totalCount).toBe(1)
		expect(applyFilters([orphan], f({ counties: ["34"] }), places).totalCount).toBe(0)
		expect(applyFilters([orphan], f({ municipalities: ["3403"] }), places).totalCount).toBe(0)
	})

	test("pages through the sorted rows", () => {
		const many = Array.from({ length: 25 }, (_, i) => ({
			...hamarRus,
			id: i + 1,
			name: `R${String(i + 1).padStart(2, "0")}`,
		}))
		const page2 = applyFilters(many, f({ page: 2 }), places)
		expect(page2.totalCount).toBe(25)
		expect(page2.items.map((r) => r.id)).toEqual([21, 22, 23, 24, 25])
	})
})

describe("pickedIds", () => {
	test("no pick is null, a fylke and a kommune add up", () => {
		expect(pickedIds(f(), places)).toBeNull()
		expect(
			[...(pickedIds(f({ counties: ["03"], municipalities: ["3411"] }), places) ?? [])].sort()
		).toEqual([4, 8])
	})
})
