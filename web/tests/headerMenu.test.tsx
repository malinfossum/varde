import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test } from "vitest"
import { axe } from "vitest-axe"
import { App } from "../src/App.tsx"
import { render as prerender } from "../src/entry-server.tsx"
import { HELSENORGE_URL } from "../src/services/externalLinks.ts"
import { menu } from "./scope.ts"
import { stubDataFiles } from "./stubData.ts"

afterEach(() => {
	window.history.replaceState(null, "", "/")
	document.documentElement.removeAttribute("data-theme")
})

const menuDetails = () =>
	document.querySelector<HTMLDetailsElement>("details.header-menu") as HTMLDetailsElement
const trigger = () => menuDetails().querySelector("summary") as HTMLElement

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
	await user.click(trigger())
	await waitFor(() => expect(menuDetails().open).toBe(true))
}

test("the Meny holds the three links, then Språk and Tema as named groups", () => {
	stubDataFiles()
	render(<App />)
	expect(trigger()).toHaveAccessibleName("Meny")
	const m = menu()
	expect(m.getByRole("link", { name: "Alle tjenester" })).toHaveAttribute("href", "/sok")
	const helsenorge = m.getByRole("link", { name: "Helsenorge (ekstern side, åpnes i ny fane)" })
	expect(helsenorge).toHaveAttribute("href", HELSENORGE_URL)
	expect(helsenorge).toHaveAttribute("target", "_blank")
	expect(helsenorge).toHaveAttribute("rel", "noopener noreferrer")
	const språk = m.getByRole("group", { name: "Språk" })
	expect(within(språk).getByRole("link", { name: "Norsk" })).toHaveAttribute("aria-current", "page")
	expect(within(språk).getByRole("link", { name: "English" })).toHaveAttribute("lang", "en")
	const tema = m.getByRole("group", { name: "Tema" })
	expect(
		within(tema)
			.getAllByRole("button")
			.map((b) => b.textContent)
	).toEqual(["Lyst", "Mørkt", "System"])
})

test("the English Meny is named Menu, with Language and Theme groups", () => {
	stubDataFiles()
	window.history.replaceState(null, "", "/en/")
	render(<App />)
	expect(trigger()).toHaveAccessibleName("Menu")
	expect(menu().getByRole("group", { name: "Language" })).toBeInTheDocument()
	expect(menu().getByRole("group", { name: "Theme" })).toBeInTheDocument()
})

// Phones get the same navigation landmark as desktop, under the same name.
test("the Meny sits in a navigation landmark named Hovedmeny, and Main menu in English", () => {
	stubDataFiles()
	const { unmount } = render(<App />)
	expect(menuDetails().closest("nav")).toHaveAccessibleName("Hovedmeny")
	unmount()
	window.history.replaceState(null, "", "/en/")
	render(<App />)
	expect(menuDetails().closest("nav")).toHaveAccessibleName("Main menu")
})

// The other half of the axe test's stand-in for CSS: hide the desktop nav and pickers as CSS
// does below 1024 px, then check the phone layout with the Meny open.
test("the phone layout with the Meny open has no axe violations", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	const { container } = render(<App />)
	for (const el of container.querySelectorAll(".header-nav, .header-tools")) {
		el.setAttribute("hidden", "")
	}
	await openMenu(user)
	expect(
		await axe(container, { rules: { "color-contrast": { enabled: false } } })
	).toHaveNoViolations()
})

test("opening the Meny focuses its first row, even with a current language row", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	render(<App />)
	await openMenu(user)
	await waitFor(() => expect(menu().getByRole("link", { name: "Alle tjenester" })).toHaveFocus())
})

test("the arrows move through all three groups, skip the group labels and wrap", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	render(<App />)
	await openMenu(user)
	await waitFor(() => expect(menu().getByRole("link", { name: "Alle tjenester" })).toHaveFocus())
	await user.keyboard("{ArrowUp}")
	expect(menu().getByRole("button", { name: "System" })).toHaveFocus()
	await user.keyboard("{ArrowDown}")
	expect(menu().getByRole("link", { name: "Alle tjenester" })).toHaveFocus()
	await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}")
	expect(menu().getByRole("link", { name: "Norsk" })).toHaveFocus()
})

