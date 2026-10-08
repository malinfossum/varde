import { expect, test } from "@playwright/test"

// An in-page anchor must land below whatever stays at the top: the sticky header where it is
// sticky, and the pinned quick exit where the header scrolls away (phones and short screens).
// The footer's "Meld feil" link points at /om#meld-feil on a full load.
const sizes = [
	{ width: 375, height: 812 },
	{ width: 1280, height: 720 },
]
const paths = ["/om#meld-feil", "/en/om#meld-feil"]

for (const size of sizes) {
	for (const path of paths) {
		test(`${path} lands under neither the header nor the pinned exit at ${size.width}x${size.height}`, async ({
			page,
		}) => {
			await page.setViewportSize(size)
			await page.goto(path)
			await page.evaluate(() => document.fonts.ready)
			const header = await page.getByRole("banner").boundingBox()
			const exit = await page.locator(".quick-exit").boundingBox()
			const heading = await page.locator("#meld-feil").boundingBox()
			expect(header).not.toBeNull()
			expect(exit).not.toBeNull()
			expect(heading).not.toBeNull()
			if (!header || !exit || !heading) return
			expect(heading.y).toBeGreaterThanOrEqual(
				Math.max(header.y + header.height, exit.y + exit.height)
			)
		})
	}
}
