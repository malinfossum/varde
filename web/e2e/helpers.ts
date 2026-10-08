import type { Page } from "@playwright/test"

export const THEMES = ["light", "dark"] as const

// The inline init script in index.html reads this key before first paint, so setting it in an
// init script gives the real first render in that theme.
export async function setTheme(page: Page, theme: "light" | "dark"): Promise<void> {
	await page.addInitScript((value) => {
		try {
			window.localStorage.setItem("theme", value)
		} catch {}
	}, theme)
}

// Fraunces is font-display: optional, so a first visit may paint the fallback serif and keep
// it. One reload with the font cached gives the layout a real visitor sees on a second visit,
// which is the stable one to measure.
export async function settle(page: Page): Promise<void> {
	await page.evaluate(() => document.fonts.ready)
	await page.reload()
	await page.evaluate(() => document.fonts.ready)
}

export async function noHorizontalScroll(page: Page): Promise<boolean> {
	return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
}
