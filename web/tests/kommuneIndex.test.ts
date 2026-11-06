import { expect, test } from "vitest"
import { splitForKommune } from "../src/components/KommunePage.tsx"
import type { KommuneEntry } from "../src/services/data.ts"
import { buildKommuneIndex } from "../src/services/kommuneIndex.ts"
import type { ResourceDto } from "../src/types/api.ts"

const k = (id: number, name: string, county: string): KommuneEntry => ({
	id,
	slug: name.toLowerCase(),
	name,
	county,
	number: String(3400 + id),
})
const r = (id: number, over: Partial<ResourceDto>) =>
	({
		id,
		name: `R${id}`,
		isNational: false,
		municipalityId: null,
		servedMunicipalityIds: [],
		...over,
	}) as ResourceDto

const kommuner = [
	k(1, "Hamar", "Innlandet"),
	k(2, "Elverum", "Innlandet"),
	k(3, "Oslo", "Oslo"),
	k(4, "Ålesund", "Møre og Romsdal"),
	k(5, "Fredrikstad", "Østfold"),
	k(6, "Bergen", "Vestland"),
]
const resources = [
	r(1, { municipalityId: 1 }),
	r(2, { municipalityId: 9, servedMunicipalityIds: [1, 2] }),
	r(3, { isNational: true }),
	r(4, { municipalityId: 3 }),
]

test("groups by fylke and sorts fylker and kommuner A-Å the Norwegian way", () => {
	const index = buildKommuneIndex(kommuner, resources)
	expect(index.groups.map((g) => g.county)).toEqual([
		"Innlandet",
		"Møre og Romsdal",
		"Oslo",
		"Vestland",
		"Østfold",
	])
	expect(index.groups[0]?.kommuner.map((x) => x.name)).toEqual(["Elverum", "Hamar"])
})

test("each count equals the kommune page's own local list, served rows included", () => {
	const index = buildKommuneIndex(kommuner, resources)
	for (const entry of kommuner) {
		const shown = index.groups.flatMap((g) => g.kommuner).find((x) => x.slug === entry.slug)
		expect(shown?.count).toBe(splitForKommune(entry, resources).local.length)
	}
	expect(index.groups[0]?.kommuner).toEqual([
		{ slug: "elverum", name: "Elverum", count: 1 },
		{ slug: "hamar", name: "Hamar", count: 2 },
	])
})

test("counts national rows once, and zero when there are none", () => {
	expect(buildKommuneIndex(kommuner, resources).national).toBe(1)
	expect(
		buildKommuneIndex(
			kommuner,
			resources.filter((x) => !x.isNational)
		).national
	).toBe(0)
})

test("the input order of rows and kommuner does not change the result", () => {
	const a = buildKommuneIndex(kommuner, resources)
	const b = buildKommuneIndex([...kommuner].reverse(), [...resources].reverse())
	expect(b).toEqual(a)
})

test("no kommuner gives no groups", () => {
	expect(buildKommuneIndex([], resources)).toEqual({ groups: [], national: 1 })
})
