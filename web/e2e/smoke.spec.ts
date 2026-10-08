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

// The prerender writes file-form pages (resources/1.html). If vite preview fell back to
// index.html instead, this would show the landing headline, and every later check would be
// measuring the wrong page.
test("vite preview serves the file-form detail page, not the landing fallback", async ({
	page,
}) => {
	await page.goto("/resources/1")
	await expect(page.getByRole("heading", { level: 1 })).toContainText("Hjelpetelefonen")
})
