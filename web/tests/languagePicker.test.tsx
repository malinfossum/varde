import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test } from "vitest"
import { App } from "../src/App.tsx"
import { render as prerender } from "../src/entry-server.tsx"
import { stubDataFiles } from "./stubData.ts"

afterEach(() => {
	window.history.replaceState(null, "", "/")
})

test("the trigger says Språk: Norsk, and each row carries its own lang and the current mark", () => {
	stubDataFiles()
	render(<App />)
	expect(screen.getByText("Språk: Norsk", { selector: ".visually-hidden" })).toBeInTheDocument()
	const norsk = screen.getByRole("link", { name: "Norsk" })
	const english = screen.getByRole("link", { name: "English" })
	expect(norsk).toHaveAttribute("aria-current", "page")
	expect(norsk).toHaveAttribute("lang", "nb")
	expect(norsk).toHaveAttribute("href", "/")
	expect(english).not.toHaveAttribute("aria-current")
	expect(english).toHaveAttribute("lang", "en")
	expect(english).toHaveAttribute("href", "/en/")
})

test("on an English page the English row carries the current mark", () => {
	stubDataFiles()
	window.history.pushState(null, "", "/en/")
	render(<App />)
	expect(screen.getByRole("link", { name: "English" })).toHaveAttribute("aria-current", "page")
	expect(screen.getByRole("link", { name: "Norsk" })).not.toHaveAttribute("aria-current")
})

test("choosing the current language does not navigate, keeps the page and refocuses the trigger", async () => {
	stubDataFiles()
	window.history.pushState(null, "", "/sok?search=nav&page=2")
	render(<App />)
	const before = window.history.length
	await userEvent.click(screen.getByRole("link", { name: "Norsk" }))
	expect(window.location.pathname + window.location.search).toBe("/sok?search=nav&page=2")
	expect(window.history.length).toBe(before)
	expect(document.activeElement?.tagName).toBe("SUMMARY")
})

// Last on purpose: prerender() in jsdom leaves UrlContext holding the prerendered URL, which
// would leak into any App render that runs after it in this file.
test("the prerendered header has the picker and real links, so it works before JavaScript", async () => {
	const { html } = await prerender("/sok", {})
	expect(html).toContain('<details class="picker"')
	expect(html).toMatch(/<a[^>]+href="\/en\/sok"/)
})
