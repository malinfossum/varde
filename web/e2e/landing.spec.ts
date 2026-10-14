import { expect, test } from "@playwright/test"
import { settle } from "./helpers.ts"

for (const [width, columns] of [
	[375, 2],
	[1280, 4],
] as const) {
	test(`the eight category chips sit in ${columns} equal columns at ${width} px`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 900 })
		await page.goto("/")
		const boxes = await page.locator(".chip-grid .chip").evaluateAll((els) =>
			els.map((el) => {
				const r = el.getBoundingClientRect()
				return { x: Math.round(r.left), w: Math.round(r.width) }
			})
		)
		expect(boxes).toHaveLength(8)
		expect(new Set(boxes.map((b) => b.x)).size).toBe(columns)
		expect(new Set(boxes.map((b) => b.w)).size).toBe(1)
	})

	test(`the Nødtjenester chip sits on a row of its own, ending above the grid at ${width} px`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 900 })
		await page.goto("/")
		const acuteBottom = await page
			.locator(".chip-acute")
			.evaluate((el) => el.getBoundingClientRect().bottom)
		const gridTop = await page
			.locator(".chip-grid .chip")
			.first()
			.evaluate((el) => el.getBoundingClientRect().top)
		expect(acuteBottom).toBeLessThanOrEqual(gridTop)
	})
}

for (const width of [1280, 1920]) {
	for (const [path, first, last] of [
		["/", "der", "bor."],
		["/en/", "where", "live."],
	] as const) {
		test(`hero at ${width} px (${path}): line height 1.1, two lines, last three words together`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 950 })
			await page.goto(path)
			await settle(page)
			const m = await page.locator("h1").evaluate(
				(h1, words) => {
					const s = getComputedStyle(h1)
					const lineHeight = Number.parseFloat(s.lineHeight)
					const text = h1.firstChild as Text
					const top = (word: string) => {
						const at = text.data.indexOf(word)
						const range = document.createRange()
						range.setStart(text, at)
						range.setEnd(text, at + word.length)
						return range.getBoundingClientRect().top
					}
					return {
						ratio: lineHeight / Number.parseFloat(s.fontSize),
						lines: Math.round(h1.getBoundingClientRect().height / lineHeight),
						firstTop: top(words[0]),
						lastTop: top(words[1]),
					}
				},
				[first, last]
			)
			expect(m.ratio).toBeCloseTo(1.1, 2)
			expect(m.lines).toBe(2)
			expect(m.firstTop).toBe(m.lastTop)
		})
	}
}

for (const width of [320, 375, 1280]) {
	for (const path of ["/", "/en/"]) {
		test(`the four emergency buttons form a 2 x 2 grid of equal rows at ${width} px (${path})`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 900 })
			await page.goto(path)
			await settle(page)
			const boxes = await page.locator("section[aria-labelledby=emergency] a").evaluateAll((els) =>
				els.map((el) => {
					const r = el.getBoundingClientRect()
					return {
						top: Math.round(r.top),
						left: Math.round(r.left),
						height: Math.round(r.height),
						bottom: Math.round(r.bottom),
					}
				})
			)
			expect(boxes).toHaveLength(4)
			expect(new Set(boxes.map((b) => b.top)).size).toBe(2)
			expect(new Set(boxes.map((b) => b.left)).size).toBe(2)
			for (const row of [boxes.slice(0, 2), boxes.slice(2)]) {
				expect(row[0].height).toBe(row[1].height)
				expect(row[0].bottom).toBe(row[1].bottom)
			}
		})
	}
}
