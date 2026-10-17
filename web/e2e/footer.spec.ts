import { expect, type Page, test } from "@playwright/test"
import { noHorizontalScroll, setTheme, settle, THEMES } from "./helpers.ts"

// 1920: the footer is one row there, so the 113 target must not reach the links.
const widths = [375, 1280, 1920]
const paths = ["/", "/en/"]

for (const width of widths) {
	for (const path of paths) {
		test(`${path} footer 113: tight word spacing, 44 px target at ${width} px`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 812 })
			await page.goto(path)
			await settle(page)
			const link = page.getByRole("contentinfo").getByRole("link", { name: "113", exact: true })
			await link.scrollIntoViewIfNeeded()
			const m = await link.evaluate((a) => {
				const glyphRange = document.createRange()
				glyphRange.selectNodeContents(a)
				const glyph = glyphRange.getBoundingClientRect()
				const prev = a.previousSibling as Text
				const next = a.nextSibling as Text
				const trimmed = document.createRange()
				trimmed.setStart(prev, 0)
				trimmed.setEnd(prev, prev.data.trimEnd().length)
				const prevRect = [...trimmed.getClientRects()].pop() as DOMRect
				const nextRange = document.createRange()
				nextRange.setStart(next, 0)
				nextRange.setEnd(next, 1)
				const nextRect = nextRange.getBoundingClientRect()
				// Walk outward from the number's centre while the point still hits the link.
				const hit = (x: number, y: number) => document.elementFromPoint(x, y) === a
				const cx = Math.round(glyph.x + glyph.width / 2)
				const cy = Math.round(glyph.y + glyph.height / 2)
				let left = cx
				let right = cx
				let top = cy
				let bottom = cy
				while (hit(left - 1, cy)) left--
				while (hit(right + 1, cy)) right++
				while (hit(cx, top - 1)) top--
				while (hit(cx, bottom + 1)) bottom++
				return {
					before: glyph.left - prevRect.right,
					after: nextRect.left - glyph.right,
					hitW: right - left + 1,
					hitH: bottom - top + 1,
				}
			})
			// A normal word space at 14 px is about 3.5 px; allow a little for kerning and rounding.
			expect(m.before).toBeLessThanOrEqual(6)
			expect(m.after).toBeLessThanOrEqual(2)
			// The scan has a one-pixel rounding tolerance at each edge.
			expect(m.hitW).toBeGreaterThanOrEqual(43)
			expect(m.hitH).toBeGreaterThanOrEqual(43)
		})
	}
}

type Box = { label: string; top: number; bottom: number; height: number }

// Every footer control except the 113 link, whose own box is the 20 px glyph (its 44 px target
// is an ::after box, checked above).
async function footerControls(page: Page): Promise<Box[]> {
	return page.evaluate(() =>
		[...document.querySelectorAll<HTMLElement>("footer a, footer button")]
			.filter((el) => !el.closest(".footer-liability"))
			.map((el) => {
				const r = el.getBoundingClientRect()
				return {
					label: el.innerText.trim() || el.querySelector(".visually-hidden")?.textContent || "",
					top: r.top,
					bottom: r.bottom,
					height: r.height,
				}
			})
	)
}

function rowsOf(boxes: Box[]): Box[][] {
	const rows: Box[][] = []
	for (const box of [...boxes].sort((a, b) => a.top - b.top)) {
		const row = rows.find((r) => Math.abs(r[0].top - box.top) < 4)
		if (row) row.push(box)
		else rows.push([box])
	}
	return rows
}

// Spec: Width budget and Height. One row from 1280 px keeps the landing on one 1920 x 950 screen.
for (const width of [1280, 1920]) {
	for (const theme of THEMES) {
		for (const path of paths) {
			test(`footer ${path} at ${width} px (${theme}): one row, 69 px at most`, async ({ page }) => {
				await page.setViewportSize({ width, height: 950 })
				await setTheme(page, theme)
				await page.goto(path)
				await settle(page)
				const height = await page
					.locator("footer")
					.evaluate((f) => f.getBoundingClientRect().height)
				expect(height).toBeLessThanOrEqual(69.5)
				const rows = rowsOf(await footerControls(page))
				expect(
					rows.length,
					rows
						.flat()
						.map((b) => b.label)
						.join(" | ")
				).toBe(1)
			})
		}
	}
}

