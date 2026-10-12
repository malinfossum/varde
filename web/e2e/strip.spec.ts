import { expect, type Page, test } from "@playwright/test"
import { noHorizontalScroll, settle } from "./helpers.ts"

type Cell = { top: number; left: number; width: number; labelHeight: number; lineHeight: number }

const cells = (page: Page): Promise<Cell[]> =>
	page.locator(".acute-strip > li").evaluateAll((items) =>
		items.map((li) => {
			const r = li.getBoundingClientRect()
			const label = li.querySelector("span")
			return {
				top: Math.round(r.top),
				left: Math.round(r.left),
				width: Math.round(r.width),
				labelHeight: label ? label.getBoundingClientRect().height : 0,
				lineHeight: label ? Number.parseFloat(getComputedStyle(label).lineHeight) : 0,
			}
		})
	)

// Spec: Acute strip on phones. 110 and 112 on the first row, 113 and 116 117 on the second,
// "Alle nødtjenester" below, and no label over two lines at 320 px in either language.
for (const width of [320, 375]) {
	for (const path of ["/", "/en/"]) {
		test(`the strip at ${width} px (${path}) is 2 x 2 with no label over two lines`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 800 })
			await page.goto(path)
			await settle(page)
			const [a, b, c, d, more] = await cells(page)
			expect(a.top).toBe(b.top)
			expect(c.top).toBe(d.top)
			expect(c.top).toBeGreaterThan(a.top)
			expect(a.left).toBe(c.left)
			expect(b.left).toBe(d.left)
			// Two equal columns. The "Alle nødtjenester" item spans both, which would otherwise make
			// the grid grow a second, content-sized column by itself.
			expect(Math.abs(a.width - b.width)).toBeLessThanOrEqual(1)
			expect(more.top).toBeGreaterThan(c.top)
			for (const cell of [a, b, c, d]) {
				expect(cell.labelHeight).toBeLessThanOrEqual(2 * cell.lineHeight + 1)
			}
			expect(await noHorizontalScroll(page)).toBe(true)
		})
	}
}

test("from 768 px the strip is one row", async ({ page }) => {
	for (const path of ["/", "/en/"]) {
		await page.setViewportSize({ width: 768, height: 800 })
		await page.goto(path)
		await settle(page)
		const tops = new Set((await cells(page)).map((cell) => cell.top))
		expect(tops.size, path).toBe(1)
	}
})
