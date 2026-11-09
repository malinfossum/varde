import { expect, type Locator, type Page, test } from "@playwright/test"
import { hydrated, noHorizontalScroll, setTheme, THEMES } from "./helpers.ts"

// The /sok filter UI (filter spec, Testing, PR 2) against the fixture data: 8 kommuner in 2
// fylker (Innlandet with seven; Oslo with one, so Oslo is listed once, as the kommune), 138 rows,
// aliases.json empty.

const sted = (page: Page) => page.getByRole("combobox", { name: "Sted" })
const stedChips = (page: Page) => page.getByRole("grid", { name: "Sted" })
const activeChips = (page: Page) => page.getByRole("grid", { name: "Valgte filtre" })
const statusRegion = (page: Page) => page.locator("[data-live-announcer]")
const trigger = (page: Page) => page.getByRole("button", { name: /^Flere filtre/ })
const dialog = (page: Page) => page.getByRole("dialog", { name: "Filtre" })

async function openSok(page: Page, path = "/sok"): Promise<void> {
	await page.goto(path)
	await hydrated(page)
	await sted(page).waitFor()
}

// Presses Tab until the target has focus, so the path is the one a keyboard user takes.
// The element is resolved once, up front: while the Sted list is open on the way past, react-aria
// sets aria-hidden on the rest of the page, and a role locator re-resolved then would wait for
// ever instead of pressing the next Tab.
async function tabTo(page: Page, target: Locator, max = 80): Promise<void> {
	const el = await target.elementHandle()
	for (let i = 0; i < max; i++) {
		if (await el.evaluate((node) => node === document.activeElement)) return
		await page.keyboard.press("Tab")
	}
	throw new Error("Tab never reached the target")
}

// The filter's own boxes end inside the viewport. At 200 % text on a phone the result cards are
// still wider than the screen (their nowrap Ring button), which is the separate card reflow
// follow-up, so the 200 % checks look at the filter UI only and not at the whole page.
async function filterFits(page: Page): Promise<boolean> {
	return page.evaluate(() => {
		const width = document.documentElement.clientWidth
		const boxes = document.querySelectorAll(
			".sok-top, .sok-top *, .active-filters, .active-filters *, .facet-sidebar *, .facet-dialog, .facet-dialog *, [role='listbox'], [role='listbox'] *"
		)
		return [...boxes].every((el) => {
			const r = el.getBoundingClientRect()
			return r.width === 0 || r.right <= width + 1
		})
	})
}

// inert in a browser, aria-hidden as react-aria's fallback.
function hiddenFromScreenReaders(el: Element): boolean {
	for (let node: Element | null = el; node; node = node.parentElement) {
		if (node.getAttribute("aria-hidden") === "true" || (node as HTMLElement).inert) return true
	}
	return false
}

for (const theme of THEMES) {
	for (const width of [375, 1024, 1920]) {
		test(`Sted by keyboard at ${width} px (${theme})`, async ({ page }) => {
			await setTheme(page, theme)
			await page.setViewportSize({ width, height: 900 })
			await openSok(page)
			await sted(page).focus()
			await page.keyboard.type("ham")
			await expect(page.getByRole("option", { name: "Hamar" })).toBeVisible()
			await page.keyboard.press("ArrowDown")
			await page.keyboard.press("Enter")
			await expect(page).toHaveURL(/\/sok\?municipality=3403$/)
			// The chip in the field, the list still open, the typed text gone.
			await expect(stedChips(page).getByRole("row").filter({ hasText: "Hamar" })).toBeVisible()
			await expect(page.getByRole("listbox")).toBeVisible()
			await expect(sted(page)).toHaveValue("")
			await page.keyboard.press("Escape")
			await expect(page.getByRole("listbox")).toHaveCount(0)
			await expect(sted(page)).toBeFocused()
			expect(await noHorizontalScroll(page)).toBe(true)
		})
	}

	test(`the filter dialog by keyboard at 375 px (${theme})`, async ({ page }) => {
		await setTheme(page, theme)
		await page.setViewportSize({ width: 375, height: 800 })
		await openSok(page)
		await tabTo(page, trigger(page))
		await page.keyboard.press("Enter")
		await expect(dialog(page)).toBeVisible()
		const rus = dialog(page).getByRole("checkbox", { name: /^Rus og avhengighet/ })
		await tabTo(page, rus)
		await page.keyboard.press("Space")
		await expect(rus).toBeChecked()
		await expect(page).toHaveURL(/category=rus/)
		const footer = dialog(page).getByRole("button", { name: /^Vis \d+ treff$/ })
		const shown = (await footer.textContent())?.match(/\d+/)?.[0]
		await page.keyboard.press("Escape")
		await expect(dialog(page)).toHaveCount(0)
		await expect(page.getByRole("button", { name: "Flere filtre (1)" })).toBeFocused()
		await expect(page.getByRole("heading", { level: 1 })).toHaveText(`${shown} treff`)
	})
}

