export type Lang = "nb" | "en"

export type Route =
	| { kind: "landing" }
	| { kind: "list" }
	| { kind: "detail"; id: number }
	| { kind: "kommune"; slug: string }
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

function isLegacyListUrl(pathname: string, params: URLSearchParams): boolean {
	return pathname === "/" && FILTER_PARAMS.some((name) => params.has(name))
}

export function parseRoute(pathname: string): Route {
	if (pathname === "/") return { kind: "landing" }
	if (pathname === "/sok") return { kind: "list" }
	const detail = pathname.match(/^\/resources\/(\d+)$/)
	if (detail) return { kind: "detail", id: Number(detail[1]) }
	const kommune = pathname.match(/^\/kommune\/([a-z0-9-]+)$/)
	if (kommune) return { kind: "kommune", slug: kommune[1] }
	return { kind: "notFound" }
}

// The language lives in the path: /en/... is English, everything else Norwegian.
export function parseUrl(pathname: string): { lang: Lang; route: Route } {
	const en = pathname === "/en" || pathname.startsWith("/en/")
	const rest = en ? pathname.slice(3) || "/" : pathname
	return { lang: en ? "en" : "nb", route: parseRoute(rest) }
}

export function langPrefix(lang: Lang): "" | "/en" {
	return lang === "en" ? "/en" : ""
}

export function pathFor(lang: Lang, path: string): string {
	return `${langPrefix(lang)}${path}`
}

export function routePath(route: Route): string {
	switch (route.kind) {
		case "landing":
			return "/"
		case "list":
			return "/sok"
		case "detail":
			return `/resources/${route.id}`
		case "kommune":
			return `/kommune/${route.slug}`
		case "notFound":
			return "/404"
	}
}

export function switchLangPath(pathname: string, to: Lang): string {
	return pathFor(to, routePath(parseUrl(pathname).route))
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

export function buildSearch(filters: Filters): string {
	const params = new URLSearchParams()
	if (filters.search) params.set("search", filters.search)
	for (const slug of filters.categories) params.append("category", slug)
	if (filters.national) params.set("national", "true")
	else if (filters.municipality !== null) params.set("municipality", String(filters.municipality))
	if (filters.page > 1) params.set("page", String(filters.page))
	const query = params.toString()
	return query ? `?${query}` : ""
}

// Mirrored in public/theme-init.js, which cannot import. tests/theme.test.ts runs both
// against the same cases. Returns the URL to location.replace() to, or null.
export function legacyRedirect(
	pathname: string,
	search: string,
	storedLang: string | null
): string | null {
	const params = new URLSearchParams(search)
	const lang = params.get("lang")
	const legacyList = isLegacyListUrl(pathname, params)
	if (lang !== null) {
		params.delete("lang")
		let path = legacyList ? "/sok" : pathname
		if (lang === "en" && !(path === "/en" || path.startsWith("/en/"))) path = pathFor("en", path)
		const query = params.toString()
		return query ? `${path}?${query}` : path
	}
	if (legacyList) return `/sok${search}`
	if (pathname === "/" && search === "" && storedLang === "en") return "/en/"
	return null
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
