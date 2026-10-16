import { expect, test } from "@playwright/test"
import { noHorizontalScroll, setTheme, THEMES } from "./helpers.ts"

const paths = ["/", "/en/", "/sok", "/en/sok", "/resources/1", "/en/resources/1", "/om", "/en/om"]

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
