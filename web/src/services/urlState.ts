export type Route =
	| { kind: "landing" }
	| { kind: "list" }
	| { kind: "detail"; id: number }
	| { kind: "notFound" }

export type Filters = {
	search: string
	categories: string[]
	municipality: number | null
	national: boolean
	page: number
}

// The parameters that mean "this is a results URL". `lang` is deliberately absent: /?lang=en
// is the English landing, and the language toggle must never bounce a visitor into results.
export const FILTER_PARAMS = ["search", "category", "municipality", "national", "page"] as const

export function isLegacyListUrl(pathname: string, params: URLSearchParams): boolean {
	return pathname === "/" && FILTER_PARAMS.some((name) => params.has(name))
}

export function parseRoute(pathname: string): Route {
	if (pathname === "/") return { kind: "landing" }
	if (pathname === "/sok") return { kind: "list" }
	const match = pathname.match(/^\/resources\/(\d+)$/)
	if (match) return { kind: "detail", id: Number(match[1]) }
	return { kind: "notFound" }
}

function positiveInt(value: string | null): number | null {
	if (value === null || !/^\d+$/.test(value)) return null
	const parsed = Number(value)
	return parsed > 0 ? parsed : null
}

export function parseFilters(params: URLSearchParams): Filters {
	return {
		search: params.get("search") ?? "",
		categories: params.getAll("category"),
		municipality: positiveInt(params.get("municipality")),
		national: params.get("national") === "true",
		page: positiveInt(params.get("page")) ?? 1,
	}
}

export function buildSearch(filters: Filters, lang: string | null): string {
	const params = new URLSearchParams()
	if (filters.search) params.set("search", filters.search)
	for (const slug of filters.categories) params.append("category", slug)
	if (filters.national) params.set("national", "true")
	else if (filters.municipality !== null) params.set("municipality", String(filters.municipality))
	if (filters.page > 1) params.set("page", String(filters.page))
	if (lang) params.set("lang", lang)
	const query = params.toString()
	return query ? `?${query}` : ""
}

export function applyPatch(filters: Filters, patch: Partial<Filters>): Filters {
	const next = { ...filters, ...patch }
	if (patch.municipality !== undefined && patch.municipality !== null) next.national = false
	if (patch.national) next.municipality = null
	const filterKeys: (keyof Filters)[] = ["search", "categories", "municipality", "national"]
	const filterChanged = filterKeys.some((key) => key in patch)
	if (filterChanged && patch.page === undefined) next.page = 1
	return next
}
