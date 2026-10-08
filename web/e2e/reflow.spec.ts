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
			expect(await noHorizontalScroll(page)).toBe(true)
		})
	}
}
