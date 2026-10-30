import { afterEach, describe, expect, test, vi } from "vitest"
import { clearIndexCache, loadIndex, readPageData } from "../src/services/data.ts"
import { stubDataFiles } from "./stubData.ts"

afterEach(() => {
	clearIndexCache()
	vi.unstubAllGlobals()
	document.getElementById("varde-data")?.remove()
})

describe("loadIndex", () => {
	test("loads the six files for a language once and caches", async () => {
		stubDataFiles({
			municipalities: [
				{ id: 1, name: "Hamar", county: "Innlandet", number: "3403", countyNumber: "34" },
			],
		})
		const first = await loadIndex("nb")
		const second = await loadIndex("nb")
		expect(first.municipalities[0]?.name).toBe("Hamar")
		expect(second).toBe(first)
		expect((fetch as ReturnType<typeof vi.fn>).mock.calls).toHaveLength(6)
	})
	test("the index carries the fylke list and the alias list", async () => {
		clearIndexCache()
		stubDataFiles({ counties: [{ number: "34", name: "Innlandet" }], aliases: [] })
		const index = await loadIndex("nb")
		expect(index.counties).toEqual([{ number: "34", name: "Innlandet" }])
		expect(index.aliases).toEqual([])
	})
	test("any failed file rejects the whole load", async () => {
		vi.stubGlobal("fetch", async () => new Response("", { status: 500 }))
		await expect(loadIndex("en")).rejects.toThrow()
	})
})

describe("readPageData", () => {
	test("returns null without the block and parses it when present", () => {
		expect(readPageData()).toBeNull()
		const script = document.createElement("script")
		script.type = "application/json"
		script.id = "varde-data"
		script.textContent = JSON.stringify({ resource: { id: 7 } })
		document.body.append(script)
		expect(readPageData()?.resource?.id).toBe(7)
	})
})
