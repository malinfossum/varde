import { expect, type Page, test } from "@playwright/test"
import { noHorizontalScroll, settle } from "./helpers.ts"

type Item = { top: number; right: number; height: number }

const items = (page: Page): Promise<Item[]> =>
	page.locator(".acute-strip > li > a").evaluateAll((links) =>
		links.map((a) => {
			const r = a.getBoundingClientRect()
			return { top: Math.round(r.top), right: r.right, height: r.height }
		})
	)

// Spec: Acute strip, one line. Icon and number per service and the "Alle" link on one 44 px
// line at every width, desktop too, in both languages.
for (const width of [320, 360, 375, 767, 768, 1280]) {
	for (const path of ["/", "/en/"]) {
		test(`the strip at ${width} px (${path}) is one line of 44 px links`, async ({ page }) => {
			await page.setViewportSize({ width, height: 800 })
			await page.goto(path)
			await settle(page)
			const links = await items(page)
			expect(links).toHaveLength(5)
			expect(new Set(links.map((link) => link.top)).size).toBe(1)
			for (const link of links) {
				expect(link.height).toBeGreaterThanOrEqual(44)
				expect(link.right).toBeLessThanOrEqual(width)
			}
			// Below 768 px the last link shows its first word, from 768 px the full term.
			const full = path === "/" ? "Alle nødtjenester" : "All emergency services"
			const short = path === "/" ? "Alle →" : "All →"
			await expect(page.locator(".acute-strip > li:last-child > a")).toHaveText(
				width < 768 ? short : full,
				{ useInnerText: true }
			)
			expect(await noHorizontalScroll(page)).toBe(true)
		})
	}
}

// Spec: Acute strip, one line, and WCAG 1.4.4. With the browser text size at 200 % (which scales
// every rem) the line wraps instead of printing one link over another or leaving the viewport. The root font
// size is set from script after load, as a reader's setting would be.
type Box = { name: string; left: number; right: number; top: number; bottom: number }

const stripBoxes = (page: Page): Promise<Box[]> =>
	page.locator(".acute-strip").evaluate((ul) =>
		[...ul.querySelectorAll("a")].map((el) => {
			const r = el.getBoundingClientRect()
			return {
				name: el.getAttribute("aria-label") ?? "",
				left: r.left,
				right: r.right,
				top: r.top,
				bottom: r.bottom,
			}
		})
	)

for (const width of [320, 360, 375, 767]) {
	for (const path of ["/sok", "/en/sok"]) {
		test(`with text at 200 % the strip at ${width} px (${path}) has no link over another and stays inside the viewport`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 800 })
			await page.goto(path)
			await settle(page)
			await page.evaluate(() => {
				document.documentElement.style.fontSize = "200%"
			})
			const boxes = await stripBoxes(page)
			expect(boxes).toHaveLength(5)
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
