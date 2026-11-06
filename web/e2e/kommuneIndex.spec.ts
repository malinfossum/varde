import { createRequire } from "node:module"
import { expect, test } from "@playwright/test"
import { hydrated, noHorizontalScroll, setTheme, settle, THEMES } from "./helpers.ts"

const axePath = createRequire(import.meta.url).resolve("axe-core/axe.min.js")

for (const [path, h1, prefix] of [
	["/kommune", "Hjelpetjenester per kommune", ""],
	["/en/kommune", "Help services by municipality", "/en"],
] as const) {
	test(`${path} loads directly and every count matches its kommune page`, async ({ page }) => {
		await page.goto(path)
		await expect(page.getByRole("heading", { level: 1, name: h1 })).toBeVisible()
		await expect(page.getByRole("region", { name: "Innlandet" })).toBeVisible()
		await expect(page.getByRole("region", { name: "Oslo" })).toBeVisible()
		const rows = await page.locator(".kommune-row").evaluateAll((els) =>
			els.map((a) => ({
				href: a.getAttribute("href") ?? "",
				count: Number.parseInt(a.querySelector(".kommune-count")?.textContent ?? "", 10),
			}))
		)
		expect(rows).toHaveLength(8)
		for (const { href, count } of rows) {
			expect(href.startsWith(`${prefix}/kommune/`)).toBe(true)
			await page.goto(href)
			const local = page.locator("section[aria-labelledby='kommune-local'] h3")
			await expect(local.first()).toBeVisible()
			expect(await local.count()).toBe(count)
		}
	})
}

test("a directly loaded /kommune switches to English in place", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 })
	await page.goto("/kommune")
	await hydrated(page)
	await page.evaluate(() => {
		;(window as unknown as { stayed: boolean }).stayed = true
	})
	await page.locator("header .header-tools summary").click()
	await page.locator("header .header-tools").getByRole("link", { name: "English" }).click()
	await expect(page).toHaveURL(/\/en\/kommune$/)
	await expect(
		page.getByRole("heading", { level: 1, name: "Help services by municipality" })
	).toBeVisible()
	await expect(page.getByRole("link", { name: /^Hamar \d+ services$/ })).toHaveAttribute(
		"href",
		"/en/kommune/hamar"
	)
	await expect(page).toHaveTitle("Help services by municipality – Varde")
	expect(await page.evaluate(() => (window as unknown as { stayed?: boolean }).stayed)).toBe(true)
})

test("the header link opens the index from the desktop nav and from the Meny", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 })
	await page.goto("/om")
	await page.locator(".header-nav").getByRole("link", { name: "Kommuner" }).click()
	await expect(page).toHaveURL(/\/kommune$/)
	await expect(
		page.getByRole("heading", { level: 1, name: "Hjelpetjenester per kommune" })
	).toBeFocused()
	await page.setViewportSize({ width: 375, height: 800 })
	await page.goto("/om")
	await page.locator("details.header-menu summary").click()
	await page.locator("details.header-menu").getByRole("link", { name: "Kommuner" }).click()
	await expect(page).toHaveURL(/\/kommune$/)
})

for (const width of [320, 768, 1024, 1280, 1600, 1920]) {
	test(`/kommune fits at ${width} px with 44 px rows and the planned columns`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 })
		await page.goto("/kommune")
		await settle(page)
		expect(await noHorizontalScroll(page)).toBe(true)
		const boxes = await page
			.locator("section[aria-labelledby='fylke-0'] .kommune-row")
			.evaluateAll((els) => els.map((a) => a.getBoundingClientRect().toJSON() as DOMRect))
		for (const box of boxes) expect(box.height).toBeGreaterThanOrEqual(44)
		const columns = new Set(boxes.map((b) => Math.round(b.left))).size
		const expected = width >= 1600 ? 4 : width >= 1024 ? 3 : width >= 768 ? 2 : 1
		expect(columns).toBe(expected)
	})
}

for (const theme of THEMES) {
	test(`axe passes on /kommune (${theme})`, async ({ page }) => {
		await setTheme(page, theme)
		await page.goto("/kommune")
		await settle(page)
		await page.addScriptTag({ path: axePath })
		const violations = await page.evaluate(async () => {
			const { axe } = window as unknown as {
				axe: { run(): Promise<{ violations: { id: string }[] }> }
			}
			return (await axe.run()).violations.map((v) => v.id)
		})
		expect(violations).toEqual([])
	})
}
