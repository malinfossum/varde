import { expect, test } from "@playwright/test"
import { noHorizontalScroll, setTheme, THEMES } from "./helpers.ts"

const paths = [
	"/",
	"/en/",
	"/sok",
	"/en/sok",
	"/resources/1",
	"/en/resources/1",
	"/om",
	"/en/om",
	"/kommune",
	"/en/kommune",
]

test.use({ viewport: { width: 320, height: 700 } })

for (const theme of THEMES) {
	for (const path of paths) {
		test(`${path} reflows at 320 px without horizontal scroll (${theme})`, async ({ page }) => {
			await setTheme(page, theme)
			await page.goto(path)
			await page.evaluate(() => document.fonts.ready)
			await expect(page.getByRole("contentinfo")).toBeVisible()
			expect(await noHorizontalScroll(page)).toBe(true)
		})
	}
}

// At 200 % text on a phone a single long word was wider than its column: the report address on
// /om (page 505 px wide), the labels and description on the detail card (334 px) and the
// letter-spaced eyebrow on the landing page (333 px). Long words now break instead, and on the
// landing page no chip or emergency button label leaves its box either.
for (const path of ["/", "/en/", "/om", "/en/om", "/resources/1", "/en/resources/1"]) {
	test(`${path} reflows at 320 px and 200 % text`, async ({ page }) => {
		await page.goto(path)
		await page.addStyleTag({ content: "html { font-size: 200% }" })
		await page.evaluate(() => document.fonts.ready)
		await expect(page.getByRole("contentinfo")).toBeVisible()
		expect(await noHorizontalScroll(page)).toBe(true)
		const spilled = await page
			.locator("main .chip, main a.btn-primary")
			.evaluateAll((els) =>
				els.filter((el) => el.scrollWidth > el.clientWidth).map((el) => el.textContent)
			)
		expect(spilled).toEqual([])
	})
}

// At 200 % text on a phone the contact tiles left 44 px beside the icon, so "116 123" broke every
// two characters. The text now drops under the icon, so each tile's value line is at least as
// wide as its longest word and no phone number splits.
for (const path of ["/resources/1", "/en/resources/1"]) {
	test(`contact tiles on ${path} keep whole words at 320 px and 200 % text`, async ({ page }) => {
		await page.goto(path)
		await page.addStyleTag({ content: "html { font-size: 200% }" })
		await page.evaluate(() => document.fonts.ready)
		await page.locator(".contact-tile-value").first().waitFor()
		const split = await page.locator(".contact-tile-value").evaluateAll((els) =>
			els
				.filter((el) => {
					// The widest single word, measured in the value's own font.
					const probe = document.createElement("span")
					probe.style.whiteSpace = "nowrap"
					el.append(probe)
					const widest = Math.max(
						...(el.firstChild?.textContent ?? "").split(/\s+/).map((word) => {
							probe.textContent = word
							return probe.getBoundingClientRect().width
						})
					)
					probe.remove()
					return el.getBoundingClientRect().width < widest - 0.5
				})
				.map((el) => el.textContent)
		)
		expect(split).toEqual([])
		expect(await noHorizontalScroll(page)).toBe(true)
	})
}

