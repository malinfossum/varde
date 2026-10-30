import { expect, test } from "@playwright/test"
import { forceInstalled, hydrated, settle } from "./helpers.ts"

test.beforeEach(async ({ page }) => {
	await forceInstalled(page)
	await page.setViewportSize({ width: 375, height: 800 })
})

test("an old ?municipality=1 link lands on Hamar under its kommunenummer", async ({ page }) => {
	await page.goto("/sok?municipality=1")
	await hydrated(page)
	await expect(page).toHaveURL(/\/sok\?municipality=3403$/)
	await expect(page.getByRole("combobox", { name: "Kommune" })).toHaveValue("Hamar")
})

test("Back to a rewritten old link restores the scroll position", async ({ page }) => {
	// A weekday morning, as in historyNav.spec.ts, so the handover banner has its full height.
	await page.clock.setFixedTime(new Date(2026, 9, 28, 10, 0))
	// Settle on /sok first, so Back is tested from the rewritten entry and not an already
	// canonical one.
	await page.goto("/sok")
	await settle(page)
	await hydrated(page)
	await page.goto("/sok?municipality=1")
	await settle(page)
	await hydrated(page)
	await expect(page).toHaveURL(/\/sok\?municipality=3403$/)
	const link = page.locator("main a[href^='/resources/']").nth(4)
	await link.evaluate((el) => el.scrollIntoView({ block: "center" }))
	const scrollY = await page.evaluate(() => window.scrollY)
	expect(scrollY).toBeGreaterThan(200)
	await link.click()
	await expect(page).toHaveURL(/\/resources\/\d+$/)
	await page.goBack()
	await expect(page).toHaveURL(/\/sok\?municipality=3403$/)
	await expect
		.poll(async () => Math.abs((await page.evaluate(() => window.scrollY)) - scrollY))
		.toBeLessThanOrEqual(1)
})
