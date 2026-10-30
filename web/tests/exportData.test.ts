import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, expect, test, vi } from "vitest"
import { exportData, MIN_RESOURCES } from "../scripts/export-data.mjs"

const dirs: string[] = []
afterEach(() => {
	for (const d of dirs) rmSync(d, { recursive: true, force: true })
})

function fakeApi(total: number, extra: (id: number) => object = () => ({})) {
	const rows = Array.from({ length: total }, (_, i) => ({
		id: i + 1,
		name: `R${i + 1}`,
		municipalityId: (i % 3) + 1,
		servedMunicipalityIds: [],
		...extra(i + 1),
	}))
	return vi.fn(async (input: string) => {
		const url = new URL(input, "http://api")
		if (url.pathname === "/api/municipalities")
			return Response.json([
				{ id: 1, name: "Hamar", county: "Innlandet" },
				{ id: 2, name: "Gjøvik", county: "Innlandet" },
				{ id: 3, name: "Oslo", county: "Oslo" },
				{ id: 4, name: "Tom", county: "Innlandet" },
			])
		if (url.pathname === "/api/categories")
			return Response.json([{ id: 1, slug: "rus", name: "Rus" }])
		if (url.pathname === "/api/resources") {
			const page = Number(url.searchParams.get("page") ?? "1")
			const size = Number(url.searchParams.get("pageSize"))
			expect(size).toBe(100)
			const items = rows.slice((page - 1) * size, page * size)
			return Response.json({ items, page, pageSize: size, totalCount: total })
		}
		return new Response("nope", { status: 404 })
	})
}

type FakePlace = { id: number; number: string; countyNumber: string; name: string }
// The fake API's four kommuner. "Tom" is made up for these tests, and so is its number.
const FAKE_PLACES: FakePlace[] = [
	{ id: 3, number: "0301", countyNumber: "03", name: "Oslo" },
	{ id: 1, number: "3403", countyNumber: "34", name: "Hamar" },
	{ id: 2, number: "3407", countyNumber: "34", name: "Gjøvik" },
	{ id: 4, number: "3499", countyNumber: "34", name: "Tom" },
]

function fakePlaces(places: FakePlace[] = FAKE_PLACES): string {
	const dir = mkdtempSync(join(tmpdir(), "varde-places-"))
	dirs.push(dir)
	writeFileSync(join(dir, "places.json"), JSON.stringify(places))
	writeFileSync(
		join(dir, "counties.json"),
		JSON.stringify([
			{ number: "03", name: "Oslo" },
			{ number: "34", name: "Innlandet" },
		])
	)
	writeFileSync(join(dir, "aliases.json"), "[]")
	return dir
}

const readOut = (dir: string, name: string) => JSON.parse(readFileSync(join(dir, name), "utf8"))

test("walks every page, writes eight files and the slug map", async () => {
	const outDir = mkdtempSync(join(tmpdir(), "varde-export-"))
	dirs.push(outDir)
	const log = vi.fn()
	const result = await exportData({
		baseUrl: "http://api",
		outDir,
		fetchImpl: fakeApi(150) as unknown as typeof fetch,
		log,
		placesDir: fakePlaces(),
	})
	expect(result).toEqual({ resources: { nb: 150, en: 150 }, kommuner: 3 })
	expect(JSON.parse(readFileSync(join(outDir, "resources.nb.json"), "utf8"))).toHaveLength(150)
	expect(
		JSON.parse(readFileSync(join(outDir, "kommuner.json"), "utf8")).map(
			(k: { slug: string }) => k.slug
		)
	).toEqual(["hamar", "gjoevik", "oslo"])
	for (const name of [
		"resources.en.json",
		"municipalities.json",
		"categories.nb.json",
		"categories.en.json",
		"counties.json",
		"aliases.json",
	])
		expect(() => readFileSync(join(outDir, name))).not.toThrow()
	// Counts only, never row contents: the Actions log is public.
	expect(log.mock.calls.flat().join(" ")).not.toContain("R1")
})

