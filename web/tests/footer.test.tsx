import { render, screen, within } from "@testing-library/react"
import { afterEach, expect, test } from "vitest"
import { App } from "../src/App.tsx"
import { stubDataFiles } from "./stubData.ts"

afterEach(() => {
	window.history.replaceState(null, "", "/")
})

test.each(["/", "/sok", "/om", "/nope"])(
	"%s carries the liability line and the footer links",
	(path) => {
		stubDataFiles()
		window.history.replaceState(null, "", path)
		render(<App />)
		const footer = screen.getByRole("contentinfo")
		expect(footer).toHaveTextContent(
			"Varde er en oversikt, ikke en nødtjeneste. Ved fare for liv, ring 113."
		)
		expect(within(footer).getByRole("link", { name: "113" })).toHaveAttribute("href", "tel:113")
		expect(within(footer).getByRole("link", { name: "Om Varde og ansvar" })).toHaveAttribute(
			"href",
			"/om"
		)
		expect(within(footer).getByRole("link", { name: "Meld feil" })).toHaveAttribute(
			"href",
			"/om#meld-feil"
		)
		expect(within(footer).getByRole("link", { name: "Kildekode på GitHub" })).toBeInTheDocument()
		expect(footer).toHaveTextContent("Ingen sporing. Ingen informasjonskapsler.")
	}
)

test("the English footer links stay in English", () => {
	stubDataFiles()
	window.history.replaceState(null, "", "/en/")
	render(<App />)
	const footer = screen.getByRole("contentinfo")
	expect(footer).toHaveTextContent(
		"Varde is a directory, not an emergency service. If a life is in danger, call 113."
	)
	expect(within(footer).getByRole("link", { name: "Report an error" })).toHaveAttribute(
		"href",
		"/en/om#meld-feil"
	)
	expect(within(footer).getByRole("link", { name: "About Varde and liability" })).toHaveAttribute(
		"href",
		"/en/om"
	)
})
