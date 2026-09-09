import { expect, test } from "vitest"
import {
	applyPatch,
	buildSearch,
	isLegacyListUrl,
	parseFilters,
	parseRoute,
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
	expect(buildSearch({ ...base, municipality: 4, national: true }, null)).not.toContain(
		"municipality"
	)
})

test("root is the landing, /sok is the list, detail and unknown are unchanged", () => {
	expect(parseRoute("/")).toEqual({ kind: "landing" })
	expect(parseRoute("/sok")).toEqual({ kind: "list" })
	expect(parseRoute("/resources/12")).toEqual({ kind: "detail", id: 12 })
	expect(parseRoute("/sok/extra")).toEqual({ kind: "notFound" })
})

test("legacy list URLs are those with a filter parameter; lang alone is the landing", () => {
	const p = (s: string) => new URLSearchParams(s)
	expect(isLegacyListUrl("/", p("search=rus"))).toBe(true)
	expect(isLegacyListUrl("/", p("category=nodtjenester"))).toBe(true)
	expect(isLegacyListUrl("/", p("municipality=1"))).toBe(true)
	expect(isLegacyListUrl("/", p("national=true"))).toBe(true)
	expect(isLegacyListUrl("/", p("page=2"))).toBe(true)
	expect(isLegacyListUrl("/", p("lang=en"))).toBe(false)
	expect(isLegacyListUrl("/", p(""))).toBe(false)
	expect(isLegacyListUrl("/sok", p("search=rus"))).toBe(false)
})
