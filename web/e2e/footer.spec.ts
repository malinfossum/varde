import { expect, test } from "@playwright/test"
import { settle } from "./helpers.ts"

const widths = [375, 1280]
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
