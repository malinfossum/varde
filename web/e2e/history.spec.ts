import { createRequire } from "node:module"
import { expect, type Page, test } from "@playwright/test"
import {
	forceInstalled,
	headerControls,
	hydrated,
	noHorizontalScroll,
	rowsOf,
	setTheme,
	settle,
	THEMES,
} from "./helpers.ts"

const bar = (page: Page) => page.locator(".history-bar")
const icons = (page: Page) => page.locator(".history-icons")

async function boxes(page: Page, selector: string) {
	return page.locator(selector).evaluateAll((els) =>
		els.map((el) => {
			const r = el.getBoundingClientRect()
			return { top: r.top, bottom: r.bottom, height: r.height, width: r.width, left: r.left }
		})
	)
}

// Spec: Layout, decision 1. A browser tab has its own Back and Forward.
for (const width of [375, 1024, 1280]) {
	test(`a browser tab at ${width} px shows no history controls`, async ({ page }) => {
		await page.setViewportSize({ width, height: 800 })
		await page.goto("/resources/1")
		await hydrated(page)
		await expect(bar(page)).toBeHidden()
		await expect(icons(page)).toBeHidden()
		await expect(page.getByRole("navigation", { name: "Sidehistorikk" })).toHaveCount(0)
	})
}

// The router keeps scrollRestoration "manual" only while the page runs. A reload and a return
// from another document are the browser's again, so a browser tab keeps its place.
const scrollY = (page: Page) => page.evaluate(() => Math.round(window.scrollY))

test("a reload in a browser tab keeps the scroll position on /om", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 800 })
	await page.goto("/om")
	await hydrated(page)
	await page.evaluate(() => window.scrollTo(0, 600))
	await expect.poll(() => scrollY(page)).toBe(600)
	await page.reload()
	await hydrated(page)
	await expect.poll(() => scrollY(page)).toBe(600)
	expect(await page.evaluate(() => history.scrollRestoration)).toBe("manual")
})

test("Back after an in-page jump on /om scrolls back to where it was", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 800 })
	await page.goto("/om")
	await hydrated(page)
	await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
	const bottom = await scrollY(page)
	expect(bottom).toBeGreaterThan(400)
	await page.locator("footer a[href='/om#meld-feil']").click()
	await expect(page).toHaveURL(/\/om#meld-feil$/)
	await expect.poll(() => scrollY(page)).toBeLessThan(bottom - 100)
	await page.goBack()
	await expect(page).toHaveURL(/\/om$/)
	await expect.poll(() => scrollY(page)).toBe(bottom)
})

for (const [path, label] of [
	["/resources/1", "Sidehistorikk"],
	["/en/resources/1", "Page history"],
] as const) {
	for (const width of [320, 375]) {
		test(`installed at ${width} px (${path}): the bar, 44 px buttons on one bottom edge`, async ({
			page,
		}) => {
			await forceInstalled(page)
			await page.setViewportSize({ width, height: 800 })
			await page.goto(path)
			await settle(page)
			await hydrated(page)
			await expect(bar(page)).toBeVisible()
			await expect(icons(page)).toBeHidden()
			await expect(page.getByRole("navigation", { name: label })).toHaveCount(1)
			const buttons = await boxes(page, ".history-bar .history-btn")
			expect(buttons).toHaveLength(2)
			for (const b of buttons) expect(b.height).toBeCloseTo(44, 0)
			expect(Math.abs(buttons[0].bottom - buttons[1].bottom)).toBeLessThan(1)
			expect(Math.abs(buttons[0].width - buttons[1].width)).toBeLessThan(1)
			const [frame] = await boxes(page, ".history-bar")
			expect(frame.bottom).toBeCloseTo(800, 0)
			expect(await noHorizontalScroll(page)).toBe(true)
			// The header is unchanged on phones: still one row.
			expect(rowsOf(await headerControls(page))).toHaveLength(1)
		})
	}

	for (const width of [1024, 1280]) {
		test(`installed at ${width} px (${path}): icons first in one header row, one bottom edge`, async ({
			page,
		}) => {
			await forceInstalled(page)
			await page.setViewportSize({ width, height: 900 })
			await page.goto(path)
			await settle(page)
			await hydrated(page)
			await expect(icons(page)).toBeVisible()
			await expect(bar(page)).toBeHidden()
			await expect(page.locator(".header-row > :first-child")).toHaveClass(/history-icons/)
			const rows = rowsOf(await headerControls(page))
			expect(rows, JSON.stringify(rows)).toHaveLength(1)
			for (const box of rows[0]) expect(box.height, box.label).toBeCloseTo(44, 0)
			const bottoms = rows[0].map((b) => b.bottom)
			expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThan(1)
			for (const b of await boxes(page, ".history-icons .history-btn")) {
				expect(b.width).toBeCloseTo(44, 0)
			}
			expect(await noHorizontalScroll(page)).toBe(true)
		})
	}
}

test("neither layout shows visible text: an arrow and a hidden name only", async ({ page }) => {
	await forceInstalled(page)
	for (const width of [375, 1280]) {
		await page.setViewportSize({ width, height: 800 })
		await page.goto("/resources/1")
		await hydrated(page)
		const visibleText = await page.locator(".history-btn:visible").evaluateAll((buttons) =>
			buttons.flatMap((button) =>
				[...button.children]
					.filter((child) => child.tagName !== "svg")
					.filter((child) => !child.classList.contains("visually-hidden"))
					.filter((child) => child.checkVisibility())
					.map((child) => child.textContent)
			)
		)
		expect(visibleText, `${width} px`).toEqual([])
	}
})

