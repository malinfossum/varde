import { expect, test } from "@playwright/test"
import { settle } from "./helpers.ts"

// A directly loaded page hydrates its prerendered HTML in place. If the Suspense boundary
// around the lazy pages gets new children before its chunk has loaded (the shell's theme state
// lands in an effect right after hydration), React throws that HTML away and shows the
// fallback, so the page flashed "Laster …" over content that was already there. /sok is not
// here: its prerender is the loading state, and the list fills in after the index loads.
for (const path of [
	"/resources/102",
	"/en/resources/102",
	"/kommune/hamar",
	"/en/kommune/hamar",
	"/om",
	"/en/om",
]) {
	test(`${path} keeps its prerendered heading through hydration`, async ({ page }) => {
		await page.addInitScript(() => {
			const seen: string[] = []
			;(window as unknown as { seen: string[] }).seen = seen
			new MutationObserver(() => {
				const text = document.querySelector("main h1")?.textContent
				if (text && seen.at(-1) !== text) seen.push(text)
			}).observe(document, { subtree: true, childList: true, characterData: true })
		})
		await page.goto(path)
		// settle() reloads with a warm font cache, the same way the layout specs measure.
		await settle(page)
		await page.waitForTimeout(500)
		const seen = await page.evaluate(() => (window as unknown as { seen: string[] }).seen)
		expect(seen).toHaveLength(1)
	})
}
