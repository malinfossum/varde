import { act, render, screen } from "@testing-library/react"
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
	// ListPage's initial "Laster …" announcement fires at mount, ahead of this click, and lands
	// in the same live region well within the compose window — so the region now reads
	// "Laster …. Language is now English" rather than the language text alone. That composition
	// (see tests/announcer.test.tsx) is exactly what keeps this announcement from being stomped
	// in the real app, so match on a substring instead of the old exact string.
	expect(screen.getByText(/Language is now English/)).toBeInTheDocument() // the live region
	expect(screen.getByRole("button", { name: "Norsk" })).toBeInTheDocument()
	expect(window.location.search).toContain("lang=en")
})

test("browser back/forward across a language change updates the UI language", () => {
	stubResources()
	window.history.pushState(null, "", "/?lang=en")
	render(<App />)
	expect(screen.getByRole("button", { name: "Norsk" })).toBeInTheDocument() // started in English

	// Simulate the browser's own back navigation: it moves the URL and fires popstate itself —
	// pushState alone does not, so trigger both like a real back button would.
	act(() => {
		window.history.pushState(null, "", "/")
		window.dispatchEvent(new PopStateEvent("popstate"))
	})

	expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument() // back to nb
})

test("language toggle resets page to 1 instead of carrying it into the new language", async () => {
	stubResources()
	// A prior test's toggle already wrote "en" to the shared in-memory localStorage shim, which
	// would otherwise make this render start in English (resolveLang falls back to storage when
	// the URL carries no lang param) and flip the button label out from under this test.
	localStorage.clear()
	window.history.pushState(null, "", "/?page=3")
	const user = userEvent.setup()
	render(<App />)
	const toggle = screen.getByRole("button", { name: "English" })
	await user.click(toggle)
	expect(window.location.search).toContain("lang=en")
	expect(window.location.search).not.toContain("page=")
})
