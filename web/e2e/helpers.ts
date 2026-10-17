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

// The app has hydrated: the theme value in the header fills in after mount.
export async function hydrated(page: Page): Promise<void> {
	await page
		.locator("header .visually-hidden", { hasText: /^(Tema|Theme): / })
		.first()
		.waitFor({ state: "attached" })
}

export type Box = { label: string; top: number; bottom: number; height: number }

export async function headerControls(page: Page): Promise<Box[]> {
	return page.evaluate(() =>
		[
			...document.querySelectorAll<HTMLElement>(
				".app-header a, .app-header button, .app-header summary"
			),
		]
			// Rows inside a closed picker or the closed Meny still have boxes in Chromium
			// (content-visibility: hidden, not display: none), so skip the lists outright.
			// checkVisibility() drops whichever layout is display: none at this width.
			.filter((el) => !el.closest(".picker-list") && el.checkVisibility())
			.map((el) => {
				const r = el.getBoundingClientRect()
				const label = `${el.tagName} ${(el.textContent ?? "").trim().slice(0, 24)}`
				return { label, top: r.top, bottom: r.bottom, height: r.height }
			})
	)
}

// Controls whose vertical centres sit within 22 px of each other share a row.
export function rowsOf(boxes: Box[]): Box[][] {
	const rows: Box[][] = []
	const centre = (b: Box) => (b.top + b.bottom) / 2
	for (const box of [...boxes].sort((a, b) => centre(a) - centre(b))) {
		const row = rows.find((r) => Math.abs(centre(r[0]) - centre(box)) < 22)
		if (row) row.push(box)
		else rows.push([box])
	}
	return rows
}
