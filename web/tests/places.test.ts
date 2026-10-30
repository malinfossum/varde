import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, test } from "vitest"
import { attachNumbers, checkPlaces, readPlaceFiles } from "../scripts/places.mjs"

// jsdom replaces the global URL constructor and mis-resolves a relative file:// URL on Windows,
// so paths go through node:path, as in seedDrift.test.ts.
const here = dirname(fileURLToPath(import.meta.url))
const dataDir = join(here, "../data")
const seed = readFileSync(join(here, "../../api/Varde.Data/Seed/SeedData.cs"), "utf8")
const oslo = { number: "03", name: "Oslo" }
const innlandet = { number: "34", name: "Innlandet" }
const hamar = { id: 1, number: "3403", countyNumber: "34", name: "Hamar" }
const osloKommune = { id: 8, number: "0301", countyNumber: "03", name: "Oslo" }

describe("the committed place files", () => {
	test("pass the guard", () => {
		const { places, counties, aliases } = readPlaceFiles(dataDir)
		expect(checkPlaces(places, counties, aliases)).toEqual([])
	})

	test("hold today's eight kommuner with the KLASS numbers from the spec, in number order", () => {
		const { places, counties, aliases } = readPlaceFiles(dataDir)
		expect(places.map((p) => `${p.id} ${p.name} ${p.number} ${p.countyNumber}`)).toEqual([
			"8 Oslo 0301 03",
			"1 Hamar 3403 34",
			"2 Lillehammer 3405 34",
			"3 Gjøvik 3407 34",
			"4 Ringsaker 3411 34",
			"6 Løten 3412 34",
			"5 Stange 3413 34",
			"7 Elverum 3420 34",
		])
		expect(counties).toEqual([oslo, innlandet])
		expect(aliases).toEqual([])
	})

	// The export fails on a kommune the place files lack. This catches it in the PR that adds the
	// kommune to the seed, instead of at deploy.
	test("hold every kommune the API seeds, with the same id and name", () => {
		const consts = new Map(
			[...seed.matchAll(/private const int (\w+) = (\d+);/g)].map((m) => [m[1], Number(m[2])])
		)
		const seeded = [...seed.matchAll(/new Municipality \{ Id = (\w+), Name = "([^"]+)"/g)].map(
			(m) => `${consts.get(m[1]) ?? Number(m[1])} ${m[2]}`
		)
		// Count every seeded kommune from the file text, so a regex that misses one row fails here.
		const declared = seed.match(/new Municipality \{/g)?.length ?? 0
		expect(declared).toBeGreaterThan(0)
		expect(seeded.length).toBe(declared)
		const placeKeys = readPlaceFiles(dataDir).places.map((p) => `${p.id} ${p.name}`)
		for (const kommune of seeded) expect(placeKeys).toContain(kommune)
	})
})

describe("checkPlaces", () => {
	test("rejects a kommune filed under the wrong fylke", () => {
		expect(checkPlaces([{ ...hamar, countyNumber: "03" }], [oslo, innlandet], [])).toEqual([
			"Hamar: 3403 does not start with fylke 03",
		])
	})

	test.each([
		[[{ ...hamar, number: "340" }], [innlandet], "Hamar: kommunenummer 340 is not 4 digits"],
		[[hamar], [oslo], "Hamar: fylke 34 is not in counties.json"],
		[[hamar, osloKommune], [oslo, innlandet], "Oslo: 0301 breaks the rising number order"],
		[[{ ...osloKommune, id: 1 }, hamar], [oslo, innlandet], "Hamar: id 1 is used twice"],
		[[], [{ number: "3", name: "Rar" }], "fylke Rar: number 3 is not 2 digits"],
		[[], [innlandet, oslo], "fylke Oslo: 03 breaks the rising number order"],
	])("rejects broken place data (%#)", (places, counties, message) => {
		expect(checkPlaces(places, counties, [])).toEqual([message])
	})

	test("rejects an alias that points nowhere or names no source", () => {
		expect(
			checkPlaces(
				[hamar],
				[innlandet],
				[
					{ alias: "Brumunddal", number: "3411", source: "SSB tettsteder" },
					{ alias: "Hamar sentrum", number: "3403", source: "" },
				]
			)
		).toEqual(["alias Brumunddal: 3411 is not in places.json", "alias Hamar sentrum: no source"])
	})
})

describe("attachNumbers", () => {
	test("adds kommunenummer and fylkesnummer by id", () => {
		expect(attachNumbers([{ id: 1, name: "Hamar", county: "Innlandet" }], [hamar])).toEqual([
			{ id: 1, name: "Hamar", county: "Innlandet", number: "3403", countyNumber: "34" },
		])
	})

	test("fails on a kommune the place files lack", () => {
		expect(() => attachNumbers([{ id: 9, name: "Tom", county: "Innlandet" }], [hamar])).toThrow(
			"places.json has no entry for municipality 9 Tom"
		)
	})

	test("fails when the place files and the API disagree on a name", () => {
		expect(() => attachNumbers([{ id: 1, name: "Hamr", county: "Innlandet" }], [hamar])).toThrow(
			'places.json names municipality 1 "Hamar", the API says "Hamr"'
		)
	})
})
