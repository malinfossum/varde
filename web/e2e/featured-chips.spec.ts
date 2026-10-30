import { expect, type Page, test } from "@playwright/test"
import { settle } from "./helpers.ts"

// The chip block rises in with an entrance animation; boxes read mid-animation come from different
// frames, so wait for every running animation to finish before measuring.
async function settleLayout(page: Page) {
	await settle(page)
	await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)))
}

async function featured(page: Page) {
	return page.locator(".chip-featured-row .chip").evaluateAll((els) =>
		els.map((el) => {
			const r = el.getBoundingClientRect()
			return {
				left: Math.round(r.left),
				right: Math.round(r.right),
				top: Math.round(r.top),
				bottom: Math.round(r.bottom),
				width: Math.round(r.width),
				height: Math.round(r.height),
				overflows: el.scrollWidth > el.clientWidth,
			}
		})
	)
}

// The grid's first and fifth chips: the top of its first and second row (the grid is four wide
// from 768 px).
async function gridRows(page: Page) {
	return page.locator(".chip-grid .chip").evaluateAll((els) => {
		const box = (el: Element) => {
			const r = el.getBoundingClientRect()
			return { left: r.left, top: r.top, bottom: r.bottom }
		}
		return { first: box(els[0]), fifth: box(els[4]) }
	})
}

// Below 1024 px the pair is a row above the grid: side by side, one width, one height, centred
// on the grid. 1023 and 1024 sit on either side of the flip.
for (const width of [320, 768, 1023]) {
	for (const path of ["/", "/en/"]) {
		test(`the two featured chips share one row, width, height and bottom edge, centred, at ${width} px (${path})`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 900 })
			await page.goto(path)
			await settleLayout(page)
			const boxes = await featured(page)
			expect(boxes).toHaveLength(2)
			const [a, b] = boxes
			expect(a.top).toBe(b.top)
			expect(a.width).toBe(b.width)
			expect(a.height).toBe(b.height)
			expect(a.bottom).toBe(b.bottom)
			expect(a.height).toBeGreaterThanOrEqual(44)
			expect(a.overflows || b.overflows).toBe(false)
			const gridMiddle = await page.locator(".chip-grid").evaluate((el) => {
				const r = el.getBoundingClientRect()
				return (r.left + r.right) / 2
			})
			expect(Math.abs((a.left + b.right) / 2 - gridMiddle)).toBeLessThanOrEqual(1)
		})
	}
}

// From 1024 px the pair is a column beside the grid, one chip per grid row.
for (const width of [1024, 1280, 1920]) {
	for (const path of ["/", "/en/"]) {
		test(`the two featured chips stand as a column beside the grid, one per grid row, at ${width} px (${path})`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 950 })
			await page.goto(path)
			await settleLayout(page)
			const boxes = await featured(page)
			expect(boxes).toHaveLength(2)
			const [a, b] = boxes
			expect(a.left).toBe(b.left)
			expect(a.width).toBe(b.width)
			expect(a.height).toBe(b.height)
			expect(a.height).toBeGreaterThanOrEqual(44)
			expect(a.overflows || b.overflows).toBe(false)
			const grid = await gridRows(page)
			const gridLeft = await page
				.locator(".chip-grid")
				.evaluate((el) => el.getBoundingClientRect().left)
			expect(Math.abs(a.top - grid.first.top)).toBeLessThanOrEqual(1)
			expect(Math.abs(a.bottom - grid.first.bottom)).toBeLessThanOrEqual(1)
			expect(Math.abs(b.top - grid.fifth.top)).toBeLessThanOrEqual(1)
			expect(Math.abs(b.bottom - grid.fifth.bottom)).toBeLessThanOrEqual(1)
			expect(a.right).toBeLessThanOrEqual(gridLeft)
		})
	}
}

// The grid's rows can grow (a label that wraps, larger text). Forcing them taller proves the
// column follows them instead of keeping its own content height.
test("the featured column follows the grid's rows when they grow, at 1280 px", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 950 })
	await page.goto("/")
	await settleLayout(page)
	await page.addStyleTag({ content: ".chip-grid .chip { min-height: 80px; }" })
	const [a, b] = await featured(page)
	const grid = await gridRows(page)
	expect(Math.abs(a.top - grid.first.top)).toBeLessThanOrEqual(1)
	expect(Math.abs(a.bottom - grid.first.bottom)).toBeLessThanOrEqual(1)
	expect(Math.abs(b.top - grid.fifth.top)).toBeLessThanOrEqual(1)
	expect(Math.abs(b.bottom - grid.fifth.bottom)).toBeLessThanOrEqual(1)
})

for (const path of ["/", "/en/"]) {
	test(`at 200 % text on a 320 px screen the featured chips stack without overflow (${path})`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 320, height: 900 })
		await page.goto(path)
		await settleLayout(page)
		await page.evaluate(() => {
			document.documentElement.style.fontSize = "200%"
		})
		const [a, b] = await featured(page)
		expect(a.left).toBe(b.left)
		expect(b.top).toBeGreaterThanOrEqual(a.bottom)
		expect(a.overflows || b.overflows).toBe(false)
	})
}

test("the Lavterskeltilbud chip leads to a non-empty result list", async ({ page }) => {
	await page.goto("/")
	await page.locator('main a[href="/sok?feature=lavterskel"]').click()
	await expect(page).toHaveURL(/feature=lavterskel/)
	await expect(page.locator('main a[href^="/resources/"]').first()).toBeVisible()
})
