import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { render as prerender } from "../src/entry-server.tsx"
import { desktopTools } from "./scope.ts"
import { stubDataFiles } from "./stubData.ts"

afterEach(() => {
	window.history.replaceState(null, "", "/")
	vi.restoreAllMocks()
})

const browserLanguages = (languages: string[]) =>
	vi.spyOn(window.navigator, "languages", "get").mockReturnValue(languages)

// System (#80): a third row that follows the browser. It links to this page in the browser's
// language; the mark moves to it only while System is the stored choice.
test("with nothing stored, System is a row without the mark, linking to the browser's language", async () => {
	stubDataFiles()
	browserLanguages(["en-GB"])
	render(<App />)
	const system = await desktopTools().findByRole("link", { name: "System" })
	expect(system).toHaveAttribute("href", "/en/")
	expect(system).not.toHaveAttribute("aria-current")
	expect(system.querySelector(".picker-check")).toBeNull()
	expect(desktopTools().getByRole("link", { name: "Norsk" })).toHaveAttribute(
		"aria-current",
		"page"
	)
})

test("with System stored, System carries the mark and the language rows do not", async () => {
	stubDataFiles()
	browserLanguages(["nb-NO"])
	localStorage.setItem("varde.lang", "system")
	window.history.pushState(null, "", "/sok")
	render(<App />)
	const system = desktopTools().getByRole("link", { name: "System" })
	expect(await desktopTools().findByRole("link", { current: true })).toBe(system)
	expect(system).toHaveAttribute("href", "/sok")
	expect(system.querySelector(".picker-check")).not.toBeNull()
	for (const name of ["Norsk", "English"]) {
		const row = desktopTools().getByRole("link", { name })
		expect(row).not.toHaveAttribute("aria-current")
		expect(row.querySelector(".picker-check")).toBeNull()
	}
})

test("choosing System on a Norwegian page in an English browser stores it and switches to English", async () => {
	stubDataFiles()
	browserLanguages(["pl", "en-US"])
	window.history.pushState(null, "", "/sok?search=nav&page=2")
	render(<App />)
	await userEvent.click(await desktopTools().findByRole("link", { name: "System" }))
	expect(window.location.pathname + window.location.search).toBe("/en/sok?search=nav")
	expect(localStorage.getItem("varde.lang")).toBe("system")
	expect(document.activeElement?.tagName).toBe("SUMMARY")
	expect(screen.getByText("The language now follows your browser")).toBeInTheDocument()
})

test("choosing System when the browser already matches stays on the page and moves the mark", async () => {
	stubDataFiles()
	browserLanguages(["nb-NO"])
	window.history.pushState(null, "", "/sok?search=nav&page=2")
	render(<App />)
	const before = window.history.length
	const system = await desktopTools().findByRole("link", { name: "System" })
	await userEvent.click(system)
	expect(window.location.pathname + window.location.search).toBe("/sok?search=nav&page=2")
	expect(window.history.length).toBe(before)
	expect(localStorage.getItem("varde.lang")).toBe("system")
	expect(system).toHaveAttribute("aria-current", "true")
	expect(desktopTools().getByRole("link", { name: "Norsk" })).not.toHaveAttribute("aria-current")
	// The status region joins messages that land within 1.5 s, so a results announcement on a slow
	// runner can come first ("… . Språket følger nå nettleseren"). Match the phrase, not the whole text.
	expect(await screen.findByText(/Språket følger nå nettleseren/)).toBeInTheDocument()
})

test("choosing Norsk after System replaces the stored choice", async () => {
	stubDataFiles()
	browserLanguages(["nb-NO"])
	localStorage.setItem("varde.lang", "system")
	render(<App />)
	await desktopTools().findByRole("link", { current: true })
	await userEvent.click(desktopTools().getByRole("link", { name: "Norsk" }))
	expect(localStorage.getItem("varde.lang")).toBe("nb")
	expect(desktopTools().getByRole("link", { name: "Norsk" })).toHaveAttribute(
		"aria-current",
		"page"
	)
	expect(desktopTools().getByRole("link", { name: "System" })).not.toHaveAttribute("aria-current")
})

test("the trigger says Språk: Norsk, and each row carries its own lang and the current mark", () => {
	stubDataFiles()
	render(<App />)
	expect(screen.getByText("Språk: Norsk", { selector: ".visually-hidden" })).toBeInTheDocument()
	const norsk = desktopTools().getByRole("link", { name: "Norsk" })
	const english = desktopTools().getByRole("link", { name: "English" })
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
	expect(desktopTools().getByRole("link", { name: "English" })).toHaveAttribute(
		"aria-current",
		"page"
	)
	expect(desktopTools().getByRole("link", { name: "Norsk" })).not.toHaveAttribute("aria-current")
})

test("choosing the current language does not navigate, keeps the page and refocuses the trigger", async () => {
	stubDataFiles()
	window.history.pushState(null, "", "/sok?search=nav&page=2")
	render(<App />)
	const before = window.history.length
	await userEvent.click(desktopTools().getByRole("link", { name: "Norsk" }))
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
