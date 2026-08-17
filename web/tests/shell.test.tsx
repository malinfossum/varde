import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"

function stubResources() {
	// Left permanently pending — these tests assert on the shell/toggle only, never on
	// fetched content, and a resource fetch that actually settled would race the language
	// toggle's own explicit announcement for the single shared live region (both the "loading"
	// and "ready" transitions call announce()). Neither test needs the network to resolve.
	vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise(() => {}))
}

test("shell renders skip link, quick exit and akutt shortcut", () => {
	stubResources()
	render(<App />)
	expect(screen.getByRole("link", { name: "Hopp til innhold" })).toBeInTheDocument()
	expect(screen.getByRole("button", { name: "Forlat siden" })).toBeInTheDocument()
	expect(screen.getByRole("link", { name: "Akutt hjelp" })).toBeInTheDocument()
})

test("language toggle switches strings, html lang, keeps focus, announces", async () => {
	stubResources()
	const user = userEvent.setup()
	render(<App />)
	const toggle = screen.getByRole("button", { name: "English" })
	await user.click(toggle)
	expect(document.documentElement.lang).toBe("en")
	expect(toggle).toHaveFocus()
	expect(screen.getByText("Language is now English")).toBeInTheDocument() // the live region
	expect(screen.getByRole("button", { name: "Norsk" })).toBeInTheDocument()
	expect(window.location.search).toContain("lang=en")
})
