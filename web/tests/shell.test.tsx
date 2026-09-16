import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { stubDataFiles } from "./stubData.ts"

function stubResources() {
	// Left permanently pending — these tests assert on the shell/toggle only, never on
	// fetched content, and a resource fetch that actually settled would race the language
	// toggle's own explicit announcement for the single shared live region (both the "loading"
	// and "ready" transitions call announce()). Neither test needs the network to resolve.
	vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise(() => {}))
}

test("shell renders skip link, quick exit, acute strip and theme toggle", () => {
	stubResources()
	render(<App />)
	expect(screen.getByRole("link", { name: "Hopp til innhold" })).toBeInTheDocument()
	expect(screen.getByRole("button", { name: "Forlat siden" })).toBeInTheDocument()
	expect(screen.getByRole("region", { name: "Nødnumre" })).toBeInTheDocument()
	expect(screen.getByRole("button", { name: "Mørkt tema" })).toBeInTheDocument()
})

test("the language is read from the path prefix", () => {
	stubDataFiles()
	window.history.pushState(null, "", "/en/")
	render(<App />)
	expect(screen.getByRole("link", { name: "Norsk" })).toHaveAttribute("href", "/")
	expect(document.documentElement.lang).toBe("en")
})

test("the toggle links to the same page in the other language, dropping page, and remembers the choice", async () => {
	stubDataFiles()
	window.history.pushState(null, "", "/sok?search=nav&page=2")
	render(<App />)
	const toggle = screen.getByRole("link", { name: "English" })
	expect(toggle).toHaveAttribute("href", "/en/sok?search=nav")
	expect(toggle).toHaveAttribute("hreflang", "en")
	expect(toggle).toHaveAttribute("lang", "en")
	await userEvent.click(toggle)
	expect(window.location.pathname).toBe("/en/sok")
	expect(localStorage.getItem("varde.lang")).toBe("en")
	// The link never unmounts across the re-render (same component, same position in the tree),
	// so the browser's own focus-on-click behaviour survives it — same guarantee the old
	// button-based toggle had (spec: Focus). Re-query it by its new name; it's still the same
	// DOM node, just relabelled.
	const toggledBack = screen.getByRole("link", { name: "Norsk" })
	expect(toggledBack).toHaveFocus()
	// ListPage's own "Laster …"/results announcements can land in the same 1500ms compose
	// window as this one (see the composition note on the shared live region in
	// announcer.test.tsx), so match on a substring rather than the exact composed string.
	expect(screen.getByText(/Language is now English/)).toBeInTheDocument()
})

test("browser back across a language change updates the UI language", () => {
	stubDataFiles()
	window.history.pushState(null, "", "/en/")
	render(<App />)
	act(() => {
		window.history.pushState(null, "", "/")
		window.dispatchEvent(new PopStateEvent("popstate"))
	})
	expect(screen.getByRole("link", { name: "English" })).toBeInTheDocument()
})

test("the landing route renders a heading and loads no data", () => {
	// Earlier tests in this file leave their own fetch mocks and call history behind (this
	// file never restores between tests) — start from a clean slate so this assertion only
	// sees calls this test itself would have made.
	vi.restoreAllMocks()
	const fetchSpy = vi.spyOn(globalThis, "fetch")
	window.history.pushState(null, "", "/")
	render(<App />)
	// The header carries no heading of its own (Task 7) — the landing page's own h1 is the
	// only level-1 heading on this route, and it lives inside <main>. Task 8 gave it the real
	// headline copy, so this checks for that text rather than the old placeholder's "Varde".
	const main = screen.getByRole("main")
	expect(
		within(main).getByRole("heading", { level: 1, name: /Finn riktig hjelp/ })
	).toBeInTheDocument()
	expect(fetchSpy).not.toHaveBeenCalled()
})
