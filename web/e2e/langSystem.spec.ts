import { expect, test } from "@playwright/test"

// Issue #80: a stored System choice follows the browser's language, but only on bare /. The
// inline script in index.html decides before first paint, so these run against the built site.
test.use({ locale: "en-GB" })

const storeSystem = (page: import("@playwright/test").Page) =>
	page.addInitScript(() => window.localStorage.setItem("varde.lang", "system"))

test("System in an English browser sends / to /en/", async ({ page }) => {
	await storeSystem(page)
	await page.goto("/")
	await expect(page).toHaveURL("/en/")
	await expect(page.locator("html")).toHaveAttribute("lang", "en")
})

test("System never rewrites a URL that names a page", async ({ page }) => {
	await storeSystem(page)
	await page.goto("/resources/2")
	await expect(page).toHaveURL("/resources/2")
	await expect(page.locator("html")).toHaveAttribute("lang", "nb")
})

test("with nothing stored, an English browser stays on the Norwegian landing page", async ({
	page,
}) => {
	await page.goto("/")
	await expect(page).toHaveURL("/")
	await expect(page.locator("html")).toHaveAttribute("lang", "nb")
})