test("the result count is announced after a tick", async ({ page }) => {
	await page.setViewportSize({ width: 1024, height: 900 })
	await openSok(page)
	// Ticking Bolig gives exactly the count shown next to it.
	const count = await page
		.locator(".facet-sidebar .facet-option", { hasText: "Bolig" })
		.locator(".facet-count")
		.textContent()
	await page.getByRole("checkbox", { name: /^Bolig/ }).check()
	await expect(page.getByRole("heading", { level: 1 })).toHaveText(`${count} treff`)
	await expect(statusRegion(page)).toContainText(`${count} treff`)
})

test("with the dialog open, the status region stays audible and speaks the new count", async ({
	page,
}) => {
	await page.setViewportSize({ width: 375, height: 800 })
	await openSok(page)
	await trigger(page).click()
	await expect(dialog(page)).toBeVisible()
	expect(await page.locator("#app").evaluate(hiddenFromScreenReaders)).toBe(true)
	expect(await statusRegion(page).evaluate(hiddenFromScreenReaders)).toBe(false)
	await dialog(page)
		.getByRole("checkbox", { name: /^Bolig/ })
		.check()
	const footer = dialog(page).getByRole("button", { name: /^Vis \d+ treff$/ })
	await expect(footer).toHaveText(/^Vis \d+ treff$/)
	const shown = (await footer.textContent())?.match(/\d+/)?.[0]
	await expect(statusRegion(page)).toContainText(`${shown} treff`)
})

for (const [width, sidebar] of [
	[375, false],
	[1280, false],
	[1920, true],
] as const) {
	test(`at 200 % text and ${width} px the facets are a ${sidebar ? "sidebar" : "dialog"}, with no sideways scroll`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 900 })
		await openSok(page, "/sok?municipality=3403&category=rus&feature=lavterskel")
		await page.addStyleTag({ content: "html { font-size: 200% }" })
		if (sidebar) {
			await expect(page.locator(".facet-sidebar")).toBeVisible()
			await expect(trigger(page)).toBeHidden()
		} else {
			await expect(page.locator(".facet-sidebar")).toBeHidden()
			await expect(trigger(page)).toBeVisible()
		}
		expect(await filterFits(page)).toBe(true)
	})
}

// The old follow-up: the /sok filter panel scrolled sideways at 375 px, and at 200 % text.
for (const fontSize of ["100%", "200%"]) {
	test(`the /sok filter never scrolls sideways at 375 px and ${fontSize} text`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 375, height: 800 })
		await openSok(page, "/sok?county=34&municipality=3403&category=rus&cost=free")
		await page.addStyleTag({ content: `html { font-size: ${fontSize} }` })
		expect(await filterFits(page)).toBe(true)
		await sted(page).focus()
		await expect(page.getByRole("listbox")).toBeVisible()
		expect(await filterFits(page)).toBe(true)
		await page.keyboard.press("Escape")
		await trigger(page).click()
		await expect(dialog(page)).toBeVisible()
		expect(await dialog(page).evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
		expect(await filterFits(page)).toBe(true)
		if (fontSize === "100%") expect(await noHorizontalScroll(page)).toBe(true)
	})
}

for (const width of [768, 1024, 1280, 1920]) {
	test(`Søk and Sted share one height, one bottom edge and one label baseline at ${width} px`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 900 })
		await openSok(page)
		const m = await page.evaluate(() => {
			const box = (selector: string) => {
				const el = document.querySelector(selector)
				if (!el) throw new Error(`no ${selector}`)
				const r = el.getBoundingClientRect()
				return { bottom: r.bottom, height: r.height }
			}
			// The bottom of a label's last line box. Both labels use one font and size, so equal
			// bottoms mean one baseline.
			const lastLine = (selector: string) => {
				const el = document.querySelector(selector)
				if (!el) throw new Error(`no ${selector}`)
				const range = document.createRange()
				range.selectNodeContents(el)
				const lines = range.getClientRects()
				return lines[lines.length - 1]?.bottom ?? Number.NaN
			}
			return {
				search: box(".place-bar input[type='search']"),
				place: box(".place-group"),
				searchLabel: lastLine(".place-bar search label"),
				placeLabel: lastLine(".place-field .field-label"),
			}
		})
		expect(Math.abs(m.search.height - m.place.height)).toBeLessThanOrEqual(1)
		expect(Math.abs(m.search.bottom - m.place.bottom)).toBeLessThanOrEqual(1)
		expect(Math.abs(m.searchLabel - m.placeLabel)).toBeLessThanOrEqual(1)
	})
}