// One theme state, so the footer pill already shows the choice. The status line is the
// confirmation (spec: Below 1024 px: Meny, Behaviour).
test("a theme row applies the theme, keeps the Meny open on that row, says so, and the footer pill follows", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	render(<App />)
	await openMenu(user)
	const mørkt = menu().getByRole("button", { name: "Mørkt" })
	await user.click(mørkt)
	expect(document.documentElement.dataset.theme).toBe("dark")
	expect(menuDetails().open).toBe(true)
	expect(mørkt).toHaveFocus()
	expect(mørkt).toHaveAttribute("aria-pressed", "true")
	expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent("Tema: Mørkt")
	const footerPill = within(screen.getByRole("contentinfo")).getByRole("group", { name: "Tema" })
	expect(within(footerPill).getByRole("button", { name: "Mørkt" })).toHaveAttribute(
		"aria-pressed",
		"true"
	)
})

// The header outlives the route change, so the Meny closes itself.
test("Alle tjenester navigates and the Meny closes", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	render(<App />)
	await openMenu(user)
	await user.click(menu().getByRole("link", { name: "Alle tjenester" }))
	expect(window.location.pathname).toBe("/sok")
	expect(menuDetails().open).toBe(false)
})

// Same route, so no arrival moves focus. It must not fall to the body.
test("Alle tjenester on /sok closes the Meny and leaves focus on its trigger", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	window.history.pushState(null, "", "/sok?search=nav")
	render(<App />)
	await openMenu(user)
	await user.click(menu().getByRole("link", { name: "Alle tjenester" }))
	expect(window.location.pathname + window.location.search).toBe("/sok")
	expect(menuDetails().open).toBe(false)
	expect(trigger()).toHaveFocus()
})

// The page opens in a new tab: Varde's own tab stays where it was, with focus on the trigger.
test("Helsenorge leaves Varde's tab where it was, closes the Meny and refocuses its trigger", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	render(<App />)
	// Opened first: the listener below cancels every click, the summary's toggle included.
	await openMenu(user)
	// jsdom does not implement navigation. This listener runs after React's handler, on the
	// way up, and only stops jsdom from trying.
	const cancel = (event: MouseEvent) => event.preventDefault()
	window.addEventListener("click", cancel)
	try {
		await user.click(menu().getByRole("link", { name: /^Helsenorge/ }))
	} finally {
		window.removeEventListener("click", cancel)
	}
	expect(window.location.pathname).toBe("/")
	expect(menuDetails().open).toBe(false)
	expect(trigger()).toHaveFocus()
})

// A language switch keeps the page and its search, and resets paging.
test("a language row in the Meny goes to the same page in that language and drops page", async () => {
	const user = userEvent.setup()
	stubDataFiles()
	window.history.pushState(null, "", "/sok?search=nav&page=2")
	render(<App />)
	await openMenu(user)
	await user.click(menu().getByRole("link", { name: "English" }))
	expect(window.location.pathname + window.location.search).toBe("/en/sok?search=nav")
	expect(localStorage.getItem("varde.lang")).toBe("en")
	expect(menuDetails().open).toBe(false)
})

// Last on purpose: prerender() in jsdom leaves UrlContext holding the prerendered URL, which
// would leak into any App render after it in this file.
test("the prerendered Meny is a native details with real language links, so it works before JavaScript", async () => {
	const { html } = await prerender("/sok", {})
	const start = html.indexOf('<details class="picker header-menu"')
	expect(start).toBeGreaterThan(-1)
	const meny = html.slice(start, html.indexOf("</details>", start))
	// Matched with their lang attribute: "Alle tjenester" also links to /sok, so href alone
	// would pass without the Norsk row.
	expect(meny).toMatch(/<a[^>]+href="\/en\/sok"[^>]*\slang="en"/)
	expect(meny).toMatch(/<a[^>]+href="\/sok"[^>]*\slang="nb"/)
})