test("the bar never covers the footer's last line at 375 px", async ({ page }) => {
	await forceInstalled(page)
	await page.setViewportSize({ width: 375, height: 700 })
	await page.goto("/om")
	await settle(page)
	await hydrated(page)
	await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
	const footer = await page.getByRole("contentinfo").boundingBox()
	const frame = await bar(page).boundingBox()
	if (!footer || !frame) throw new Error("no box")
	expect(footer.y + footer.height).toBeLessThanOrEqual(frame.y + 0.5)
})

// The room for the bar is part of the page's minimum height, so a page that fits the screen in
// a browser tab fits it in the installed app too, and a long one still ends above the bar.
test("installed at 375 x 812 the 404 page has no vertical scroll", async ({ page }) => {
	await forceInstalled(page)
	await page.setViewportSize({ width: 375, height: 812 })
	await page.goto("/finnes-ikke")
	await settle(page)
	await hydrated(page)
	await expect(bar(page)).toBeVisible()
	const overflow = await page.evaluate(
		() => document.documentElement.scrollHeight - document.documentElement.clientHeight
	)
	expect(overflow).toBe(0)
})

test("installed at 375 x 812 a long page scrolls and its last footer control ends above the bar", async ({
	page,
}) => {
	await forceInstalled(page)
	await page.setViewportSize({ width: 375, height: 812 })
	await page.goto("/om")
	await settle(page)
	await hydrated(page)
	await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
	expect(await scrollY(page)).toBeGreaterThan(0)
	const last = await page.getByRole("contentinfo").locator("a, button").last().boundingBox()
	const frame = await bar(page).boundingBox()
	if (!last || !frame) throw new Error("no box")
	expect(last.y + last.height).toBeLessThanOrEqual(frame.y + 0.5)
})

// WCAG 2.4.11: a control focused at the bottom of the page is scrolled clear of the bar
// (html's scroll-padding-block-end), never left under it.
test("a focused footer link at 375 px is never under the bar", async ({ page }) => {
	await forceInstalled(page)
	await page.setViewportSize({ width: 375, height: 700 })
	await page.goto("/om")
	await settle(page)
	await hydrated(page)
	const last = page.getByRole("contentinfo").getByRole("link").last()
	await last.focus()
	const link = await last.boundingBox()
	const frame = await bar(page).boundingBox()
	if (!link || !frame) throw new Error("no box")
	expect(link.y + link.height).toBeLessThanOrEqual(frame.y + 0.5)
})

test("with text at 200 % at 320 px the padding follows the taller bar", async ({ page }) => {
	await forceInstalled(page)
	await page.setViewportSize({ width: 320, height: 700 })
	await page.goto("/om")
	await settle(page)
	await hydrated(page)
	await page.evaluate(() => {
		document.documentElement.style.fontSize = "200%"
	})
	const height = await bar(page).evaluate((el) => el.getBoundingClientRect().height)
	await expect
		.poll(() =>
			page.evaluate(() =>
				getComputedStyle(document.documentElement).getPropertyValue("--history-bar-h")
			)
		)
		.toBe(`${height}px`)
	await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
	const footer = await page.getByRole("contentinfo").boundingBox()
	const frame = await bar(page).boundingBox()
	if (!footer || !frame) throw new Error("no box")
	expect(footer.y + footer.height).toBeLessThanOrEqual(frame.y + 0.5)
})

test("with a mouse at 1280 px a history icon shows its tooltip, and Escape hides it", async ({
	page,
}) => {
	await forceInstalled(page)
	await page.setViewportSize({ width: 1280, height: 800 })
	await page.goto("/resources/1")
	await settle(page)
	await hydrated(page)
	const back = icons(page).getByRole("button", { name: "Tilbake" })
	await expect(back).toBeEnabled()
	const tip = back.locator(".history-tip")
	await back.hover()
	await expect(tip).toBeVisible()
	await expect(tip).toHaveText("Tilbake")
	const t = await tip.boundingBox()
	if (!t) throw new Error("no box")
	expect(t.x).toBeGreaterThanOrEqual(0)
	await page.keyboard.press("Escape")
	await expect(tip).toBeHidden()
})

test("print hides both layouts", async ({ page }) => {
	await forceInstalled(page)
	for (const width of [375, 1280]) {
		await page.setViewportSize({ width, height: 800 })
		await page.goto("/resources/1")
		await hydrated(page)
		await page.emulateMedia({ media: "print" })
		await expect(bar(page)).toBeHidden()
		await expect(icons(page)).toBeHidden()
		await page.emulateMedia({ media: "screen" })
	}
})

// axe in a real browser, where the contrast of the dimmed disabled state can be measured.
const axePath = createRequire(import.meta.url).resolve("axe-core/axe.min.js")
for (const theme of THEMES) {
	for (const width of [375, 1280]) {
		test(`axe passes in installed mode at ${width} px (${theme})`, async ({ page }) => {
			await forceInstalled(page)
			await setTheme(page, theme)
			await page.setViewportSize({ width, height: 800 })
			await page.goto("/resources/1")
			await settle(page)
			await hydrated(page)
			await page.addScriptTag({ path: axePath })
			const violations = await page.evaluate(async () => {
				type Result = { violations: { id: string; nodes: { target: string[] }[] }[] }
				const { axe } = window as unknown as { axe: { run(): Promise<Result> } }
				const result = await axe.run()
				return result.violations.map(
					(v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`
				)
			})
			expect(violations).toEqual([])
		})
	}
}
