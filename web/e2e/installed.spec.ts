import { expect, test } from "@playwright/test"
import { forceInstalled } from "./helpers.ts"

// Every installed-mode e2e relies on forceInstalled (spec: Testing, end to end). This proves it
// before anything else leans on it.
const paths = ["/", "/en/", "/sok", "/resources/1", "/om"]

for (const path of paths) {
	test(`${path} in a browser tab is not marked installed`, async ({ page }) => {
		await page.goto(path)
		await expect(page.locator("html")).not.toHaveAttribute("data-standalone")
	})

	test(`${path} under forceInstalled is marked installed`, async ({ page }) => {
		await forceInstalled(page)
		await page.goto(path)
		await expect(page.locator("html")).toHaveAttribute("data-standalone", "")
	})
}
