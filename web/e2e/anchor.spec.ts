import { expect, test } from "@playwright/test"

// An in-page anchor must land below whatever stays at the top: the sticky header, which now
// holds the quick exit at every width. The exit is inside the header, so the max() below is the
// header's bottom.
// The footer's "Meld feil" link points at /om#meld-feil on a full load.
const sizes = [
	{ width: 375, height: 812 },
	{ width: 1280, height: 720 },
]
const paths = ["/om#meld-feil", "/en/om#meld-feil"]

for (const size of sizes) {
	for (const path of paths) {
		test(`${path} lands under neither the sticky header nor the exit in its row at ${size.width}x${size.height}`, async ({
			page,
		}) => {
			await page.setViewportSize(size)
			await page.goto(path)
			await page.evaluate(() => document.fonts.ready)
			const header = await page.getByRole("banner").boundingBox()
			const exitInRow = await page.locator(".quick-exit").boundingBox()
			const heading = await page.locator("#meld-feil").boundingBox()
			expect(header).not.toBeNull()
			expect(exitInRow).not.toBeNull()
			expect(heading).not.toBeNull()
			if (!header || !exitInRow || !heading) return
			expect(heading.y).toBeGreaterThanOrEqual(
				Math.max(header.y + header.height, exitInRow.y + exitInRow.height)
			)
		})
	}
}
