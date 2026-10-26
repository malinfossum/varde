import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "vitest"
import { nationalFallbacks } from "../src/i18n/fallbacks.ts"
import { CATEGORY_SLUGS } from "../src/services/categories.ts"
import { HELPLINE_GROUPS } from "../src/services/helplines.ts"

// Two more tables copied out of the API's seed by hand, guarded the same way emergency.test.ts
// guards the acute strip: read the real C# file and fail if the copy has drifted. The fallbacks
// are the numbers shown precisely when the site's data fails to load, so nothing else can catch
// a mistake there at runtime.
// jsdom replaces the global URL constructor, and on Windows that replacement mis-resolves a
// relative path against a file:// base, so I go through node:path/node:url instead of
// `new URL("../../api/...", import.meta.url)` (same fix as tokens.test.ts/fonts.test.ts).
const seedDir = join(dirname(fileURLToPath(import.meta.url)), "../../api/Varde.Data/Seed")
const seed = readFileSync(join(seedDir, "SeedData.cs"), "utf8")
const categoriesCs = readFileSync(join(seedDir, "Categories.cs"), "utf8")

function seededResource(id: number): { name: string; phone: string } {
	// The block for one resource runs from its `Id = N,` to the next `new Resource`.
	const start = seed.indexOf(`Id = ${id},`)
	expect(start, `seed row ${id} missing`).toBeGreaterThan(-1)
	const end = seed.indexOf("new Resource", start)
	const block = seed.slice(start, end === -1 ? undefined : end)
	const name = /Name = "([^"]+)"/.exec(block)?.[1]
	const phone = /Phone = "([^"]+)"/.exec(block)?.[1]
	expect(name, `seed row ${id} has no Name`).toBeDefined()
	expect(phone, `seed row ${id} has no Phone`).toBeDefined()
	return { name: name as string, phone: phone as string }
}

test("the offline fallback list is rows 1-4 of the seed, name and number", () => {
	expect(nationalFallbacks.map((f) => f.id)).toEqual([1, 2, 3, 4])
	for (const fallback of nationalFallbacks) {
		const row = seededResource(fallback.id)
		expect(fallback.name, `fallback ${fallback.id} name`).toBe(row.name)
		expect(fallback.phone, `fallback ${fallback.id} phone`).toBe(row.phone)
	}
})

test("CATEGORY_SLUGS matches Categories.cs, same slugs in the same order", () => {
	// Only the `All` array carries Slug — Translations below it carry Name — but slice to it
	// anyway so a future property called Slug elsewhere in the file cannot leak in.
	const start = categoriesCs.indexOf("All =")
	expect(start, "Categories.cs has no All array").toBeGreaterThan(-1)
	const end = categoriesCs.indexOf("Translations =", start)
	const block = categoriesCs.slice(start, end === -1 ? undefined : end)
	const slugs = [...block.matchAll(/Slug = "([^"]+)"/g)].map((m) => m[1])
	expect(slugs).toHaveLength(10)
	expect([...CATEGORY_SLUGS]).toEqual(slugs)
})

test("every landing helpline label is part of its seed row's name", () => {
	for (const group of HELPLINE_GROUPS) {
		for (const row of group.rows) {
			expect(seededResource(row.id).name, `helpline ${row.id}`).toContain(row.name)
		}
	}
})

test("the landing's category labels match Categories.cs, soft hyphens aside", async () => {
	// The chip labels live in i18n so the landing renders without a request; the API names live
	// in Categories.cs. The nb Lavterskeltilbud label carries a soft hyphen for narrow chips,
	// which the API name does not need.
	const nb = (await import("../src/i18n/nb.json")).default as Record<string, string>
	const en = (await import("../src/i18n/en.json")).default as Record<string, string>
	const start = categoriesCs.indexOf("Translations =")
	const names = [
		...categoriesCs
			.slice(start)
			.matchAll(/CategoryId = (\w+), LanguageCode = "(nb|en)", Name = "([^"]+)"/g),
	]
	expect(names).toHaveLength(20)
	const slugByConst = Object.fromEntries(
		[...categoriesCs.matchAll(/Id = (\w+), Slug = "([^"]+)"/g)].map((m) => [m[1], m[2]])
	)
	for (const [, constName = "", lang, name] of names) {
		const strings = lang === "nb" ? nb : en
		const label = strings[`category.${slugByConst[constName]}`]
		expect(label?.replaceAll("\u00AD", ""), `${lang} ${constName}`).toBe(name)
	}
	expect(nb["category.lavterskeltilbud"]).toBe("Lavterskel\u00ADtilbud")
})
