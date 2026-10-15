import { expect, test } from "@playwright/test"
import { setTheme, settle, THEMES } from "./helpers.ts"

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
				return {
					x: Math.round(r.left),
					w: Math.round(r.width),
					top: Math.round(r.top),
					h: Math.round(r.height),
				}
			})
		)
		expect(boxes).toHaveLength(8)
		expect(new Set(boxes.map((b) => b.x)).size).toBe(columns)
		expect(new Set(boxes.map((b) => b.w)).size).toBe(1)
		// Chips on one grid row share one height, and none is shorter than a 44 px target.
		for (const row of new Set(boxes.map((b) => b.top))) {
			const heights = boxes.filter((b) => b.top === row).map((b) => b.h)
			expect(new Set(heights).size).toBe(1)
			expect(heights[0]).toBeGreaterThanOrEqual(44)
		}
	})
}

test("the Nødtjenester chip sits on a row of its own, ending above the grid at 375 px", async ({
	page,
}) => {
	await page.setViewportSize({ width: 375, height: 900 })
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

// From 1024 px the chip sits left of the grid, centred on its two rows (decided 2026-10-15, so
// the landing fits one 1920 x 950 screen).
test("the Nødtjenester chip sits beside the grid, centred on its rows, at 1280 px", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: 900 })
	await page.goto("/")
	const acute = await page.locator(".chip-acute").evaluate((el) => {
		const r = el.getBoundingClientRect()
		return { right: r.right, middle: r.top + r.height / 2 }
	})
	const grid = await page.locator(".chip-grid").evaluate((el) => {
		const r = el.getBoundingClientRect()
		return { left: r.left, middle: r.top + r.height / 2 }
	})
	expect(acute.right).toBeLessThanOrEqual(grid.left)
	expect(Math.abs(acute.middle - grid.middle)).toBeLessThanOrEqual(1)
})

for (const width of [1280, 1920]) {
	for (const [path, first, last] of [
		["/", "der", "bor."],
		["/en/", "where", "live."],
	] as const) {
		test(`hero at ${width} px (${path}): line height 1.1, one line, last three words together`, async ({
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
			expect(m.lines).toBe(1)
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

for (const width of [320, 375, 1280]) {
	for (const path of ["/", "/en/"]) {
		test(`each emergency number stays on one line, and its text stays inside its button at ${width} px (${path})`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 900 })
			await page.goto(path)
			await settle(page)
			const buttons = await page
				.locator("section[aria-labelledby=emergency] a")
				.evaluateAll((els) =>
					els.map((el) => {
						const lineTops = (node: Node) => {
							const range = document.createRange()
							range.selectNodeContents(node)
							return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size
						}
						const box = el.getBoundingClientRect()
						const all = document.createRange()
						all.selectNodeContents(el)
						const text = all.getBoundingClientRect()
						return {
							label: el.textContent,
							numberLines: lineTops(el.firstElementChild as Element),
							pastLeft: Math.round(box.left - text.left),
							pastRight: Math.round(text.right - box.right),
						}
					})
				)
			expect(buttons).toHaveLength(4)
			for (const b of buttons) {
				expect(b.numberLines, `${b.label} number lines`).toBe(1)
				expect(b.pastLeft, `${b.label} past left`).toBeLessThanOrEqual(0)
				expect(b.pastRight, `${b.label} past right`).toBeLessThanOrEqual(0)
			}
		})
	}
}

// Decided 2026-10-15: the landing page, footer included, fits a maximised browser on a 1080p
// screen. Only at 1920; at 1280 the centred layout scrolls, and that is fine.
for (const theme of THEMES) {
	for (const path of ["/", "/en/"]) {
		test(`the landing page fits one 1920 x 950 screen (${path}, ${theme})`, async ({ page }) => {
			await setTheme(page, theme)
			await page.setViewportSize({ width: 1920, height: 950 })
			await page.goto(path)
			await settle(page)
			await page.locator(".helpline-row").first().waitFor()
			const m = await page.evaluate(() => ({
				scroll: document.documentElement.scrollHeight,
				footerBottom: Math.round(
					(document.querySelector("footer") as Element).getBoundingClientRect().bottom
				),
			}))
			expect(m.scroll).toBeLessThanOrEqual(950)
			expect(m.footerBottom).toBeLessThanOrEqual(950)
		})
	}
}

// The centred phone layout at every width replaced the two columns on 2026-10-15. These guard
// the layout itself.
for (const width of [1280, 1920]) {
	test(`the hero is centred on the page at ${width} px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 950 })
		await page.goto("/")
		await settle(page)
		const centres = await page.evaluate(() =>
			// The chip block (Nødtjenester beside the grid from 1024 px) is centred as a whole.
			["h1", "search", ".hero > div:has(> .chip-acute)"].map((s) => {
				const r = document.querySelector(s)?.getBoundingClientRect()
				return r ? Math.round(r.left + r.width / 2) : -1
			})
		)
		const middle = await page.evaluate(() => Math.round(document.documentElement.clientWidth / 2))
		for (const c of centres) expect(Math.abs(c - middle)).toBeLessThanOrEqual(1)
	})
}

for (const width of [320, 375, 1024, 1280]) {
	for (const path of ["/", "/en/"]) {
		test(`the four emergency buttons share one height of at most 64 px at ${width} px (${path})`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 900 })
			await page.goto(path)
			await settle(page)
			const heights = await page
				.locator("section[aria-labelledby=emergency] a")
				.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)))
			expect(new Set(heights).size).toBe(1)
			expect(heights[0]).toBeLessThanOrEqual(64)
		})

		test(`every helpline row lays out the same way at ${width} px (${path})`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 })
			await page.goto(path)
			await settle(page)
			const rows = await page.locator(".helpline-row").evaluateAll((els) =>
				els.map((li) => {
					const name = (li.querySelector(".helpline-name") as Element).getBoundingClientRect()
					const btn = (li.querySelector(":scope > a") as Element).getBoundingClientRect()
					return {
						left: Math.round(btn.left),
						width: Math.round(btn.width),
						below: btn.top >= name.bottom - 1,
					}
				})
			)
			expect(rows).toHaveLength(5)
			// Either every button sits under its name or none does, never a mix.
			expect(new Set(rows.map((r) => r.below)).size).toBe(1)
			if (!rows[0].below) {
				// Side by side: one shared button column, so one left edge and one width.
				expect(new Set(rows.map((r) => r.left)).size).toBe(1)
				expect(new Set(rows.map((r) => r.width)).size).toBe(1)
			}
		})
	}
}
