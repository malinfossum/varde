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
for (const width of [320, 375, 767]) {
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

// Spec: Acute strip on phones, and WCAG 1.4.4. With the browser text size at 200 % (which scales
// every rem) the columns drop to one instead of printing a label over a number. The root font
// size is set from script after load, as a reader's setting would be.
type Box = { name: string; left: number; right: number; top: number; bottom: number }

const stripBoxes = (page: Page): Promise<Box[]> =>
	page.locator(".acute-strip").evaluate((ul) =>
		[...ul.querySelectorAll("a, span")].map((el) => {
			const r = el.getBoundingClientRect()
			return {
				name: (el.textContent ?? "").trim(),
				left: r.left,
				right: r.right,
				top: r.top,
				bottom: r.bottom,
			}
		})
	)

for (const width of [320, 360, 375, 767]) {
	for (const path of ["/sok", "/en/sok"]) {
		test(`with text at 200 % the strip at ${width} px (${path}) has no label over a number and stays inside the viewport`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 800 })
			await page.goto(path)
			await settle(page)
			await page.evaluate(() => {
				document.documentElement.style.fontSize = "200%"
			})
			const boxes = await stripBoxes(page)
			expect(boxes.length).toBeGreaterThan(8)
			for (const [i, a] of boxes.entries()) {
				for (const b of boxes.slice(i + 1)) {
					const overlaps =
						a.left < b.right - 1 &&
						b.left < a.right - 1 &&
						a.top < b.bottom - 1 &&
						b.top < a.bottom - 1
					expect(overlaps, `"${a.name}" overlaps "${b.name}"`).toBe(false)
				}
			}
			// The strip itself never reaches past the viewport. The page as a whole is not asserted: at
			// this text size the /sok filter panel is wider than a phone on its own (measured at 375 px,
			// with the strip not among the wide elements), which is outside the strip.
			const stripScrolls = await page
				.locator(".acute-strip")
				.evaluate((ul) => ul.scrollWidth > ul.clientWidth)
			expect(stripScrolls).toBe(false)
			for (const box of boxes) expect(box.right, box.name).toBeLessThanOrEqual(width + 1)
		})
	}
}