// Spec C2a: in a narrow column the helpline buttons stack at full width; with a larger text size
// on a desktop window the rows use the phone layout instead of squeezing the names. Either way no
// label leaves its button and the page never scrolls sideways.
for (const [label, width, fontSize, stacked] of [
	["320 px", 320, "100%", true],
	["200 % text at 375 px", 375, "200%", true],
	["200 % text at 1280 px", 1280, "200%", false],
] as const) {
	test(`helpline rows reflow at ${label}`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 })
		await page.goto("/")
		await page.addStyleTag({ content: `html { font-size: ${fontSize} }` })
		await page.evaluate(() => document.fonts.ready)
		await page.locator(".helpline-row").first().waitFor()
		const rows = await page.locator(".helpline-row").evaluateAll((els) =>
			els.map((li) => {
				const name = (li.querySelector(".helpline-name") as Element).getBoundingClientRect()
				const buttons = [...li.querySelectorAll("a[href^='tel:'], a[href^='https:']")]
				const boxes = buttons.map((b) => b.getBoundingClientRect())
				// Only the visible text nodes; the visually hidden spans are positioned on their own.
				const inside = buttons.every((b) => {
					const box = b.getBoundingClientRect()
					return [...b.childNodes]
						.filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim())
						.every((n) => {
							const range = document.createRange()
							range.selectNodeContents(n)
							const r = range.getBoundingClientRect()
							return r.left >= box.left - 0.5 && r.right <= box.right + 0.5
						})
				})
				return {
					nameAbove: (boxes[0]?.top ?? 0) >= name.bottom - 1,
					stacked: (boxes[1]?.top ?? 0) >= (boxes[0]?.bottom ?? 0) - 1,
					inside,
				}
			})
		)
		expect(rows).toHaveLength(4)
		for (const r of rows) {
			expect(r.nameAbove).toBe(true)
			expect(r.inside).toBe(true)
			if (stacked) expect(r.stacked).toBe(true)
		}
		expect(await noHorizontalScroll(page)).toBe(true)
	})
}

// C5: at 200 % text on a phone each result card was as wide as its longest word or badge, so
// /sok was 455 px wide at 320 px. The card grids and the card itself now use minmax(0, 1fr),
// long words break, and the pager wraps.
for (const path of ["/sok", "/en/sok", "/kommune/hamar"]) {
	test(`result cards on ${path} reflow at 320 px and 200 % text`, async ({ page }) => {
		await page.goto(path)
		await page.addStyleTag({ content: "html { font-size: 200% }" })
		await page.evaluate(() => document.fonts.ready)
		await page.locator("main li.rounded-xl").first().waitFor()
		expect(await noHorizontalScroll(page)).toBe(true)
	})
}

// Wide steps: the shell widens at 1600 and 1920 px and the card grids add a fourth column,
// instead of three columns inside 384 px gutters. Strip, header, main and footer keep one edge.
for (const [width, columns] of [
	[1280, 3],
	[1600, 4],
	[1920, 4],
] as const) {
	for (const path of ["/sok", "/kommune/hamar"]) {
		test(`${path} has ${columns} card columns and one shell edge at ${width} px`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 900 })
			await page.goto(path)
			await page.locator("main li.rounded-xl").first().waitFor()
			const m = await page.evaluate(() => {
				const lefts = [...document.querySelectorAll("main ul[role='list'] > li.rounded-xl")]
					.slice(0, 8)
					.map((li) => Math.round(li.getBoundingClientRect().left))
				const edges = [".acute-strip", ".header-row", "main", ".footer-row"].map((s) => {
					const r = (document.querySelector(s) as Element).getBoundingClientRect()
					return [Math.round(r.left), Math.round(r.right)]
				})
				return { columns: new Set(lefts).size, edges }
			})
			expect(m.columns).toBe(columns)
			for (const edge of m.edges) expect(edge).toEqual(m.edges[0])
			expect(await noHorizontalScroll(page)).toBe(true)
		})
	}
}

// One service has nothing to put in more columns, so the detail page keeps its 1120 px and
// centres in the wider shell rather than stretching its tiles across 1760 px.
test("the detail page stays 1120 px wide and centred at 1920 px", async ({ page }) => {
	await page.setViewportSize({ width: 1920, height: 900 })
	await page.goto("/resources/1")
	const card = await page.locator("article.detail-card").evaluate((el) => {
		const r = el.getBoundingClientRect()
		return { width: r.width, left: r.left, right: document.documentElement.clientWidth - r.right }
	})
	expect(Math.abs(card.width - 1120)).toBeLessThanOrEqual(1)
	expect(Math.abs(card.left - card.right)).toBeLessThanOrEqual(1)
})
