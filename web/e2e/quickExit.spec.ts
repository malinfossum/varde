import { expect, type Page, test } from "@playwright/test"
import { forceInstalled, hydrated } from "./helpers.ts"

// Spec: Quick exit. location.replace removes only the page you are on. These tests prove that
// limit as it is, and that the history buttons add nothing that undoes an exit.
const STUB = '<!doctype html><html lang="nb"><title>Stub</title><p id="exit-stub">Utgang</p></html>'

test.beforeEach(async ({ page }) => {
	await page.route(/^https:\/\/www\.google\.com\//, (route) =>
		route.fulfill({ status: 200, contentType: "text/html", body: STUB })
	)
	await forceInstalled(page)
	await page.setViewportSize({ width: 375, height: 800 })
})

// Asserting the stub first means an exit that never left cannot pass.
async function exit(page: Page) {
	await page.locator(".quick-exit").click()
	await expect(page.locator("#exit-stub")).toBeVisible()
}

test("after exiting from a detail page reached from /sok, Back lands on /sok, never on that page", async ({
	page,
}) => {
	await page.goto("/sok")
	await hydrated(page)
	await page.locator("main a[href^='/resources/']").first().click()
	await expect(page).toHaveURL(/\/resources\/\d+$/)
	await exit(page)
	await page.goBack()
	await expect(page).toHaveURL(/\/sok$/)
})

test("in a one-page session, Back after the exit leaves Varde entirely", async ({
	page,
	baseURL,
}) => {
	await page.goto("/resources/1")
	await hydrated(page)
	await exit(page)
	await page.goBack()
	// A page that is still the stub would also pass the host check below, since the stub is
	// served from google.com. So the page must be gone and must not be the stub.
	await expect(page.locator("#exit-stub")).toHaveCount(0)
	expect(page.url()).not.toMatch(/^https:\/\/www\.google\.com\//)
	// The origin comes from the config, so the check holds on whichever port the preview runs.
	if (!baseURL) throw new Error("the Playwright config sets no baseURL")
	expect(new URL(page.url()).origin).not.toBe(new URL(baseURL).origin)
})

test("Back-to-home raises history.length by exactly one", async ({ page }) => {
	await page.goto("/resources/1")
	await hydrated(page)
	const back = page.locator(".history-bar").getByRole("button", { name: "Tilbake" })
	await expect(back).toBeEnabled()
	const before = await page.evaluate(() => history.length)
	await back.click()
	await expect(page).toHaveURL(/\/$/)
	expect(await page.evaluate(() => history.length)).toBe(before + 1)
})
