import { expect, test } from "@playwright/test"

// The header is sticky, so an in-page anchor must land below it, not under it.
// The footer's "Meld feil" link points at /om#meld-feil on a full load.
const sizes = [
	{ width: 375, height: 812 },
	{ width: 1280, height: 720 },
]
const paths = ["/om#meld-feil", "/en/om#meld-feil"]

for (const size of sizes) {
	for (const path of paths) {
		test(`${path} lands below the sticky header at ${size.width}x${size.height}`, async ({
			page,
		}) => {
			await page.setViewportSize(size)
			await page.goto(path)
			await page.evaluate(() => document.fonts.ready)
			const header = await page.getByRole("banner").boundingBox()
			const heading = await page.locator("#meld-feil").boundingBox()
			expect(header).not.toBeNull()
			expect(heading).not.toBeNull()
			if (!header || !heading) return
			expect(heading.y).toBeGreaterThanOrEqual(header.y + header.height)
		})
	}
}
