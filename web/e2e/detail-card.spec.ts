import { expect, type Page, test } from "@playwright/test"
import { noHorizontalScroll, settle } from "./helpers.ts"

// Spec: the detail page as one card. Every check here was run red against the C2a layout before
// the build, which proves it can fail.

type Box = {
	top: number
	bottom: number
	left: number
	right: number
	width: number
	height: number
	fits: boolean
}

// Rounded boxes, plus whether the element's own content fits inside it (no sideways overflow).
async function boxes(page: Page, selector: string): Promise<Box[]> {
	return page.locator(selector).evaluateAll((els) =>
		els.map((el) => {
			const r = el.getBoundingClientRect()
			return {
				top: Math.round(r.top),
				bottom: Math.round(r.bottom),
				left: Math.round(r.left),
				right: Math.round(r.right),
				width: Math.round(r.width),
				height: Math.round(r.height),
				fits: el.scrollWidth <= el.clientWidth + 1,
			}
		})
	)
}

async function one(page: Page, selector: string): Promise<Box> {
	const [box] = await boxes(page, selector)
	if (!box) throw new Error(`nothing matches ${selector}`)
	return box
}

const overlaps = (a: Box, b: Box) =>
	a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

const RINGSAKER = ["/resources/102", "/en/resources/102"] as const

// Icon mode: Desktop Chrome has a mouse, so from 768 px the actions are 44 px icons in the
// card's top-right corner, beside the title and never over it.
for (const width of [768, 1024, 1920]) {
	for (const path of RINGSAKER) {
		test(`icon mode at ${width} px (${path}): three 44 px actions on one line beside the title`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 900 })
			await page.goto(path)
			await settle(page)
			const h1 = await one(page, "h1")
			const group = await one(page, ".detail-actions")
			const buttons = await boxes(page, ".action-btn")
			expect(buttons).toHaveLength(3)
			expect(overlaps(group, h1)).toBe(false)
			expect(Math.abs(group.top - h1.top)).toBeLessThanOrEqual(1)
			for (const b of buttons) {
				expect(b.width).toBe(44)
				expect(b.height).toBe(44)
			}
			expect(new Set(buttons.map((b) => b.top)).size).toBe(1)
			expect(new Set(buttons.map((b) => b.bottom)).size).toBe(1)
		})
	}
}

// I scale the text to 200 % on a desktop window: icon mode must stay intact, with the actions
// clear of the title.
test("icon mode at 1024 px with 200 % text keeps 44 px actions clear of the title", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1024, height: 900 })
	await page.goto("/resources/102")
	await page.addStyleTag({ content: "html { font-size: 200% }" })
	await page.evaluate(() => document.fonts.ready)
	const h1 = await one(page, "h1")
	const group = await one(page, ".detail-actions")
	expect(overlaps(group, h1)).toBe(false)
	for (const b of await boxes(page, ".action-btn")) {
		expect(b.width).toBe(44)
		expect(b.height).toBe(44)
	}
	expect(await noHorizontalScroll(page)).toBe(true)
})

// Labelled mode on a phone: three buttons in a row under the title, one width, one height of at
// least 56 px, one bottom edge. Every action and every tile is at least 44 px tall. The website
// and "Del av" links are text links in a line of text (WCAG 2.5.8 exempts them).
for (const path of RINGSAKER) {
	test(`labelled mode at 375 px (${path}): three equal buttons under the title`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 375, height: 900 })
		await page.goto(path)
		await settle(page)
		const h1 = await one(page, "h1")
		const buttons = await boxes(page, ".action-btn")
		expect(buttons).toHaveLength(3)
		expect(new Set(buttons.map((b) => b.width)).size).toBe(1)
		expect(new Set(buttons.map((b) => b.height)).size).toBe(1)
		expect(new Set(buttons.map((b) => b.bottom)).size).toBe(1)
		expect(buttons[0]?.height).toBeGreaterThanOrEqual(56)
		expect(buttons[0]?.top).toBeGreaterThanOrEqual(h1.bottom)
		await expect(page.locator(".action-label")).toHaveCount(3)
		for (const label of await page.locator(".action-label").all()) await expect(label).toBeVisible()
		for (const c of await boxes(page, ".detail-card .action-btn, .detail-card .contact-tile")) {
			expect(c.height).toBeGreaterThanOrEqual(44)
		}
	})
}