// Guards c5516ec: the remove button overlapped no border then, so each chip was 46 px beside a
// 44 px Nullstill alt. The row is bottom-aligned, so only the height check catches that.
for (const width of [1280, 1920]) {
	test(`chips and Nullstill alt are all 44 px with one bottom edge at ${width} px`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 900 })
		await openSok(page, "/sok?municipality=3403&category=rus&cost=free")
		const m = await page.evaluate(() => {
			const box = (el: Element) => {
				const r = el.getBoundingClientRect()
				return { bottom: r.bottom, height: r.height }
			}
			const reset = document.querySelector(".active-filters > .btn-secondary")
			if (!reset) throw new Error("no Nullstill alt")
			return {
				reset: box(reset),
				chips: [...document.querySelectorAll(".active-filters .filter-chip")].map(box),
			}
		})
		expect(m.chips.length).toBe(3)
		expect(m.reset.height).toBeCloseTo(44, 0)
		for (const chip of m.chips) {
			expect(chip.height).toBeCloseTo(44, 0)
			expect(Math.abs(chip.bottom - m.reset.bottom)).toBeLessThanOrEqual(1)
		}
	})
}

test("tabbing to the last checkbox in the dialog leaves it above the footer", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 640 })
	await openSok(page)
	await trigger(page).click()
	await expect(dialog(page)).toBeVisible()
	// Pris starts closed; open it so its last box is the last one in the dialog.
	const pris = dialog(page).locator("summary", { hasText: "Pris" })
	await tabTo(page, pris)
	await page.keyboard.press("Enter")
	const last = dialog(page).getByRole("checkbox").last()
	await tabTo(page, last)
	const rowBottom = await last.evaluate(
		(el) => el.closest("label")?.getBoundingClientRect().bottom ?? Number.NaN
	)
	const footerTop = await dialog(page)
		.locator(".facet-dialog-footer")
		.evaluate((el) => el.getBoundingClientRect().top)
	expect(rowBottom).toBeLessThanOrEqual(footerTop)
})

