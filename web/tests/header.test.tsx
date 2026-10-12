import { render, screen, within } from "@testing-library/react"
import { afterEach, expect, test } from "vitest"
import { App } from "../src/App.tsx"
import { HELSENORGE_URL, NAV_URL } from "../src/services/externalLinks.ts"
import { stubDataFiles } from "./stubData.ts"

afterEach(() => {
	window.history.replaceState(null, "", "/")
})

test("the official URLs are pinned (checked live 2026-10-02)", () => {
	expect(HELSENORGE_URL).toBe("https://www.helsenorge.no")
	expect(NAV_URL).toBe("https://www.nav.no")
})

test("the header nav links to all services, Helsenorge and NAV, the last two in a new tab", () => {
	stubDataFiles()
	render(<App />)
	const nav = screen.getByRole("navigation", { name: "Hovedmeny" })
	expect(within(nav).getByRole("link", { name: "Alle tjenester" })).toHaveAttribute("href", "/sok")
	for (const [name, href] of [
		["Helsenorge (ekstern side, åpnes i ny fane)", HELSENORGE_URL],
		["NAV (ekstern side, åpnes i ny fane)", NAV_URL],
	]) {
		const link = within(nav).getByRole("link", { name })
		expect(link).toHaveAttribute("href", href)
		// noopener: the new tab cannot reach back into Varde. noreferrer: it is not told where
		// the visit came from.
		expect(link).toHaveAttribute("target", "_blank")
		expect(link).toHaveAttribute("rel", "noopener noreferrer")
	}
})

test("the English nav keeps the language prefix and says external and new tab in English", () => {
	stubDataFiles()
	window.history.replaceState(null, "", "/en/")
	render(<App />)
	const nav = screen.getByRole("navigation", { name: "Main menu" })
	expect(within(nav).getByRole("link", { name: "All services" })).toHaveAttribute("href", "/en/sok")
	expect(
		within(nav).getByRole("link", { name: "NAV (external site, opens in a new tab)" })
	).toBeInTheDocument()
})

// Link used to drop aria-label without a type error (TypeScript accepts any hyphenated
// prop), so the brand link was named "Varde" only. This pins the name in both languages.
test("the brand link is named for where it goes", () => {
	stubDataFiles()
	render(<App />)
	expect(screen.getByRole("link", { name: "Varde, til forsiden" })).toHaveAttribute("href", "/")
})

test("the English brand link is named in English", () => {
	stubDataFiles()
	window.history.replaceState(null, "", "/en/")
	render(<App />)
	expect(screen.getByRole("link", { name: "Varde, home page" })).toHaveAttribute("href", "/en/")
})