// Reflow: nothing scrolls sideways, and the tiles, the facts and the actions stay inside the card.
for (const [label, width, fontSize] of [
	["320 px", 320, "100%"],
	["200 % text at 375 px", 375, "200%"],
] as const) {
	for (const path of ["/resources/1", ...RINGSAKER]) {
		test(`the card reflows at ${label} (${path})`, async ({ page }) => {
			await page.setViewportSize({ width, height: 900 })
			await page.goto(path)
			await page.addStyleTag({ content: `html { font-size: ${fontSize} }` })
			await page.evaluate(() => document.fonts.ready)
			expect(await noHorizontalScroll(page)).toBe(true)
			const card = await one(page, "article.detail-card")
			const inner = await boxes(
				page,
				".detail-card .contact-tile, .detail-card .detail-facts dd, .detail-card .action-btn"
			)
			expect(inner.length).toBeGreaterThan(0)
			for (const b of inner) {
				expect(b.left).toBeGreaterThanOrEqual(card.left)
				expect(b.right).toBeLessThanOrEqual(card.right)
				expect(b.fits).toBe(true)
			}
		})
	}
}

// Below 768 px each tile is as tall as its own content: at 200 % text Ringsaker's email tile
// wraps and the phone tile does not stretch to match it.
test("below 768 px a tile is as tall as its own content (id 102, 200 % text)", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 900 })
	await page.goto("/resources/102")
	await page.addStyleTag({ content: "html { font-size: 200% }" })
	await page.evaluate(() => document.fonts.ready)
	const tiles = await boxes(page, ".contact-tile")
	expect(tiles).toHaveLength(2)
	expect(tiles[0]?.height).toBeLessThan(tiles[1]?.height ?? 0)
})

// The tooltip: hover and keyboard focus show the full name, Escape hides it, it stays inside the
// card, and the pointer can move onto it without it closing (WCAG 1.4.13).
test("at 1024 px the tooltips show on hover and focus, close on Escape and stay in the card", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1024, height: 900 })
	await page.goto("/resources/102")
	await settle(page)
	const card = await one(page, "article.detail-card")
	const buttons = page.locator(".action-btn")
	const names = ["Kopier nummer", /^(Del|Kopier lenke)$/, "Meld feil i oppføringen"] as const
	for (const [i, name] of names.entries()) {
		const button = buttons.nth(i)
		const tip = button.locator(".action-tip")
		await button.hover()
		await expect(tip).toBeVisible()
		await expect(tip).toHaveText(name)
		const t = await tip.boundingBox()
		const b = await button.boundingBox()
		if (!t || !b) throw new Error("no box")
		expect(t.y).toBeGreaterThanOrEqual(b.y + b.height)
		expect(t.x).toBeGreaterThanOrEqual(card.left)
		expect(t.x + t.width).toBeLessThanOrEqual(card.right)
		// Down across the 6 px gap and onto the bubble: it stays open.
		await page.mouse.move(b.x + b.width / 2, b.y + b.height + 3)
		await page.mouse.move(t.x + t.width - 4, t.y + t.height / 2)
		await expect(tip).toBeVisible()
	}
	await page.keyboard.press("Escape")
	await expect(buttons.nth(2).locator(".action-tip")).toBeHidden()
	await page.mouse.move(10, 890)
	await buttons.nth(0).focus()
	await page.keyboard.press("Tab")
	await expect(buttons.nth(1).locator(".action-tip")).toBeVisible()
})

