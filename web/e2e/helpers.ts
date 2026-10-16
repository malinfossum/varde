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
	return page.evaluate(
		() => document.documentElement.scrollWidth <= document.documentElement.clientWidth
	)
}

// Installed mode for e2e. Playwright's Chromium cannot emulate (display-mode: standalone):
// emulateMedia has no display mode and the CDP media feature is ignored (probed 2026-10-16,
// Chromium 156, Playwright 1.64; re-probed 2026-10-17 on the installed version, same result). So
// the tests take the iPhone path: navigator.standalone, which main.tsx turns into data-standalone
// on <html>. Call it before page.goto.
export async function forceInstalled(page: Page): Promise<void> {
	await page.addInitScript(() => {
		Object.defineProperty(Navigator.prototype, "standalone", {
			get: () => true,
			configurable: true,
		})
	})
}
