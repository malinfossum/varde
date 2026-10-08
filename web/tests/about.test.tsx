import { render, screen, within } from "@testing-library/react"
import { afterEach, expect, test } from "vitest"
import { App } from "../src/App.tsx"
import { ABOUT_UPDATED } from "../src/components/AboutPage.tsx"
import { REPORT_ADDRESS } from "../src/services/contactActions.ts"
import { stubDataFiles } from "./stubData.ts"

afterEach(() => {
	window.history.replaceState(null, "", "/")
})

const sections = {
	nb: [
		"Hva Varde er",
		"Hva Varde ikke er",
		"Hvor opplysningene kommer fra",
		"Ansvar",
		"Meld feil",
		"Personvern",
		"Kildekode",
	],
	en: [
		"What Varde is",
		"What Varde is not",
		"Where the information comes from",
		"Liability",
		"Report an error",
		"Privacy",
		"Source code",
	],
}

test.each([
	["/om", "nb"],
	["/en/om", "en"],
] as const)("%s has every section in order", async (path, lang) => {
	stubDataFiles()
	window.history.replaceState(null, "", path)
	render(<App />)
	const main = screen.getByRole("main")
	// The Suspense fallback (LoadingState) has an h1 of its own, so wait for the About h2s instead.
	const headings = (await within(main).findAllByRole("heading", { level: 2 })).map(
		(h) => h.textContent
	)
	expect(headings).toEqual(sections[lang])
})

test("the report section shows the address as text and a mailto link with a subject", async () => {
	stubDataFiles()
	window.history.replaceState(null, "", "/om")
	render(<App />)
	const heading = await screen.findByRole("heading", { level: 2, name: "Meld feil" })
	expect(heading).toHaveAttribute("id", "meld-feil")
	const section = heading.closest("section") as HTMLElement
	expect(within(section).getByText(REPORT_ADDRESS)).toBeInTheDocument()
	expect(within(section).getByRole("link", { name: "Skriv e-post" })).toHaveAttribute(
		"href",
		`mailto:${REPORT_ADDRESS}?subject=Varde%3A%20feil`
	)
})

test("the new alias replaces the old one, and the page says when the text last changed", async () => {
	// Built from fragments so the retired address never appears in the repo as one string.
	expect(REPORT_ADDRESS).not.toBe(["varde.implic", "ate775@passmail.com"].join(""))
	expect(REPORT_ADDRESS).toMatch(/^[^\s@]+@[^\s@]+\.[a-z]+$/)
	expect(ABOUT_UPDATED).toMatch(/^\d{4}-\d{2}-\d{2}$/)
	stubDataFiles()
	window.history.replaceState(null, "", "/om")
	render(<App />)
	expect(await screen.findByText(`Teksten ble sist endret ${ABOUT_UPDATED}.`)).toBeInTheDocument()
})
