import { expect, test } from "@playwright/test"

test("the prerendered landing page loads in both languages without console errors", async ({
	page,
}) => {
	const errors: string[] = []
	page.on("console", (message) => {
		if (message.type() === "error") errors.push(message.text())
	})
	page.on("pageerror", (error) => errors.push(error.message))
	await page.goto("/")
	await expect(page.getByRole("heading", { level: 1 })).toContainText("Finn riktig hjelp")
	await page.goto("/en/")
	await expect(page.getByRole("heading", { level: 1 })).toContainText("Find the right help")
	expect(errors).toEqual([])
})

// The prerender writes file-form pages (resources/1.html). The raw served HTML must already
// contain the resource name: the SPA index.html fallback has none, and the client would render
// it afterwards, which hides a missing prerender. Without this, every later check could be
// measuring a client-rendered page instead of the prerendered one.
test("vite preview serves the file-form detail page, not the landing fallback", async ({
	page,
}) => {
	const response = await page.request.get("/resources/1")
	expect(response.ok()).toBe(true)
	expect(await response.text()).toContain("Hjelpetelefonen")
	await page.goto("/resources/1")
	await expect(page.getByRole("heading", { level: 1 })).toContainText("Hjelpetelefonen")
})
