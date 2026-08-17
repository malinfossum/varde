import { expect, test } from "vitest"
import { applyPatch, buildSearch, parseFilters, parseRoute } from "../src/services/urlState.ts"

test("routes: list, detail, not-found", () => {
	expect(parseRoute("/")).toEqual({ kind: "list" })
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
