import { expect, test } from "vitest"
import { FEATURED_SLUGS, GRID_SLUGS } from "../src/services/categories.ts"

test("the featured row leads with Nødtjenester, then Lavterskeltilbud", () => {
	expect(FEATURED_SLUGS).toEqual(["nodtjenester", "lavterskeltilbud"])
})

test("GRID_SLUGS is every other category, in Categories.cs order", () => {
	expect(GRID_SLUGS).toEqual([
		"okonomi",
		"bolig",
		"psykisk-helse",
		"rus",
		"vold-og-overgrep",
		"familie-og-barn",
		"arbeid",
		"juridisk-hjelp",
	])
})
