import { expect, test } from "@playwright/test"
import { hydrated } from "./helpers.ts"

// Issue #79: a detail page loaded directly carries its own language's row in the page data. A
// switch to the other language must show that language's row, not the baked one. Row 2 has a
// real translation; the expected text comes from the export itself, so nothing is copied here.
const ID = 2

for (const { from, to, path, label } of [
	{ from: "nb", to: "en", path: `/resources/${ID}`, label: "English" },
	{ from: "en", to: "nb", path: `/en/resources/${ID}`, label: "Norsk" },
] as const) {
	test(`a directly loaded ${from} detail page shows the ${to} description after a switch`, async ({
		page,
	}) => {
		const description = async (lang: string) => {
			const response = await page.request.get(`/data/resources.${lang}.json`)
			const rows = (await response.json()) as { id: number; description: string }[]
			return rows.find((r) => r.id === ID)?.description ?? ""
		}
		const before = await description(from)
		const after = await description(to)
		expect(after).not.toBe(before)

		await page.goto(path)
		await expect(page.getByText(before)).toBeVisible()
		// Before hydration the row is a plain link, and a full page load never shows the bug. The
		// marker proves the switch stayed client-side.
		await hydrated(page)
		await page.evaluate(() => {
			;(window as unknown as { stayed: boolean }).stayed = true
		})
		await page.locator("header .header-tools summary").click()
		await page.locator("header .header-tools").getByRole("link", { name: label }).click()
		await expect(page).toHaveURL(to === "en" ? `/en/resources/${ID}` : `/resources/${ID}`)
		await expect(page.getByText(after)).toBeVisible()
		await expect(page.getByText(before)).toHaveCount(0)
		expect(await page.evaluate(() => (window as unknown as { stayed?: boolean }).stayed)).toBe(true)
	})
}
