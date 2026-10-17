import { expect, type Page, test } from "@playwright/test"
import { forceInstalled, hydrated, settle } from "./helpers.ts"

const names = {
	// A regex ending in \/$ would also match /en/, so the home check compares the whole path.
	nb: { back: "Tilbake", forward: "Fremover", home: (url: URL) => url.pathname === "/" },
	en: { back: "Back", forward: "Forward", home: (url: URL) => url.pathname === "/en/" },
}

function bar(page: Page, lang: "nb" | "en" = "nb") {
	const nav = page.locator(".history-bar")
	return {
		back: nav.getByRole("button", { name: names[lang].back }),
		forward: nav.getByRole("button", { name: names[lang].forward }),
	}
}

test.beforeEach(async ({ page }) => {
	await forceInstalled(page)
	await page.setViewportSize({ width: 375, height: 800 })
})

test("a first load of the landing page: Back and Forward are disabled", async ({ page }) => {
	await page.goto("/")
	await hydrated(page)
	await expect(bar(page).back).toBeDisabled()
	await expect(bar(page).forward).toBeDisabled()
})

// Back-to-home is a push, so the detail page ends up behind the landing page: Back returns to
// it and Forward is off (see "Spec correction" at the top of the plan).
for (const lang of ["nb", "en"] as const) {
	const prefix = lang === "en" ? "/en" : ""
	test(`a first load of a detail page (${lang}): Back goes home, Back again returns`, async ({
		page,
	}) => {
		await page.goto(`${prefix}/resources/1`)
		await hydrated(page)
		const { back, forward } = bar(page, lang)
		await expect(back).toBeEnabled()
		await expect(forward).toBeDisabled()
		await back.click()
		await expect(page).toHaveURL(names[lang].home)
		await expect(forward).toBeDisabled()
		await expect(back).toBeEnabled()
		await back.click()
		await expect(page).toHaveURL(new RegExp(`${prefix}/resources/1$`))
		await expect(forward).toBeEnabled()
		await forward.click()
		await expect(page).toHaveURL(names[lang].home)
	})
}

// Spec: Focus and scroll. The misclick this feature exists to fix.
async function openResultFarDown(page: Page) {
	await page.goto("/sok")
	await settle(page)
	await hydrated(page)
	const link = page.locator("main a[href^='/resources/']").nth(6)
	await link.evaluate((el) => el.scrollIntoView({ block: "center" }))
	const scrollY = await page.evaluate(() => window.scrollY)
	expect(scrollY).toBeGreaterThan(200)
	const href = await link.getAttribute("href")
	if (!href) throw new Error("no href")
	await link.click()
	await expect(page).toHaveURL(new RegExp(`${href}$`))
	return { scrollY, href }
}

const focusedHref = (page: Page) =>
	page.evaluate(() => document.activeElement?.getAttribute("href") ?? null)

test("/sok: Back returns to the scrolled spot with the followed link focused; Forward opens it again", async ({
	page,
}) => {
	const { scrollY, href } = await openResultFarDown(page)
	await bar(page).back.click()
	await expect(page).toHaveURL(/\/sok$/)
	await expect.poll(() => focusedHref(page)).toBe(href)
	expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollY)).toBeLessThanOrEqual(1)
	await bar(page).forward.click()
	await expect(page).toHaveURL(new RegExp(`${href}$`))
	// Forward to a page you left by Back: the top, with focus on the heading.
	await expect.poll(() => page.evaluate(() => document.activeElement?.tagName)).toBe("H1")
	expect(await page.evaluate(() => window.scrollY)).toBe(0)
})

test("the browser's own Back restores the same way", async ({ page }) => {
	const { scrollY, href } = await openResultFarDown(page)
	await page.goBack()
	await expect(page).toHaveURL(/\/sok$/)
	await expect.poll(() => focusedHref(page)).toBe(href)
	expect(Math.abs((await page.evaluate(() => window.scrollY)) - scrollY)).toBeLessThanOrEqual(1)
})

test.describe("without the Navigation API", () => {
	test.beforeEach(async ({ page }) => {
		await page.addInitScript(() => {
			Object.defineProperty(window, "navigation", { value: undefined, configurable: true })
		})
	})

	test("Back after a first load goes home, and after a reload Forward is off", async ({ page }) => {
		await page.goto("/resources/1")
		await hydrated(page)
		expect(await page.evaluate(() => (window as { navigation?: unknown }).navigation)).toBeFalsy()
		await bar(page).back.click()
		await expect(page).toHaveURL(/\/$/)
		await expect(bar(page).forward).toBeDisabled()
		await bar(page).back.click()
		await expect(page).toHaveURL(/\/resources\/1$/)
		await expect(bar(page).forward).toBeEnabled()
		await bar(page).forward.click()
		await expect(page).toHaveURL(/\/$/)
		// After a reload the router no longer knows what was ahead: Forward stays off.
		await bar(page).back.click()
		await expect(page).toHaveURL(/\/resources\/1$/)
		await page.reload()
		await hydrated(page)
		await expect(bar(page).forward).toBeDisabled()
		await expect(bar(page).back).toBeEnabled()
	})
})