// A confirmation replaces the name tooltip (spec: Visible feedback), so while it shows no other
// action may open its own tooltip over it: exactly one bubble, and the tooltips come back after.
test("at 1024 px a copy confirmation is the only bubble, on hover and on focus", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1024, height: 900 })
	await page.goto("/resources/102")
	await settle(page)
	const buttons = page.locator(".action-btn")
	const bubble = page.locator(".action-feedback")
	const tips = page.locator(".action-tip")
	await buttons.nth(0).click()
	await expect(bubble).toBeVisible()
	await buttons.nth(2).hover()
	await expect(bubble).toBeVisible()
	await expect(tips.filter({ visible: true })).toHaveCount(0)
	// Keyboard focus on the next action behaves the same way.
	await page.mouse.move(10, 890)
	await page.keyboard.press("Tab")
	await expect(buttons.nth(1)).toBeFocused()
	await expect(bubble).toBeVisible()
	await expect(tips.filter({ visible: true })).toHaveCount(0)
	// After the 4 seconds the tooltips work again.
	await expect(bubble).toHaveCount(0, { timeout: 6000 })
	await expect(buttons.nth(1).locator(".action-tip")).toBeVisible()
	await buttons.nth(2).hover()
	await expect(buttons.nth(2).locator(".action-tip")).toBeVisible()
})

test("Desktop Chrome at 1024 px gets icon mode: labels hidden, 44 px buttons", async ({ page }) => {
	await page.setViewportSize({ width: 1024, height: 900 })
	await page.goto("/resources/102")
	await settle(page)
	await expect(page.locator(".action-btn")).toHaveCount(3)
	await expect(page.locator(".action-label")).toHaveCount(3)
	for (const label of await page.locator(".action-label").all()) await expect(label).toBeHidden()
	for (const b of await boxes(page, ".action-btn")) expect(b.width).toBe(44)
})

// A service with a chat link and no phone (id 122) has no Copy action, so only two corner
// actions remain. They keep the same rules: equal size in labelled mode, 44 px side by side in
// icon mode.
test("labelled mode at 375 px, no phone (id 122): two equal buttons", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 900 })
	await page.goto("/resources/122")
	await settle(page)
	const buttons = await boxes(page, ".action-btn")
	expect(buttons).toHaveLength(2)
	const [a, b] = buttons as [Box, Box]
	expect(Math.abs(a.width - b.width)).toBeLessThanOrEqual(1)
	expect(Math.abs(a.height - b.height)).toBeLessThanOrEqual(1)
	expect(a.height).toBeGreaterThanOrEqual(56)
	expect(Math.abs(a.bottom - b.bottom)).toBeLessThanOrEqual(1)
	expect(await noHorizontalScroll(page)).toBe(true)
})

test("icon mode at 1024 px, no phone (id 122): two 44 px buttons side by side", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1024, height: 900 })
	await page.goto("/resources/122")
	await settle(page)
	const buttons = await boxes(page, ".action-btn")
	expect(buttons).toHaveLength(2)
	const [a, b] = buttons as [Box, Box]
	for (const box of buttons) {
		expect(Math.abs(box.width - 44)).toBeLessThanOrEqual(1)
		expect(Math.abs(box.height - 44)).toBeLessThanOrEqual(1)
	}
	expect(Math.abs(a.top - b.top)).toBeLessThanOrEqual(1)
	expect(b.left).toBeGreaterThanOrEqual(a.right)
})

// The confirmation sits inside its button, over the content below it. A tap there must reach
// that content, not copy again. Copy either succeeds or fails here; both show a bubble.
test("at 375 px the copy confirmation lets taps through to what it covers", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 900 })
	await page.goto("/resources/102")
	await settle(page)
	await page.locator(".action-btn").first().click()
	const bubble = page.locator(".action-feedback")
	await expect(bubble).toBeVisible()
	expect(await bubble.evaluate((el) => getComputedStyle(el).pointerEvents)).toBe("none")
})