test("five Sted picks at 375 px wrap inside the field and never scroll sideways", async ({
	page,
}) => {
	await page.setViewportSize({ width: 375, height: 800 })
	await openSok(page)
	await sted(page).click()
	for (const name of ["Innlandet", "Elverum", "Gjøvik", "Hamar", "Lillehammer"]) {
		await page.getByRole("option", { name }).click()
	}
	await expect(stedChips(page).getByRole("row")).toHaveCount(5)
	const group = page.locator(".place-group")
	expect(await group.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true)
	expect(await group.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThan(44)
	expect(await noHorizontalScroll(page)).toBe(true)
})

test.describe("forced colours", () => {
	test.use({ forcedColors: "active" })

	test("a focused checkbox keeps a visible ring, and chips keep their border", async ({ page }) => {
		await page.setViewportSize({ width: 1024, height: 900 })
		await openSok(page, "/sok?category=rus")
		const box = page.getByRole("checkbox", { name: /^Bolig/ })
		await tabTo(page, box)
		const ring = await box.evaluate((el) => {
			const s = getComputedStyle(el)
			return { style: s.outlineStyle, width: Number.parseFloat(s.outlineWidth) }
		})
		expect(ring.style).not.toBe("none")
		expect(ring.width).toBeGreaterThan(0)
		const border = await activeChips(page)
			.locator(".filter-chip")
			.first()
			.evaluate((el) => {
				const s = getComputedStyle(el)
				return { style: s.borderTopStyle, width: Number.parseFloat(s.borderTopWidth) }
			})
		expect(border.style).toBe("solid")
		expect(border.width).toBeGreaterThan(0)
	})
})

test("a failed catalog shows Søk and the error state only", async ({ page }) => {
	await page.route("**/data/*.json", (route) => route.fulfill({ status: 500, body: "down" }))
	await page.setViewportSize({ width: 375, height: 812 })
	await page.goto("/sok")
	await hydrated(page)
	await expect(page.getByRole("heading", { name: "Noe gikk galt" })).toBeVisible()
	await expect(
		page.getByRole("searchbox", { name: "Søk etter tjeneste, kommune eller tema" })
	).toBeVisible()
	await expect(sted(page)).toHaveCount(0)
	await expect(page.getByRole("radio")).toHaveCount(0)
	await expect(page.getByRole("checkbox")).toHaveCount(0)
	await expect(trigger(page)).toHaveCount(0)
	await expect(page.locator(".sok-top")).toHaveCount(0)
})

// The dialog covers the header, so it carries its own quick exit; Shift three times works too,
// because useShiftExit listens on the document in the capture phase.
test("quick exit works from inside the filter dialog, by button and by Shift", async ({ page }) => {
	const stub =
		'<!doctype html><html lang="nb"><title>Stub</title><p id="exit-stub">Utgang</p></html>'
	await page.route(/^https:\/\/www\.google\.com\//, (route) =>
		route.fulfill({ status: 200, contentType: "text/html", body: stub })
	)
	await page.setViewportSize({ width: 375, height: 800 })
	await openSok(page)
	await trigger(page).click()
	await expect(dialog(page).getByRole("link", { name: "Forlat siden" })).toBeVisible()
	await dialog(page)
		.getByRole("checkbox", { name: /^Bolig/ })
		.focus()
	await page.keyboard.press("Shift")
	await page.keyboard.press("Shift")
	await page.keyboard.press("Shift")
	await expect(page.locator("#exit-stub")).toBeVisible()
	await openSok(page)
	await trigger(page).click()
	await dialog(page).getByRole("link", { name: "Forlat siden" }).click()
	await expect(page.locator("#exit-stub")).toBeVisible()
})

// A tablet turned to landscape with the dialog open: the trigger is gone when it closes.
test("closing the dialog after the window grows into the sidebar layout focuses the sidebar", async ({
	page,
}) => {
	await page.setViewportSize({ width: 900, height: 800 })
	await openSok(page)
	await trigger(page).click()
	await expect(dialog(page)).toBeVisible()
	await page.setViewportSize({ width: 1200, height: 800 })
	await page.keyboard.press("Escape")
	await expect(dialog(page)).toHaveCount(0)
	await expect(page.locator(".facet-sidebar summary").first()).toBeFocused()
})

// Review Focus 1.
test("Back after removing a chip brings the chip and its box back", async ({ page }) => {
	await page.setViewportSize({ width: 1024, height: 900 })
	await openSok(page, "/sok?municipality=3403&category=rus")
	const rus = page.getByRole("checkbox", { name: /^Rus og avhengighet/ })
	await activeChips(page).getByRole("button", { name: "Fjern Rus og avhengighet" }).click()
	await expect(page).toHaveURL(/\/sok\?municipality=3403$/)
	await expect(rus).not.toBeChecked()
	await page.goBack()
	await expect(page).toHaveURL(/\/sok\?municipality=3403&category=rus$/)
	await expect(rus).toBeChecked()
	await expect(
		activeChips(page).getByRole("row").filter({ hasText: "Rus og avhengighet" })
	).toBeVisible()
	await stedChips(page).getByRole("button", { name: "Fjern Hamar" }).click()
	await expect(page).toHaveURL(/\/sok\?category=rus$/)
	await page.goBack()
	await expect(page).toHaveURL(/\/sok\?municipality=3403&category=rus$/)
	await expect(stedChips(page).getByRole("row").filter({ hasText: "Hamar" })).toBeVisible()
})

// Review Focus 4.
test("switching to English keeps the filters and shows English labels", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 })
	await openSok(page, "/sok?category=rus&municipality=3403")
	await page.locator("header .header-tools summary").click()
	await page.locator("header .header-tools").getByRole("link", { name: "English" }).click()
	await expect(page).toHaveURL(/\/en\/sok\?municipality=3403&category=rus$/)
	const chips = page.getByRole("grid", { name: "Selected filters" })
	await expect(
		chips.getByRole("row").filter({ hasText: "Substance use and addiction" })
	).toBeVisible()
	await expect(chips.getByRole("row").filter({ hasText: "Hamar" })).toBeVisible()
	await expect(page.getByRole("checkbox", { name: /^Substance use and addiction/ })).toBeChecked()
	await expect(page.getByRole("combobox", { name: "Place" })).toBeVisible()
})
