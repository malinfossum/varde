import { expect, test } from "vitest"
import { buildResourcesUrl } from "../src/services/api.ts"

test("builds a bare list url with only lang", () => {
	expect(buildResourcesUrl({ lang: "nb" })).toBe("/api/resources?lang=nb")
})

test("encodes search, categories, municipality and page", () => {
	const url = buildResourcesUrl({
		search: "vold i nære",
		categories: ["rus", "bolig"],
		municipality: 4,
		lang: "en",
		page: 2,
	})
	expect(url).toBe(
		"/api/resources?search=vold+i+n%C3%A6re&category=rus&category=bolig&municipality=4&lang=en&page=2"
	)
})

test("national and municipality are never emitted together", () => {
	const url = buildResourcesUrl({ municipality: 4, national: true, lang: "nb" })
	expect(url).toContain("national=true")
	expect(url).not.toContain("municipality")
})
