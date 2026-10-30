import { describe, expect, test } from "vitest"
import { buildSearch, EMPTY_FILTERS } from "../src/services/filters.ts"
import {
	canHydrate,
	legacyRedirect,
	parseRoute,
	parseUrl,
	pathFor,
	routePath,
	switchLangPath,
	systemLang,
} from "../src/services/urlState.ts"

// "/" is the landing now that results live at /sok — see the dedicated route test below for
// the full landing/list/detail/notFound matrix. This one keeps covering detail and not-found.
test("detail and not-found routes", () => {
	expect(parseRoute("/resources/42")).toEqual({ kind: "detail", id: 42 })
	expect(parseRoute("/resources/abc")).toEqual({ kind: "notFound" })
	expect(parseRoute("/nope")).toEqual({ kind: "notFound" })
})

test("root is the landing, /sok is the list, detail and unknown are unchanged", () => {
	expect(parseRoute("/")).toEqual({ kind: "landing" })
	expect(parseRoute("/sok")).toEqual({ kind: "list" })
	expect(parseRoute("/resources/12")).toEqual({ kind: "detail", id: 12 })
	expect(parseRoute("/sok/extra")).toEqual({ kind: "notFound" })
})

describe("language prefix", () => {
	test("parseUrl strips /en and reports the language", () => {
		expect(parseUrl("/")).toEqual({ lang: "nb", route: { kind: "landing" } })
		expect(parseUrl("/en/")).toEqual({ lang: "en", route: { kind: "landing" } })
		expect(parseUrl("/en")).toEqual({ lang: "en", route: { kind: "landing" } })
		expect(parseUrl("/en/sok")).toEqual({ lang: "en", route: { kind: "list" } })
		expect(parseUrl("/en/resources/12")).toEqual({ lang: "en", route: { kind: "detail", id: 12 } })
		expect(parseUrl("/kommune/hamar")).toEqual({
			lang: "nb",
			route: { kind: "kommune", slug: "hamar" },
		})
		expect(parseUrl("/english")).toEqual({ lang: "nb", route: { kind: "notFound" } })
	})

	test("pathFor and routePath round-trip", () => {
		expect(pathFor("en", "/")).toBe("/en/")
		expect(pathFor("nb", "/sok")).toBe("/sok")
		expect(routePath({ kind: "kommune", slug: "gjovik" })).toBe("/kommune/gjovik")
		expect(switchLangPath("/resources/5", "en")).toBe("/en/resources/5")
		expect(switchLangPath("/en/sok", "nb")).toBe("/sok")
	})

	test("buildSearch never emits lang", () => {
		const search = buildSearch({
			...EMPTY_FILTERS,
			search: "nav",
			municipalities: ["3407"],
			page: 2,
		})
		expect(search).toBe("?search=nav&municipality=3407&page=2")
	})
})

describe("legacyRedirect", () => {
	test("?lang=en becomes the prefixed path with the rest of the query kept", () => {
		expect(legacyRedirect("/", "?lang=en", null)).toBe("/en/")
		expect(legacyRedirect("/sok", "?lang=en&search=nav", null)).toBe("/en/sok?search=nav")
		expect(legacyRedirect("/resources/5", "?lang=en", null)).toBe("/en/resources/5")
		expect(legacyRedirect("/en/sok", "?lang=en", null)).toBe("/en/sok")
	})
	test("?lang=nb is stripped and never redirected by the stored preference", () => {
		// "/" used to return "/" (the stripped path), which then had to reload as a fresh
		// navigation just to drop the query string — a navigation on which the stored-preference
		// rule below would fire and bounce the explicit "nb" choice to /en/. Returning null here
		// means the explicit choice is honoured with no second hop at all. /resources/5 was never
		// at risk (the stored-preference rule only ever fires on a bare "/"), so it still gets
		// the ordinary one-hop redirect that drops the query string.
		expect(legacyRedirect("/", "?lang=nb", "en")).toBeNull()
		expect(legacyRedirect("/resources/5", "?lang=nb", "en")).toBe("/resources/5")
	})
	test("pre-landing bookmarks go to /sok", () => {
		expect(legacyRedirect("/", "?search=nav&lang=en", null)).toBe("/en/sok?search=nav")
		expect(legacyRedirect("/", "?category=rus", null)).toBe("/sok?category=rus")
	})
	test("stored English preference acts only on bare /", () => {
		expect(legacyRedirect("/", "", "en")).toBe("/en/")
		expect(legacyRedirect("/", "", "nb")).toBeNull()
		expect(legacyRedirect("/sok", "", "en")).toBeNull()
		expect(legacyRedirect("/en/", "", "en")).toBeNull()
	})
	test("nothing to do returns null", () => {
		expect(legacyRedirect("/sok", "?search=nav", null)).toBeNull()
	})
	test("a stored System choice follows the browser, and only on bare /", () => {
		expect(legacyRedirect("/", "", "system", ["en-GB"])).toBe("/en/")
		expect(legacyRedirect("/", "", "system", ["nb-NO", "en"])).toBeNull()
		expect(legacyRedirect("/resources/2", "", "system", ["en-GB"])).toBeNull()
		expect(legacyRedirect("/en/", "", "system", ["nb-NO"])).toBeNull()
		expect(legacyRedirect("/", "?lang=nb", "system", ["en-GB"])).toBeNull()
	})
})

// System (#80): the first Norwegian or English entry in navigator.languages decides; a browser
// that lists neither gets English, the language most readers of a non-Norwegian browser share.
test.each([
	[["nb-NO"], "nb"],
	[["nn"], "nb"],
	[["no"], "nb"],
	[["en-GB"], "en"],
	[["pl", "nb"], "nb"],
	[["pl", "EN-us", "nb"], "en"],
	[["pl"], "en"],
	[[], "en"],
] as [string[], string][])("systemLang(%j) is %s", (languages, lang) => {
	expect(systemLang(languages)).toBe(lang)
})

// /sok is prerendered once, as the no-query page. A results URL like /sok?search=nav must not
// hydrate that markup — the client's first render is the filtered list, and React would
// throw a hydration mismatch (#418) against the unfiltered HTML. Every other route's
// prerender matches its client render exactly, including /sok with no query.
test.each([
	["/", "", true],
	["/en/", "", true],
	["/sok", "", true],
	["/en/sok", "", true],
	["/sok", "?search=nav", false],
	["/sok", "?category=nav&page=2", false],
	["/en/sok", "?search=nav", false],
	["/resources/12", "", true],
	["/kommune/hamar", "", true],
])("canHydrate(%s%s) is %s", (pathname, search, expected) => {
	expect(canHydrate(pathname, search)).toBe(expected)
})

test("/om is the About page in both languages", () => {
	expect(parseRoute("/om")).toEqual({ kind: "about" })
	expect(parseUrl("/en/om")).toEqual({ lang: "en", route: { kind: "about" } })
	expect(routePath({ kind: "about" })).toBe("/om")
})
