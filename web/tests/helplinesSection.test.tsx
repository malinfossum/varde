import { render, screen, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { type PageData, PageDataContext } from "../src/pageData.ts"
import { clearIndexCache, loadIndex } from "../src/services/data.ts"
import { pickHelplines } from "../src/services/helplines.ts"
import { bakedHelplines, helplineRows, stubDataFiles } from "./stubData.ts"

afterEach(() => {
	vi.restoreAllMocks()
	clearIndexCache()
	window.history.replaceState(null, "", "/")
})

function renderLanding(data: PageData = bakedHelplines("nb")) {
	return render(
		<PageDataContext.Provider value={data}>
			<App />
		</PageDataContext.Provider>
	)
}

test("baked helplines render in order, each name linking to its page, without a request", () => {
	const fetchSpy = vi.spyOn(globalThis, "fetch")
	renderLanding()
	const section = screen.getByRole("region", { name: "Noen å snakke med" })
	expect(within(section).getByText("Du kan være anonym.")).toBeInTheDocument()
	const names = within(section)
		.getAllByRole("listitem")
		.map((li) => within(li).getAllByRole("link").at(0)?.textContent)
	expect(names).toEqual([
		"Hjelpetelefonen (Mental Helse)",
		"Kirkens SOS",
		"Kors på halsen (Røde Kors)",
		"Arbeidslivstelefonen (Mental Helse)",
		"Sidetmedord (Mental Helse)",
	])
	expect(within(section).getByRole("link", { name: "Kirkens SOS" })).toHaveAttribute(
		"href",
		"/resources/2"
	)
	expect(fetchSpy).not.toHaveBeenCalled()
})

test("the call buttons say the number, and their names also say the service", () => {
	renderLanding()
	const section = screen.getByRole("region", { name: "Noen å snakke med" })
	const call = within(section).getByRole("link", {
		name: "Ring 116 123, Hjelpetelefonen (Mental Helse)",
	})
	expect(call).toHaveAttribute("href", "tel:116123")
	expect(
		within(section).getByRole("link", { name: "Ring 116 123, Arbeidslivstelefonen (Mental Helse)" })
	).toBeInTheDocument()
})

test("an entry without a phone gets a Chat link to its https chat", () => {
	renderLanding()
	const section = screen.getByRole("region", { name: "Noen å snakke med" })
	expect(
		within(section).getByRole("link", { name: "Chat, Sidetmedord (Mental Helse)" })
	).toHaveAttribute("href", "https://sidetmedord.mentalhelse.no/")
})

test("a chat URL that is not https shows the name alone, never a link", () => {
	const entries = pickHelplines(helplineRows).map((h) =>
		h.id === 122 ? { ...h, chatUrl: "javascript:alert(1)" } : h
	)
	renderLanding({ helplines: { lang: "nb", entries } })
	const section = screen.getByRole("region", { name: "Noen å snakke med" })
	expect(within(section).queryByRole("link", { name: /Chat/ })).toBeNull()
	expect(
		within(section).getByRole("link", { name: "Sidetmedord (Mental Helse)" })
	).toBeInTheDocument()
})

test("coming back to the landing page without baked data loads the helplines", async () => {
	stubDataFiles({ resources: helplineRows })
	render(<App />)
	const section = await screen.findByRole("region", { name: "Noen å snakke med" })
	expect(within(section).getAllByRole("listitem")).toHaveLength(5)
})

test("with the index already loaded, the section shows on the first render", async () => {
	stubDataFiles({ resources: helplineRows })
	await loadIndex("nb")
	render(<App />)
	const section = screen.getByRole("region", { name: "Noen å snakke med" })
	expect(within(section).getAllByRole("listitem")).toHaveLength(5)
})

test("baked Norwegian helplines are not reused on the English landing page", async () => {
	stubDataFiles({ resources: helplineRows })
	window.history.replaceState(null, "", "/en/")
	renderLanding()
	const section = await screen.findByRole("region", { name: "Someone to talk to" })
	expect(within(section).getAllByRole("listitem")).toHaveLength(5)
	const requested = vi.mocked(fetch).mock.calls.map(([input]) => String(input))
	expect(requested.some((url) => url.includes("resources.en.json"))).toBe(true)
})
