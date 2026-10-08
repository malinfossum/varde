import { expect, type Page, test } from "@playwright/test"
import { setTheme, settle, THEMES } from "./helpers.ts"

type Box = { label: string; top: number; bottom: number; height: number }

async function headerControls(page: Page): Promise<Box[]> {
	return page.evaluate(() =>
		[...document.querySelectorAll<HTMLElement>("header a, header button, header summary")]
			// Rows inside a closed picker still have boxes in Chromium (content-visibility: hidden,
			// not display: none), so skip the lists outright. A pinned (position: fixed) quick exit
			// is not in a header row, so it is skipped too.
			.filter(
				(el) =>
					!el.closest(".picker-list") &&
					el.checkVisibility() &&
					getComputedStyle(el).position !== "fixed"
			)
			.map((el) => {
				const r = el.getBoundingClientRect()
				const label = `${el.tagName} ${(el.textContent ?? "").trim().slice(0, 24)}`
				return { label, top: r.top, bottom: r.bottom, height: r.height }
			})
	)
}

// Controls whose vertical centres sit within 22 px of each other share a row.
function rowsOf(boxes: Box[]): Box[][] {
	const rows: Box[][] = []
	const centre = (b: Box) => (b.top + b.bottom) / 2
	for (const box of [...boxes].sort((a, b) => centre(a) - centre(b))) {
		const row = rows.find((r) => Math.abs(centre(r[0]) - centre(box)) < 22)
		if (row) row.push(box)
		else rows.push([box])
	}
	return rows
}

async function tabTo(page: Page, selector: string) {
	for (let i = 0; i < 30; i++) {
		await page.keyboard.press("Tab")
		if (await page.evaluate((s) => document.activeElement?.matches(s) ?? false, selector)) return
	}
	throw new Error(`Tab never reached ${selector}`)
}

// 1024 is the narrowest one-row width, English has the longest labels, and a first visit
// (nothing stored) shows the widest theme value, "System (lyst)", so all three are measured:
// scroll-padding-top (Step 3) assumes one row from 1024 px.
for (const width of [375, 1024, 1280, 1920]) {
	for (const theme of [...THEMES, "system"] as const) {
		for (const path of ["/", "/en/"]) {
			test(`header ${path} at ${width} px (${theme}): every control 44 px tall, one bottom edge per row`, async ({
				page,
			}) => {
				await page.setViewportSize({ width, height: 900 })
				if (theme !== "system") await setTheme(page, theme)
				await page.goto(path)
				await settle(page)
				// The theme value fills in after mount; measure the real, hydrated width.
				await page
					.locator("header .visually-hidden", { hasText: /^(Tema|Theme): / })
					.waitFor({ state: "attached" })
				const rows = rowsOf(await headerControls(page))
				// On a phone the 10rem slot kept free for the pinned quick exit pushes the pickers
				// below the brand, so a phone has brand, tools and nav on three rows. Not sticky
				// there, so the height scrolls away (Decided).
				expect(rows.length).toBe(width >= 1024 ? 1 : width >= 768 ? 2 : 3)
				for (const row of rows) {
					for (const box of row) expect(box.height, box.label).toBeCloseTo(44, 0)
					const bottoms = row.map((b) => b.bottom)
					expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThan(1)
				}
			})
		}
	}
}

for (const path of ["/", "/sok"]) {
	for (const viewport of [
		{ width: 1280, height: 600 },
		{ width: 1024, height: 600 },
		{ width: 375, height: 700 },
	]) {
		test(`tabbing through ${path} at ${viewport.width} px never puts focus under the header or the pinned exit`, async ({
			page,
		}) => {
			await page.setViewportSize(viewport)
			await page.goto(path)
			await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
			// Both directions: Chromium centres a target it has to scroll to, so going forward
			// rarely lands under the header. Going back, an element partly under the header counts
			// as in view and takes focus without a scroll, which only scroll-padding-top prevents.
			// At 375 the header scrolls away and the pinned quick exit is what could cover focus,
			// so both boxes are checked.
			for (const key of ["Tab", "Shift+Tab"]) {
				for (let i = 0; i < 40; i++) {
					await page.keyboard.press(key)
					const covered = await page.evaluate(() => {
						const el = document.activeElement as HTMLElement | null
						const header = document.querySelector("header")
						const exit = document.querySelector(".quick-exit")
						if (!el || !header || !exit || el === document.body || header.contains(el)) return null
						const r = el.getBoundingClientRect()
						return [header.getBoundingClientRect(), exit.getBoundingClientRect()].some(
							(h) =>
								r.top < h.bottom - 1 &&
								r.bottom > h.top + 1 &&
								r.left < h.right - 1 &&
								r.right > h.left + 1
						)
							? el.outerHTML.slice(0, 80)
							: null
					})
					expect(covered, key).toBeNull()
				}
			}
		})
	}
}

test("the quick exit stays in view after scrolling, on a normal screen, a short one and a phone", async ({
	page,
}) => {
	for (const viewport of [
		{ width: 1280, height: 950 },
		{ width: 640, height: 400 },
		{ width: 375, height: 700 },
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

// The pinned exit sits top right. At scroll 0 the acute strip is under it (on a phone the strip
// alone is taller than the exit), so every control in view is checked, not only the header's.
// Scrolled until the header reaches the top, the header's first row is under it instead.
for (const viewport of [
	{ width: 640, height: 400 },
	{ width: 375, height: 700 },
]) {
	test(`at ${viewport.width} x ${viewport.height} the pinned quick exit covers no other control`, async ({
		page,
	}) => {
		await page.setViewportSize(viewport)
		for (const path of ["/sok", "/en/sok"]) {
			await page.goto(path)
			await settle(page)
			for (const at of ["scroll 0", "header at the top"]) {
				if (at === "header at the top") {
					await page.evaluate(() => {
						const header = document.querySelector("header")
						if (header) window.scrollTo(0, header.getBoundingClientRect().top + window.scrollY)
					})
				}
				const covered = await page.evaluate(() => {
					const exit = document.querySelector(".quick-exit")
					if (!exit) return ["no quick exit"]
					const e = exit.getBoundingClientRect()
					return [...document.querySelectorAll<HTMLElement>("a, button, summary")]
						.filter((el) => el !== exit && !el.closest(".picker-list") && el.checkVisibility())
						.filter((el) => {
							const r = el.getBoundingClientRect()
							return r.left < e.right && r.right > e.left && r.top < e.bottom && r.bottom > e.top
						})
						.map((el) => el.outerHTML.slice(0, 80))
				})
				expect(covered, `${path}, ${at}`).toEqual([])
			}
		}
	})
}

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
	const row = page.locator('header .picker-row[aria-current="page"]')
	await expect(row).toBeFocused()
	const colours = await row.evaluate((el) => ({
		row: getComputedStyle(el).backgroundColor,
		list: getComputedStyle(el.parentElement as HTMLElement).backgroundColor,
	}))
	expect(colours.row).not.toBe(colours.list)
})
