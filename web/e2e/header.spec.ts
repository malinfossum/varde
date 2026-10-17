import { expect, type Page, test } from "@playwright/test"
import { headerControls, noHorizontalScroll, rowsOf, setTheme, settle, THEMES } from "./helpers.ts"

async function tabTo(page: Page, selector: string) {
	for (let i = 0; i < 30; i++) {
		await page.keyboard.press("Tab")
		if (await page.evaluate((s) => document.activeElement?.matches(s) ?? false, selector)) return
	}
	throw new Error(`Tab never reached ${selector}`)
}

const activeName = (page: Page) =>
	page.evaluate(() => {
		const el = document.activeElement as HTMLElement
		return el.getAttribute("aria-label") ?? (el.textContent ?? "").trim()
	})

// One row at every width (spec: The header row rule). 320 and 375 run the 320 px fallback, 360
// is the brand word's breakpoint and the tightest fit (English needs 347.2 px of the 360),
// 1023 and 1024 sit either side of the switch between the Meny and the desktop nav. I also run
// a first visit (nothing stored), because the header must fit before any theme is saved.
for (const width of [320, 360, 375, 1023, 1024, 1280, 1920]) {
	for (const theme of [...THEMES, "system"] as const) {
		for (const path of ["/", "/en/"]) {
			test(`header ${path} at ${width} px (${theme}): one row, every control 44 px tall, one bottom edge`, async ({
				page,
			}) => {
				await page.setViewportSize({ width, height: 900 })
				if (theme !== "system") await setTheme(page, theme)
				await page.goto(path)
				await settle(page)
				const boxes = await headerControls(page)
				const rows = rowsOf(boxes)
				expect(rows.length, boxes.map((b) => b.label).join(" | ")).toBe(1)
				for (const box of rows[0]) expect(box.height, box.label).toBeCloseTo(44, 0)
				const bottoms = rows[0].map((b) => b.bottom)
				expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThan(1)
				expect(await noHorizontalScroll(page)).toBe(true)
			})
		}
	}
}

for (const [width, menuShown] of [
	[1023, true],
	[1024, false],
] as const) {
	test(`at ${width} px only ${menuShown ? "the Meny" : "the nav and the language picker"} is shown`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 800 })
		await page.goto("/")
		await expect(page.locator("details.header-menu")).toBeVisible({ visible: menuShown })
		await expect(page.locator(".header-nav")).toBeVisible({ visible: !menuShown })
		await expect(page.locator(".header-tools")).toBeVisible({ visible: !menuShown })
		// One navigation landmark at every width, the Meny's or the desktop's, so a screen reader
		// never meets two landmarks with the same name.
		await expect(page.getByRole("navigation", { name: "Hovedmeny" })).toHaveCount(1)
	})
}

// Spec: The header row rule. One row is the rule at default text size. With text at 200 % (a
// browser font-size setting, which scales every rem) the row wraps instead of scrolling
// sideways. The root font size is set from script after load, as a reader's setting would be.
for (const width of [1024, 1280]) {
	test(`with text at 200 % the header at ${width} px never scrolls sideways`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 })
		await page.goto("/en/")
		await settle(page)
		await page.evaluate(() => {
			document.documentElement.style.fontSize = "200%"
		})
		expect(await noHorizontalScroll(page)).toBe(true)
	})
}

test("at 320 px the keyboard meets the brand, the Meny and the exit, and nothing hidden", async ({
	page,
}) => {
	await page.setViewportSize({ width: 320, height: 640 })
	await page.goto("/")
	await tabTo(page, "header a[aria-label]")
	const names = [await activeName(page)]
	for (const _ of [1, 2]) {
		await page.keyboard.press("Tab")
		names.push(await activeName(page))
	}
	expect(names).toEqual(["Varde, til forsiden", "Meny", "Forlat siden"])
})

for (const path of ["/", "/sok"]) {
	for (const viewport of [
		{ width: 1280, height: 600 },
		{ width: 1024, height: 600 },
		{ width: 800, height: 600 },
		{ width: 640, height: 400 },
		{ width: 375, height: 700 },
		{ width: 320, height: 640 },
	]) {
		test(`tabbing through ${path} at ${viewport.width} x ${viewport.height} never puts focus under the header`, async ({
			page,
		}) => {
			await page.setViewportSize(viewport)
			await page.goto(path)
			await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
			// Both directions: Chromium centres a target it has to scroll to, so going forward
			// rarely lands under the header. Going back, an element partly under the header counts
			// as in view and takes focus without a scroll, which only scroll-padding-top prevents.
			for (const key of ["Tab", "Shift+Tab"]) {
				for (let i = 0; i < 40; i++) {
					await page.keyboard.press(key)
					const covered = await page.evaluate(() => {
						const el = document.activeElement as HTMLElement | null
						const header = document.querySelector("header")
						if (!el || !header || el === document.body || header.contains(el)) return null
						const r = el.getBoundingClientRect()
						const h = header.getBoundingClientRect()
						return r.top < h.bottom - 1 && r.bottom > h.top + 1 ? el.outerHTML.slice(0, 80) : null
					})
					expect(covered, key).toBeNull()
				}
			}
		})
	}
}

test("the quick exit stays in view after scrolling, on a normal screen, a short one and phones", async ({
	page,
}) => {
	for (const viewport of [
		{ width: 1280, height: 950 },
		{ width: 640, height: 400 },
		{ width: 375, height: 700 },
		{ width: 320, height: 640 },
	]) {
		await page.setViewportSize(viewport)
		await page.goto("/sok")
		await expect(page.getByRole("heading", { level: 1 })).toBeAttached()
		await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
		const box = await page.getByRole("link", { name: "Forlat siden" }).boundingBox()
		if (!box) throw new Error("no quick exit box")
		expect(box.y).toBeGreaterThanOrEqual(0)
		expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
		expect(box.height).toBeCloseTo(44, 0)
	}
})

