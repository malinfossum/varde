import { expect, test } from "@playwright/test"
import { noHorizontalScroll, settle } from "./helpers.ts"

type Tile = {
	label: string
	top: number
	left: number
	height: number
	bottom: number
	inside: boolean
}

// Each tile's box, and whether its two text lines stay inside it (no overflow, no clipping).
async function measureTiles(page: import("@playwright/test").Page): Promise<Tile[]> {
	return page.locator(".contact-tile").evaluateAll((els) =>
		els.map((el) => {
			const box = el.getBoundingClientRect()
			const lines = [".contact-tile-label", ".contact-tile-value"].map(
				(s) => el.querySelector(s) as HTMLElement
			)
			return {
				label: el.textContent ?? "",
				top: Math.round(box.top),
				left: Math.round(box.left),
				height: Math.round(box.height),
				bottom: Math.round(box.bottom),
				inside: lines.every((line) => {
					const r = line.getBoundingClientRect()
					return (
						line.scrollWidth <= line.clientWidth &&
						r.right <= box.right + 0.5 &&
						r.bottom <= box.bottom + 0.5
					)
				}),
			}
		})
	)
}

// Spec C2a: Mental Helse's page has three tiles, including the longest child name, in both
// languages. Tiles in a row share one height and both edges; one column below 768 px, two from it.
for (const width of [375, 1024]) {
	for (const path of ["/resources/1", "/en/resources/1"]) {
		test(`contact tiles line up and keep their text inside at ${width} px (${path})`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 900 })
			await page.goto(path)
			await settle(page)
			const tiles = await measureTiles(page)
			expect(tiles).toHaveLength(3)
			expect(new Set(tiles.map((t) => t.left)).size).toBe(width >= 768 ? 2 : 1)
			for (const top of new Set(tiles.map((t) => t.top))) {
				const row = tiles.filter((t) => t.top === top)
				expect(new Set(row.map((t) => t.height)).size).toBe(1)
				expect(new Set(row.map((t) => t.bottom)).size).toBe(1)
			}
			for (const t of tiles) {
				expect(t.height, t.label).toBeGreaterThanOrEqual(69)
				expect(t.inside, t.label).toBe(true)
			}
		})
	}
}

for (const [label, width, fontSize] of [
	["320 px", 320, "100%"],
	["200 % text at 375 px", 375, "200%"],
] as const) {
	test(`the tile grid reflows at ${label}`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 })
		await page.goto("/resources/1")
		await page.addStyleTag({ content: `html { font-size: ${fontSize} }` })
		await page.evaluate(() => document.fonts.ready)
		const tiles = await measureTiles(page)
		expect(tiles).toHaveLength(3)
		for (const t of tiles) expect(t.inside, t.label).toBe(true)
		expect(await noHorizontalScroll(page)).toBe(true)
	})
}

test("each contact tile keeps a visible border in forced-colors mode", async ({ page }) => {
	await page.emulateMedia({ forcedColors: "active" })
	await page.goto("/resources/1")
	const borders = await page
		.locator(".contact-tile")
		.evaluateAll((els) =>
			els.map(
				(el) => `${getComputedStyle(el).borderTopStyle} ${getComputedStyle(el).borderTopWidth}`
			)
		)
	expect(borders).toHaveLength(3)
	for (const b of borders) expect(b).toBe("solid 1px")
})