test("refuses to write below the row floor", async () => {
	const outDir = mkdtempSync(join(tmpdir(), "varde-export-"))
	dirs.push(outDir)
	await expect(
		exportData({
			baseUrl: "http://api",
			outDir,
			fetchImpl: fakeApi(MIN_RESOURCES - 1) as unknown as typeof fetch,
			log: () => {},
			placesDir: fakePlaces(),
		})
	).rejects.toThrow(/row floor/)
	expect(() => readFileSync(join(outDir, "resources.nb.json"))).toThrow()
})

test("parent links and menu options reach both languages' files untouched", async () => {
	const outDir = mkdtempSync(join(tmpdir(), "varde-export-"))
	dirs.push(outDir)
	const api = fakeApi(MIN_RESOURCES, (id) => ({
		parentId: id === 9 ? 1 : null,
		phoneMenuOption: id === 9 ? 3 : null,
		isLowThreshold: false,
		cost: null,
		costNote: null,
	}))
	await exportData({
		baseUrl: "http://api",
		outDir,
		fetchImpl: api as unknown as typeof fetch,
		log: () => {},
		placesDir: fakePlaces(),
	})
	for (const lang of ["nb", "en"]) {
		const rows = JSON.parse(readFileSync(join(outDir, `resources.${lang}.json`), "utf8")) as {
			id: number
		}[]
		expect(rows.find((r) => r.id === 9)).toMatchObject({ parentId: 1, phoneMenuOption: 3 })
		expect(rows.find((r) => r.id === 1)).toMatchObject({ parentId: null, phoneMenuOption: null })
	}
})

test("attaches kommunenummer and fylkesnummer from the place files", async () => {
	const outDir = mkdtempSync(join(tmpdir(), "varde-export-"))
	dirs.push(outDir)
	await exportData({
		baseUrl: "http://api",
		outDir,
		fetchImpl: fakeApi(150) as unknown as typeof fetch,
		log: vi.fn(),
		placesDir: fakePlaces(),
	})
	expect(readOut(outDir, "municipalities.json")[0]).toEqual({
		id: 1,
		name: "Hamar",
		county: "Innlandet",
		number: "3403",
		countyNumber: "34",
	})
	expect(readOut(outDir, "kommuner.json").map((k: { number: string }) => k.number)).toEqual([
		"3403",
		"3407",
		"0301",
	])
	expect(readOut(outDir, "counties.json")).toEqual([
		{ number: "03", name: "Oslo" },
		{ number: "34", name: "Innlandet" },
	])
	expect(readOut(outDir, "aliases.json")).toEqual([])
})

test("refuses to export place files that fail the guard", async () => {
	const outDir = mkdtempSync(join(tmpdir(), "varde-export-"))
	dirs.push(outDir)
	const broken = FAKE_PLACES.map((p) => (p.name === "Hamar" ? { ...p, countyNumber: "03" } : p))
	await expect(
		exportData({
			baseUrl: "http://api",
			outDir,
			fetchImpl: fakeApi(150) as unknown as typeof fetch,
			log: vi.fn(),
			placesDir: fakePlaces(broken),
		})
	).rejects.toThrow("Hamar: 3403 does not start with fylke 03")
})

test("refuses to export when the API has a kommune the place files lack", async () => {
	const outDir = mkdtempSync(join(tmpdir(), "varde-export-"))
	dirs.push(outDir)
	await expect(
		exportData({
			baseUrl: "http://api",
			outDir,
			fetchImpl: fakeApi(150) as unknown as typeof fetch,
			log: vi.fn(),
			placesDir: fakePlaces(FAKE_PLACES.filter((p) => p.name !== "Tom")),
		})
	).rejects.toThrow("places.json has no entry for municipality 4 Tom")
})