// usePicker shifts an open list back on screen when it would start left of the 8 px edge gap.
// The list hangs from the Meny trigger's right edge, so on a narrow phone the left edge is the
// risk.
for (const viewport of [
	{ width: 375, height: 812 },
	{ width: 320, height: 640 },
]) {
	test(`at ${viewport.width} x ${viewport.height} the open Meny stays 8 px inside the screen`, async ({
		page,
	}) => {
		await page.setViewportSize(viewport)
		for (const path of ["/", "/en/"]) {
			await page.goto(path)
			await settle(page)
			const menu = page.locator("header details.header-menu")
			await menu.locator("summary").click()
			// onToggle focuses a row after it has placed the list, so focus means placed.
			await expect(menu.locator(".picker-row:focus")).toHaveCount(1)
			const edges = await menu.locator(".picker-list").evaluate((el) => {
				const r = el.getBoundingClientRect()
				return { left: r.left, right: r.right, width: document.documentElement.clientWidth }
			})
			expect(edges.left, path).toBeGreaterThanOrEqual(8)
			expect(edges.right, path).toBeLessThanOrEqual(edges.width - 8)
			await page.keyboard.press("Escape")
			await expect(menu).not.toHaveAttribute("open")
		}
	})
}

test("the Meny opens on its first row, the arrows wrap, a theme row keeps it open, Escape returns to the trigger", async ({
	page,
}) => {
	await page.setViewportSize({ width: 375, height: 812 })
	await page.goto("/")
	await settle(page)
	const menu = page.locator("header details.header-menu")
	await menu.locator("summary").click()
	await expect(menu.getByRole("link", { name: "Alle tjenester" })).toBeFocused()
	await page.keyboard.press("ArrowUp")
	await expect(menu.getByRole("button", { name: "System" })).toBeFocused()
	await page.keyboard.press("ArrowUp")
	const dark = menu.getByRole("button", { name: "Mørkt" })
	await expect(dark).toBeFocused()
	await page.keyboard.press("Enter")
	await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
	await expect(menu).toHaveAttribute("open", "")
	await expect(dark).toBeFocused()
	await expect(dark).toHaveAttribute("aria-pressed", "true")
	await page.keyboard.press("Escape")
	await expect(menu).not.toHaveAttribute("open")
	await expect(menu.locator("summary")).toBeFocused()
})

test("a Meny link navigates and the Meny closes with the page change", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 })
	await page.goto("/")
	const menu = page.locator("header details.header-menu")
	await menu.locator("summary").click()
	await menu.getByRole("link", { name: "Alle tjenester" }).click()
	await expect(page).toHaveURL(/\/sok$/)
	await expect(menu).not.toHaveAttribute("open")
})

// Spec: every row shares one left edge for its text and one right edge for its code or check.
test("the Meny's rows share one text edge, one code edge and one check edge", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 })
	await page.goto("/")
	await settle(page)
	const menu = page.locator("header details.header-menu")
	await menu.locator("summary").click()
	await expect(menu.locator(".picker-row:focus")).toHaveCount(1)
	// The pressed theme row (System on a first visit) exists only once the theme state mounts.
	await expect(menu.locator('.menu-list [aria-pressed="true"]')).toHaveCount(1)
	const edges = await page.evaluate(() => {
		const rows = [...document.querySelectorAll<HTMLElement>(".menu-list .picker-row")]
		const textLeft = (row: HTMLElement) => {
			const walker = document.createTreeWalker(row, NodeFilter.SHOW_TEXT)
			for (let n = walker.nextNode(); n; n = walker.nextNode()) {
				const parent = n.parentElement
				if (!n.textContent?.trim() || parent?.closest('[aria-hidden="true"], .visually-hidden'))
					continue
				const range = document.createRange()
				range.selectNodeContents(n)
				return Math.round(range.getBoundingClientRect().left)
			}
			return null
		}
		const rights = (selector: string) =>
			[...document.querySelectorAll<HTMLElement>(`.menu-list ${selector}`)].map((el) =>
				Math.round(el.getBoundingClientRect().right)
			)
		return {
			texts: rows.map(textLeft),
			codes: rights(".picker-code"),
			checks: rights(".picker-check"),
		}
	})
	expect(new Set(edges.texts).size, `text lefts ${edges.texts}`).toBe(1)
	expect(new Set(edges.codes).size, `code rights ${edges.codes}`).toBe(1)
	expect(new Set(edges.checks).size, `check rights ${edges.checks}`).toBe(1)
	expect(edges.checks.length).toBe(2) // the current language and the pressed theme
})

test("forced colours keep the focus ring and the current picker row visible", async ({ page }) => {
	await page.emulateMedia({ forcedColors: "active" })
	await page.goto("/")
	await tabTo(page, "header summary")
	const ring = await page.evaluate(() => {
		const s = getComputedStyle(document.activeElement as HTMLElement)
		return { style: s.outlineStyle, width: Number.parseFloat(s.outlineWidth) }
	})
	expect(ring.style).not.toBe("none")
	expect(ring.width).toBeGreaterThanOrEqual(2)
	await page.keyboard.press("Enter")
	const row = page.locator('header .header-tools .picker-row[aria-current="page"]')
	await expect(row).toBeFocused()
	const colours = await row.evaluate((el) => ({
		row: getComputedStyle(el).backgroundColor,
		list: getComputedStyle(el.parentElement as HTMLElement).backgroundColor,
	}))
	expect(colours.row).not.toBe(colours.list)
})
