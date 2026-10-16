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

for (const width of [320, 375, 768]) {
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

// From 1024 px the help sections sit in a block narrower than the chip row, and the emergency
// numbers stack as one list of equal rows (decided 2026-10-16).
for (const width of [1024, 1280, 1920]) {
	test(`the emergency buttons stack as one list, and the help block is narrower than the chips, at ${width} px`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 950 })
		await page.goto("/")
		await settle(page)
		const m = await page.evaluate(() => {
			const box = (s: string) => (document.querySelector(s) as Element).getBoundingClientRect()
			const buttons = [...document.querySelectorAll("section[aria-labelledby=emergency] a")].map(
				(el) => el.getBoundingClientRect()
			)
			return {
				lefts: new Set(buttons.map((b) => Math.round(b.left))).size,
				heights: new Set(buttons.map((b) => Math.round(b.height))).size,
				helpWidth: Math.round(box(".landing-help > div").width),
				chipsWidth: Math.round(box(".hero > div:has(> .chip-acute)").width),
			}
		})
		expect(m.lefts).toBe(1)
		expect(m.heights).toBe(1)
		expect(m.helpWidth).toBeLessThan(m.chipsWidth)
	})
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

// Decided 2026-10-16: on a window taller than 900 px the landing's gaps grow with the height
// (--air in main.css), so the extra height does not collect as an empty band above the footer.
for (const path of ["/", "/en/"]) {
	test(`the landing page fills a 1638 x 1286 window (${path})`, async ({ page }) => {
		await page.setViewportSize({ width: 1638, height: 1286 })
		await page.goto(path)
		await settle(page)
		await page.locator(".helpline-row").first().waitFor()
		const m = await page.evaluate(() => {
			const box = (s: string) => (document.querySelector(s) as Element).getBoundingClientRect()
			return {
				headerToH1: Math.round(box("h1").top - box("header").bottom),
				chipsToDivider: Math.round(
					box(".landing-help").top - box(".hero > div:has(> .chip-acute)").bottom
				),
				helpToFooter: Math.round(box("footer").top - box(".helpline-groups").bottom),
			}
		})
		expect(m.headerToH1).toBeGreaterThanOrEqual(120)
		expect(m.chipsToDivider).toBeGreaterThanOrEqual(120)
		expect(m.helpToFooter).toBeLessThanOrEqual(120)
	})
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
	}
}

// Spec C2a: the help sections share their rows, and both helpline groups share their button
// columns, so edges line up across the divider and across the groups.
for (const width of [1024, 1280, 1920]) {
	test(`the help sections share their rows at ${width} px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 950 })
		await page.goto("/")
		await settle(page)
		await page.locator(".helpline-row").first().waitFor()
		const m = await page.evaluate(() => {
			const top = (s: string) => (document.querySelector(s) as Element).getBoundingClientRect().top
			return [
				[top("#emergency"), top("#helplines")],
				[
					top("section[aria-labelledby=emergency] > p"),
					top("section[aria-labelledby=helplines] > p"),
				],
				[top("section[aria-labelledby=emergency] > ul"), top(".helpline-groups")],
			]
		})
		for (const [left, right] of m) expect(Math.abs(left - right)).toBeLessThanOrEqual(1)
	})

	test(`the helpline buttons share their columns across both groups at ${width} px`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 950 })
		await page.goto("/")
		await settle(page)
		await page.locator(".helpline-row").first().waitFor()
		const rows = await page.locator(".helpline-row").evaluateAll((els) =>
			els.map((li) => {
				const box = (s: string) => (li.querySelector(s) as Element).getBoundingClientRect()
				const name = box(".helpline-name")
				const phone = box('a[href^="tel:"]')
				const chat = box('a[href^="https:"]')
				const mids = [name, phone, chat].map((r) => r.top + r.height / 2)
				return {
					phoneLeft: Math.round(phone.left),
					phoneWidth: Math.round(phone.width),
					chatLeft: Math.round(chat.left),
					chatWidth: Math.round(chat.width),
					spread: Math.max(...mids) - Math.min(...mids),
				}
			})
		)
		expect(rows).toHaveLength(4)
		for (const key of ["phoneLeft", "phoneWidth", "chatLeft", "chatWidth"] as const) {
			expect(new Set(rows.map((r) => r[key])).size, key).toBe(1)
		}
		expect(rows[0]?.phoneWidth).toBe(136)
		expect(rows[0]?.chatWidth).toBe(92)
		for (const r of rows)
			expect(r.spread, "name and buttons share a centre line").toBeLessThanOrEqual(1)
	})
}

for (const path of ["/", "/en/"]) {
	test(`at 375 px each helpline row has its name above two equal 44 px buttons on one bottom edge (${path})`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 375, height: 900 })
		await page.goto(path)
		await settle(page)
		const rows = await page.locator(".helpline-row").evaluateAll((els) =>
			els.map((li) => {
				const box = (s: string) => (li.querySelector(s) as Element).getBoundingClientRect()
				const name = box(".helpline-name")
				const phone = box('a[href^="tel:"]')
				const chat = box('a[href^="https:"]')
				return {
					below: phone.top >= name.bottom - 1,
					widths: [Math.round(phone.width), Math.round(chat.width)],
					heights: [Math.round(phone.height), Math.round(chat.height)],
					bottoms: [Math.round(phone.bottom), Math.round(chat.bottom)],
				}
			})
		)
		expect(rows).toHaveLength(4)
		for (const r of rows) {
			expect(r.below).toBe(true)
			expect(r.widths[0]).toBe(r.widths[1])
			expect(r.heights).toEqual([44, 44])
			expect(r.bottoms[0]).toBe(r.bottoms[1])
		}
	})
}

test("every helpline and emergency button keeps a visible edge in forced-colors mode", async ({
	page,
}) => {
	await page.emulateMedia({ forcedColors: "active" })
	await page.setViewportSize({ width: 1280, height: 900 })
	await page.goto("/")
	await page.locator(".helpline-row").first().waitFor()
	const edges = await page
		.locator(
			".helpline-row a[href^='tel:'], .helpline-row a[href^='https:'], section[aria-labelledby=emergency] a"
		)
		.evaluateAll((els) =>
			els.map(
				(el) => `${getComputedStyle(el).borderTopStyle} ${getComputedStyle(el).borderTopWidth}`
			)
		)
	expect(edges).toHaveLength(12)
	// Tailwind's reset makes every border-style solid, so the width is what proves the edge.
	for (const edge of edges) expect(edge).toBe("solid 1px")
})

// Chromium puts a space around an absolutely positioned part of a link's name, which used to make
// these "Ring 116 123 , Mental Helse". jsdom does not, so a real browser has to lock the names.
test("the landing helpline buttons have clean accessible names", async ({ page }) => {
	await page.goto("/")
	await expect(
		page.getByRole("link", { name: "Ring 116 123, Mental Helse", exact: true })
	).toHaveCount(1)
	await expect(page.getByRole("link", { name: "Chat, Mental Helse", exact: true })).toHaveCount(1)
})