for (const width of [375, 1024, 1280, 1920]) {
	for (const path of paths) {
		test(`footer ${path} at ${width} px: every control 44 px, one bottom edge per row`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height: 900 })
			await page.goto(path)
			await settle(page)
			for (const row of rowsOf(await footerControls(page))) {
				for (const box of row) expect(box.height, box.label).toBeCloseTo(44, 0)
				const bottoms = row.map((b) => b.bottom)
				expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThan(1)
			}
		})
	}
}

test("at 375 px the GitHub glyph lines up with the text edge", async ({ page }) => {
	await page.setViewportSize({ width: 375, height: 812 })
	await page.goto("/")
	await settle(page)
	const m = await page.evaluate(() => ({
		glyph: (document.querySelector("footer .footer-bar a svg") as Element).getBoundingClientRect()
			.left,
		text: (document.querySelector("footer .footer-liability") as Element).getBoundingClientRect()
			.left,
	}))
	expect(Math.abs(m.glyph - m.text)).toBeLessThanOrEqual(1)
})

for (const width of [375, 1280]) {
	test(`with text at 200 % the footer at ${width} px never scrolls sideways`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 })
		await page.goto("/en/")
		await settle(page)
		await page.evaluate(() => {
			document.documentElement.style.fontSize = "200%"
		})
		expect(await noHorizontalScroll(page)).toBe(true)
	})
}

test("forced colours keep the pressed pill button marked", async ({ page }) => {
	await page.emulateMedia({ forcedColors: "active" })
	await setTheme(page, "dark")
	await page.goto("/")
	const pressed = page.locator('footer .theme-pill-btn[aria-pressed="true"]')
	await expect(pressed).toHaveCount(1)
	const border = await pressed.evaluate((el) => {
		const s = getComputedStyle(el)
		return { style: s.borderTopStyle, width: Number.parseFloat(s.borderTopWidth) }
	})
	expect(border.style).toBe("solid")
	expect(border.width).toBeGreaterThanOrEqual(2)
})

// Spec: Tooltips. Above the control, inside the screen, hoverable, and Escape hides them.
for (const width of [320, 375, 1920]) {
	test(`footer tooltips at ${width} px sit above their control, on screen, and stay while hovered`, async ({
		page,
	}) => {
		await page.setViewportSize({ width, height: 900 })
		await page.goto("/")
		await settle(page)
		const hosts = page.locator("footer .footer-tip-host")
		await expect(hosts).toHaveCount(4)
		for (let i = 0; i < 4; i++) {
			const host = hosts.nth(i)
			await host.hover()
			const tip = host.locator(".footer-tip")
			await expect(tip).toBeVisible()
			const m = await host.evaluate((el) => {
				const h = el.getBoundingClientRect()
				const b = (el.querySelector(".footer-tip-bubble") as Element).getBoundingClientRect()
				const t = (el.querySelector(".footer-tip") as Element).getBoundingClientRect()
				return {
					hostTop: h.top,
					tipBottom: t.bottom,
					left: b.left,
					right: b.right,
					vw: document.documentElement.clientWidth,
					bubbleX: b.left + b.width / 2,
					bubbleY: b.top + b.height / 2,
				}
			})
			expect(m.tipBottom).toBeLessThanOrEqual(m.hostTop + 1)
			expect(m.left).toBeGreaterThanOrEqual(0)
			expect(m.right).toBeLessThanOrEqual(m.vw)
			await page.mouse.move(m.bubbleX, m.bubbleY, { steps: 5 })
			await expect(tip).toBeVisible()
		}
		await page.keyboard.press("Escape")
		await expect(hosts.nth(3).locator(".footer-tip")).toBeHidden()
	})
}

// Keyboard users get the same tooltip on :focus-visible. Shift+Tab from the first pill button is
// a real keyboard move onto the GitHub link, whatever links sit before it.
test("the GitHub tooltip shows on keyboard focus", async ({ page }) => {
	await page.setViewportSize({ width: 1920, height: 950 })
	await page.goto("/")
	await settle(page)
	await page.locator("footer .theme-pill-btn").first().focus()
	await page.keyboard.press("Shift+Tab")
	const github = page.locator("footer .footer-bar a")
	await expect(github).toBeFocused()
	await expect(github.locator(".footer-tip")).toBeVisible()
})
