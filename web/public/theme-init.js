// Runs before the stylesheet so the first paint is already the right theme. Mirrors
// src/services/theme.ts (resolveTheme / readStoredTheme) — it cannot import, so the test in
// tests/theme.test.ts evaluates this file against the same cases to keep them in step.
;(() => {
	var stored = null
	try {
		stored = window.localStorage.getItem("theme")
	} catch (_) {
		stored = null
	}
	var prefersDark =
		typeof window.matchMedia === "function" &&
		window.matchMedia("(prefers-color-scheme: dark)").matches
	var theme = stored === "dark" || stored === "light" ? stored : prefersDark ? "dark" : "light"
	document.documentElement.dataset.theme = theme
})()

// Legacy URLs and the remembered language, resolved before first paint so the HTML file that
// is served never has to be hydrated as a different page. Mirrors legacyRedirect() in
// src/services/urlState.ts; tests/theme.test.ts runs both against the same cases.
;(() => {
	var pathname = window.location.pathname
	var search = window.location.search
	var stored = null
	try {
		stored = window.localStorage.getItem("varde.lang")
	} catch (_) {
		stored = null
	}
	var params = new URLSearchParams(search)
	var filterNames = ["search", "category", "municipality", "national", "page"]
	var legacyList = pathname === "/" && filterNames.some((name) => params.has(name))
	var isEn = (p) => p === "/en" || p.indexOf("/en/") === 0
	var target = null
	var lang = params.get("lang")
	var path
	var query
	var candidate
	if (lang !== null) {
		params.delete("lang")
		path = legacyList ? "/sok" : pathname
		if (lang === "en" && !isEn(path)) path = `/en${path}`
		query = params.toString()
		candidate = query ? `${path}?${query}` : path
		// Mirrors legacyRedirect(): an explicit ?lang= choice wins, so a redirect that would only
		// strip ?lang=nb and land back on bare "/" is skipped — reloading it would let the
		// stored-preference branch below fire on that fresh navigation instead.
		if (candidate !== "/") target = candidate
	} else if (legacyList) {
		target = `/sok${search}`
	} else if (pathname === "/" && search === "" && stored === "en") {
		target = "/en/"
	}
	if (target !== null) window.location.replace(target)
})()
