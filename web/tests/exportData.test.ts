import { mkdtempSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, expect, test, vi } from "vitest"
import { exportData, MIN_RESOURCES } from "../scripts/export-data.mjs"

const dirs: string[] = []
afterEach(() => {
	for (const d of dirs) rmSync(d, { recursive: true, force: true })
})

function fakeApi(total: number) {
	const rows = Array.from({ length: total }, (_, i) => ({
		id: i + 1,
		name: `R${i + 1}`,
		municipalityId: (i % 3) + 1,
		servedMunicipalityIds: [],
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

test("walks every page, writes six files and the slug map", async () => {
	const outDir = mkdtempSync(join(tmpdir(), "varde-export-"))
	dirs.push(outDir)
	const log = vi.fn()
	const result = await exportData({
		baseUrl: "http://api",
		outDir,
		fetchImpl: fakeApi(150) as unknown as typeof fetch,
		log,
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
		})
	).rejects.toThrow(/row floor/)
	expect(() => readFileSync(join(outDir, "resources.nb.json"))).toThrow()
})
