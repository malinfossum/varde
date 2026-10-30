import type { MunicipalityDto, ResourceCost } from "../types/api.ts"
import { CATEGORY_SLUGS } from "./categories.ts"
import type { County } from "./data.ts"

// The /sok filter's state and its URL (filter spec, Filter model). Place numbers stay strings,
// because the leading zero in "0301" and "03" matters.

export const NATIONAL_MODES = ["include", "exclude", "only"] as const
export type NationalMode = (typeof NATIONAL_MODES)[number]
export const FEATURES = ["lavterskel", "dognapent"] as const
export type Feature = (typeof FEATURES)[number]
export const COSTS = ["free", "partly", "paid"] as const satisfies readonly ResourceCost[]

// Lavterskeltilbud is reached through the Lavterskel Egenskap, never as a category, and an old
// link's category=lavterskeltilbud parses to feature=lavterskel (filter spec, decision 5).
export const FILTER_CATEGORY_SLUGS: readonly string[] = CATEGORY_SLUGS.filter(
	(slug) => slug !== "lavterskeltilbud"
)

export type Filters = {
	search: string
	counties: string[]
	municipalities: string[]
	national: NationalMode
	categories: string[]
	features: Feature[]
	costs: ResourceCost[]
	page: number
}

export const CLEAR_ALL: Omit<Filters, "page"> = {
	search: "",
	counties: [],
	municipalities: [],
	national: "include",
	categories: [],
	features: [],
	costs: [],
}
export const EMPTY_FILTERS: Filters = { ...CLEAR_ALL, page: 1 }

// The keys whose change sends the list back to page 1.
const FILTER_KEYS = [
	"search",
	"counties",
	"municipalities",
	"national",
	"categories",
	"features",
	"costs",
] as const

// An old database id is one or two digits; a kommunenummer is four.
const OLD_ID_OR_NUMBER = /^(?:[1-9]\d?|\d{4})$/
const COUNTY_NUMBER = /^\d{2}$/

// Keeps the known values, once each, in the order given. That one step validates, dedupes and
// puts a list in catalog order.
function inOrder<T extends string>(order: readonly T[], values: readonly string[]): T[] {
	return order.filter((value) => values.includes(value))
}

function sortedUnique(values: readonly string[]): string[] {
	return [...new Set(values)].sort()
}

function positiveInt(value: string | null): number | null {
	if (value === null || !/^\d+$/.test(value)) return null
	const parsed = Number(value)
	return parsed > 0 ? parsed : null
}

// Reads what the URL alone can tell. Places are kept by shape only here: whether "1" is Hamar
// or "3420" has data needs the catalog, which resolveFilters adds once it has loaded.
export function parseFilters(params: URLSearchParams): Filters {
	const categories = params.getAll("category")
	const features = params.getAll("feature")
	if (categories.includes("lavterskeltilbud")) features.push("lavterskel")
	const rawNational = params.get("national")
	const national: NationalMode =
		rawNational === "only" || rawNational === "true"
			? "only"
			: rawNational === "exclude"
				? "exclude"
				: "include"
	// Bare nasjonale and Sted exclude each other. A URL with both keeps Bare nasjonale, as the
	// old national toggle did.
	const only = national === "only"
	return {
		search: params.get("search") ?? "",
		counties: only
			? []
			: sortedUnique(params.getAll("county").filter((v) => COUNTY_NUMBER.test(v))),
		municipalities: only
			? []
			: sortedUnique(params.getAll("municipality").filter((v) => OLD_ID_OR_NUMBER.test(v))),
		national,
		categories: inOrder(FILTER_CATEGORY_SLUGS, categories),
		features: inOrder(FEATURES, features),
		costs: inOrder(COSTS, params.getAll("cost")),
		page: positiveInt(params.get("page")) ?? 1,
	}
}

// Maps the places onto the catalog: an old database id becomes its kommunenummer, a renumbered
// kommune its new number, and a place without data is dropped, so the link widens instead of
// breaking (filter spec, Old links).
export function resolveFilters(
	filters: Filters,
	municipalities: readonly MunicipalityDto[],
	counties: readonly County[],
	renumbered: Readonly<Record<string, string>> = {}
): Filters {
	const known = new Set(municipalities.map((m) => m.number))
	const byOldId = new Map(municipalities.map((m) => [String(m.id), m.number]))
	const mapped = filters.municipalities
		.map((value) => (value.length <= 2 ? byOldId.get(value) : (renumbered[value] ?? value)))
		.filter((number): number is string => number !== undefined && known.has(number))
	const countyNumbers = new Set(counties.map((c) => c.number))
	return {
		...filters,
		municipalities: sortedUnique(mapped),
		counties: filters.counties.filter((number) => countyNumbers.has(number)),
	}
}

// One filter state, one URL: the params in a fixed order, the values as the state holds them
// (parseFilters and applyPatch keep them in catalog order).
export function buildSearch(filters: Filters): string {
	const params = new URLSearchParams()
	if (filters.search) params.set("search", filters.search)
	for (const number of filters.counties) params.append("county", number)
	for (const number of filters.municipalities) params.append("municipality", number)
	if (filters.national !== "include") params.set("national", filters.national)
	for (const slug of filters.categories) params.append("category", slug)
	for (const feature of filters.features) params.append("feature", feature)
	for (const cost of filters.costs) params.append("cost", cost)
	if (filters.page > 1) params.set("page", String(filters.page))
	const query = params.toString()
	return query ? `?${query}` : ""
}

export function applyPatch(filters: Filters, patch: Partial<Filters>): Filters {
	const next: Filters = { ...filters, ...patch }
	if (patch.national === "only") {
		next.counties = []
		next.municipalities = []
	} else if (
		next.national === "only" &&
		(next.counties.length > 0 || next.municipalities.length > 0)
	) {
		next.national = "include"
	}
	next.counties = sortedUnique(next.counties)
	next.municipalities = sortedUnique(next.municipalities)
	next.categories = inOrder(FILTER_CATEGORY_SLUGS, next.categories)
	next.features = inOrder(FEATURES, next.features)
	next.costs = inOrder(COSTS, next.costs)
	if (FILTER_KEYS.some((key) => key in patch) && patch.page === undefined) next.page = 1
	return next
}

// What a picked search suggestion or a category link adds. Lavterskeltilbud ticks the
// Egenskap instead of a category (filter spec, decision 5).
export type FilterPick =
	| { kind: "municipality"; number: string }
	| { kind: "category"; slug: string }

export function suggestionPatch(filters: Filters, pick: FilterPick): Partial<Filters> {
	if (pick.kind === "municipality")
		return { municipalities: [...filters.municipalities, pick.number] }
	if (pick.slug === "lavterskeltilbud") return { features: [...filters.features, "lavterskel"] }
	return { categories: [...filters.categories, pick.slug] }
}

export function categorySearch(slug: string): string {
	return buildSearch(
		applyPatch(EMPTY_FILTERS, suggestionPatch(EMPTY_FILTERS, { kind: "category", slug }))
	)
}

export function hasFilters(filters: Filters): boolean {
	return buildSearch({ ...filters, page: 1 }) !== ""
}
