import { describe, expect, test } from "vitest"
import {
	applyPatch,
	buildSearch,
	legacyRedirect,
	parseFilters,
	parseRoute,
	parseUrl,
	pathFor,
	routePath,
	switchLangPath,
} from "../src/services/urlState.ts"

// "/" is the landing now that results live at /sok — see the dedicated route test below for
// the full landing/list/detail/notFound matrix. This one keeps covering detail and not-found.
test("detail and not-found routes", () => {
	expect(parseRoute("/resources/42")).toEqual({ kind: "detail", id: 42 })
	expect(parseRoute("/resources/abc")).toEqual({ kind: "notFound" })
	expect(parseRoute("/nope")).toEqual({ kind: "notFound" })
})

test("filters parse defensively", () => {
	const filters = parseFilters(
		new URLSearchParams("search=rus&category=rus&category=bolig&municipality=4&page=3")
	)
	expect(filters).toEqual({
		search: "rus",
		categories: ["rus", "bolig"],
		municipality: 4,
		national: false,
		page: 3,
	})
	const junk = parseFilters(new URLSearchParams("municipality=abc&page=-1&national=whatever"))
	expect(junk.municipality).toBeNull()
	expect(junk.page).toBe(1)
	expect(junk.national).toBe(false)
})

test("any filter change resets page to 1", () => {
	const base: ReturnType<typeof parseFilters> = {
		search: "",
		categories: [],
		municipality: null,
		national: false,
		page: 3,
	}
	expect(applyPatch(base, { search: "nav" }).page).toBe(1)
	expect(applyPatch(base, { categories: ["rus"] }).page).toBe(1)
	expect(applyPatch(base, { page: 4 }).page).toBe(4) // explicit paging does not reset itself
})

test("municipality and national are mutually exclusive", () => {
	const base = { search: "", categories: [], municipality: null, national: true, page: 1 }
	const picked = applyPatch(base, { municipality: 4 })
	expect(picked.national).toBe(false)
	const backToNational = applyPatch(picked, { national: true })
	expect(backToNational.municipality).toBeNull()
	expect(buildSearch({ ...base, municipality: 4, national: true })).not.toContain("municipality")
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
			search: "nav",
			categories: [],
			municipality: 3,
			national: false,
			page: 2,
		})
		expect(search).toBe("?search=nav&municipality=3&page=2")
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
})
