import { render, screen } from "@testing-library/react"
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

test("the prerendered header has the picker and real links, so it works before JavaScript", async () => {
	const { html } = await prerender("/sok", {})
	expect(html).toContain('<details class="picker"')
	expect(html).toMatch(/<a[^>]+href="\/en\/sok"/)
})
