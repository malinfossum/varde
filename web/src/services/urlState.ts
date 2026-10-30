export type Lang = "nb" | "en"

export type Route =
	| { kind: "landing" }
	| { kind: "list" }
	| { kind: "about" }
	| { kind: "detail"; id: number }
	| { kind: "kommune"; slug: string }
	| { kind: "notFound" }

// The parameters that mean "this is a results URL". `lang` is deliberately absent: /?lang=en
// is the English landing, and the language toggle must never bounce a visitor into results.
export const FILTER_PARAMS = ["search", "category", "municipality", "national", "page"] as const

function isLegacyListUrl(pathname: string, params: URLSearchParams): boolean {
	return pathname === "/" && FILTER_PARAMS.some((name) => params.has(name))
}

export function parseRoute(pathname: string): Route {
	if (pathname === "/") return { kind: "landing" }
	if (pathname === "/sok") return { kind: "list" }
	if (pathname === "/om") return { kind: "about" }
	const detail = pathname.match(/^\/resources\/(\d+)$/)
	if (detail) return { kind: "detail", id: Number(detail[1]) }
	const slug = pathname.match(/^\/kommune\/([a-z0-9-]+)$/)?.[1]
	if (slug) return { kind: "kommune", slug }
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
		case "about":
			return "/om"
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

// The language a stored System choice resolves to (#80): the first Norwegian or English entry in
// navigator.languages decides. A browser that lists neither gets English. Mirrored in the inline
// init script in index.html.
export function systemLang(languages: readonly string[]): Lang {
	for (const tag of languages) {
		const primary = tag.toLowerCase().split("-")[0]
		if (primary === "nb" || primary === "nn" || primary === "no") return "nb"
		if (primary === "en") return "en"
	}
	return "en"
}

// Mirrored in the inline init script in index.html, which cannot import. tests/theme.test.ts runs both
// against the same cases. Returns the URL to location.replace() to, or null.
export function legacyRedirect(
	pathname: string,
	search: string,
	storedLang: string | null,
	browserLanguages: readonly string[] = []
): string | null {
	const params = new URLSearchParams(search)
	const lang = params.get("lang")
	const legacyList = isLegacyListUrl(pathname, params)
	if (lang !== null) {
		params.delete("lang")
		let path = legacyList ? "/sok" : pathname
		if (lang === "en" && !(path === "/en" || path.startsWith("/en/"))) path = pathFor("en", path)
		const query = params.toString()
		const target = query ? `${path}?${query}` : path
		// An explicit ?lang= choice always wins, even over a stored preference for the other
		// language. Stripping ?lang=nb from the bare landing page lands back on "/" with no
		// query — exactly the shape the stored-preference rule below is watching for. Redirecting
		// there would reload it as a fresh navigation, on which that rule would then fire and
		// bounce the explicit "nb" choice straight to /en/. Nothing else this function returns
		// can land back on "/" (an /en path only ever grows a prefix, /sok only from legacyList),
		// so this is the one case that needs skipping — leave the query string in place instead.
		if (target === "/") return null
		return target
	}
	if (legacyList) return `/sok${search}`
	const remembered = storedLang === "system" ? systemLang(browserLanguages) : storedLang
	if (pathname === "/" && search === "" && remembered === "en") return "/en/"
	return null
}

// /sok is prerendered once, as the no-query page. A results URL (/sok?search=…) must render
// from scratch: the client's first render is the filtered list, and hydrating it against the
// unfiltered HTML would throw a mismatch (React #418). Every other route's prerender matches
// its client render exactly.
export function canHydrate(pathname: string, search: string): boolean {
	return !(parseUrl(pathname).route.kind === "list" && search !== "")
}
