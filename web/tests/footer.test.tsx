import { act, fireEvent, render, screen, within } from "@testing-library/react"
import { afterEach, expect, test } from "vitest"
import { App } from "../src/App.tsx"
import { stubDataFiles } from "./stubData.ts"

afterEach(() => {
	window.history.replaceState(null, "", "/")
})

const footer = () => screen.getByRole("contentinfo")

test.each(["/", "/sok", "/om", "/nope"])(
	"%s carries the liability line, the footer nav, the note and the GitHub icon",
	(path) => {
		stubDataFiles()
		window.history.replaceState(null, "", path)
		render(<App />)
		const f = footer()
		expect(f).toHaveTextContent(
			"Varde er en oversikt, ikke en nødtjeneste. Ved fare for liv og helse, ring 113."
		)
		expect(within(f).getByRole("link", { name: "113" })).toHaveAttribute("href", "tel:113")
		const nav = within(f).getByRole("navigation", { name: "Om nettstedet" })
		expect(within(nav).getByRole("link", { name: "Om Varde og ansvar" })).toHaveAttribute(
			"href",
			"/om"
		)
		expect(within(nav).getByRole("link", { name: "Meld feil" })).toHaveAttribute(
			"href",
			"/om#meld-feil"
		)
		const github = within(f).getByRole("link", { name: "Kildekode på GitHub" })
		expect(github).toHaveAttribute("href", "https://github.com/malinfossum/varde")
		expect(github).toHaveAttribute("rel", "noopener noreferrer")
		expect(github.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
		// The name comes from the hidden span; the tooltip repeats it and is hidden from readers.
		expect(github.querySelector(".footer-tip")).toHaveAttribute("aria-hidden", "true")
		const note = f.querySelector(".footer-note") as HTMLElement
		expect(note).toHaveTextContent("© Varde · Ingen sporing. Ingen informasjonskapsler.")
		expect(within(note).getByText("·")).toHaveAttribute("aria-hidden", "true")
	}
)

test("the English footer is in English", () => {
	stubDataFiles()
	window.history.replaceState(null, "", "/en/")
	render(<App />)
	const f = footer()
	expect(f).toHaveTextContent(
		"Varde is a directory, not an emergency service. If life or health is in danger, call 113."
	)
	const nav = within(f).getByRole("navigation", { name: "About this site" })
	expect(within(nav).getByRole("link", { name: "Report an error" })).toHaveAttribute(
		"href",
		"/en/om#meld-feil"
	)
	expect(within(nav).getByRole("link", { name: "About Varde and liability" })).toHaveAttribute(
		"href",
		"/en/om"
	)
	expect(within(f).getByRole("link", { name: "Source code on GitHub" })).toBeInTheDocument()
	expect(f.querySelector(".footer-note")).toHaveTextContent("© Varde · No tracking. No cookies.")
})

test("Escape hides the footer tooltips until focus returns to a footer control", () => {
	stubDataFiles()
	render(<App />)
	const row = footer().querySelector(".footer-row") as HTMLElement
	act(() => {
		fireEvent.keyDown(document, { key: "Escape" })
	})
	expect(row).toHaveAttribute("data-tips", "hidden")
	act(() => {
		within(footer()).getByRole("link", { name: "Kildekode på GitHub" }).focus()
	})
	expect(row).not.toHaveAttribute("data-tips")
})