// Labelled mode, top-aligned: "Kopier nummer" wraps to two lines at 375 px, and its icon must not
// float above the others. Icons share one top and labels share one top, at most 1 px apart.
test("labelled mode at 375 px: icons and labels start on one line even when a label wraps", async ({
	page,
}) => {
	await page.setViewportSize({ width: 375, height: 900 })
	await page.goto("/resources/102")
	await settle(page)
	const labels = await boxes(page, ".action-label")
	const icons = await boxes(page, ".action-btn > svg")
	expect(labels).toHaveLength(3)
	expect(icons).toHaveLength(3)
	// The test only means something while one label wraps.
	expect(Math.max(...labels.map((l) => l.height))).toBeGreaterThan(
		Math.min(...labels.map((l) => l.height)) + 5
	)
	const spread = (list: Box[]) =>
		Math.max(...list.map((b) => b.top)) - Math.min(...list.map((b) => b.top))
	expect(spread(icons)).toBeLessThanOrEqual(1)
	expect(spread(labels)).toBeLessThanOrEqual(1)
})

// The confirmation stays on one line, starts at its button's left edge and stays inside the
// card, for each button that can show one, at normal and at 200 % text. Copy may succeed or fail
// in headless Chrome; both show a bubble.
for (const [name, path, index, fontSize] of [
	["copy number (nb)", "/resources/102", 0, "100%"],
	["copy number (nb), 200 % text", "/resources/102", 0, "200%"],
	["copy link (en)", "/en/resources/102", 1, "100%"],
] as const) {
	test(`labelled mode at 375 px: the ${name} confirmation is one line inside the card`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 375, height: 900 })
		await page.goto(path)
		await settle(page)
		await page.addStyleTag({ content: `html { font-size: ${fontSize} }` })
		await page.evaluate(() => document.fonts.ready)
		await page.locator(".action-btn").nth(index).click()
		const bubble = page.locator(".action-feedback")
		await expect(bubble).toBeVisible()
		const m = await bubble.evaluate((el) => {
			const cs = getComputedStyle(el)
			const px = (v: string) => Number.parseFloat(v) || 0
			return {
				height: el.getBoundingClientRect().height,
				chrome:
					px(cs.paddingTop) +
					px(cs.paddingBottom) +
					px(cs.borderTopWidth) +
					px(cs.borderBottomWidth),
				lineHeight: px(cs.lineHeight),
			}
		})
		// One line: the height is below one and a half line boxes plus the bubble's own chrome.
		expect(m.lineHeight).toBeGreaterThan(0)
		expect(m.height).toBeLessThan(m.lineHeight * 1.5 + m.chrome)
		const [b] = await boxes(page, `.action-btn >> nth=${index}`)
		const [f] = await boxes(page, ".action-feedback")
		const card = await one(page, "article.detail-card")
		expect(Math.abs((f?.left ?? 0) - (b?.left ?? 1000))).toBeLessThanOrEqual(1)
		expect(f?.left).toBeGreaterThanOrEqual(card.left)
		expect(f?.right).toBeLessThanOrEqual(card.right)
		expect(f?.top).toBeGreaterThanOrEqual(card.top)
		expect(f?.bottom).toBeLessThanOrEqual(card.bottom)
	})
}

// Forced-colors mode drops fills, so each action keeps its edge only through its border.
test("each action keeps a visible border in forced-colors mode", async ({ page }) => {
	await page.emulateMedia({ forcedColors: "active" })
	await page.setViewportSize({ width: 375, height: 900 })
	await page.goto("/resources/102")
	const borders = await page
		.locator(".action-btn")
		.evaluateAll((els) =>
			els.map(
				(el) => `${getComputedStyle(el).borderTopStyle} ${getComputedStyle(el).borderTopWidth}`
			)
		)
	expect(borders).toHaveLength(3)
	for (const b of borders) expect(b).toBe("solid 1px")
})

// A touch tablet has the room but no hover, so it gets labelled mode at any width.
test.describe("on a touch tablet", () => {
	test.use({ isMobile: true, hasTouch: true })
	test("at 1024 px the actions are labelled buttons under the title", async ({ page }) => {
		await page.setViewportSize({ width: 1024, height: 900 })
		await page.goto("/resources/102")
		await settle(page)
		const h1 = await one(page, "h1")
		const group = await one(page, ".detail-actions")
		expect(group.top).toBeGreaterThanOrEqual(h1.bottom)
		await expect(page.locator(".action-label")).toHaveCount(3)
		for (const label of await page.locator(".action-label").all()) await expect(label).toBeVisible()
	})
})
