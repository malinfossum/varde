import { render, screen, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { type PageData, PageDataContext } from "../src/pageData.ts"
import { clearIndexCache, loadIndex } from "../src/services/data.ts"
import { pickHelplines } from "../src/services/helplines.ts"
import { bakedHelplines, helplineRows, stubDataFiles, visibleText } from "./stubData.ts"

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

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

test("two labelled groups hold the four rows in order, each name linking to its page, without a request", () => {
	const fetchSpy = vi.spyOn(globalThis, "fetch")
	renderLanding()
	const section = screen.getByRole("region", { name: "Noen å snakke med" })
	expect(within(section).getByText("Du kan være anonym.")).toBeInTheDocument()
	expect(
		within(section)
			.getAllByRole("heading", { level: 3 })
			.map((h) => h.textContent)
	).toEqual(["For voksne og generelle livskriser", "For barn og unge"])
	const names = (label: string) =>
		within(within(section).getByRole("list", { name: label }))
			.getAllByRole("listitem")
			.map((li) => within(li).getAllByRole("link")[0]?.textContent)
	expect(names("For voksne og generelle livskriser")).toEqual(["Mental Helse", "Kirkens SOS"])
	expect(names("For barn og unge")).toEqual(["Alarmtelefonen for barn og unge", "Kors på halsen"])
	expect(within(section).getByRole("link", { name: "Kirkens SOS" })).toHaveAttribute(
		"href",
		"/resources/2"
	)
	expect(within(section).queryByText(/tast 3|Arbeidslivstelefonen|Sidetmedord/)).toBeNull()
	expect(fetchSpy).not.toHaveBeenCalled()
})

test("the phone button shows the number and the chat button says Chat, each naming the service", () => {
	renderLanding()
	const section = screen.getByRole("region", { name: "Noen å snakke med" })
	const call = within(section).getByRole("link", { name: "Ring 116 123, Mental Helse" })
	expect(call).toHaveAttribute("href", "tel:116123")
	expect(visibleText(call)).toBe("116 123")
	const chat = within(section).getByRole("link", { name: "Chat, Mental Helse" })
	expect(chat).toHaveAttribute("href", "https://mentalhelse.no/hjelpechat/")
	expect(visibleText(chat)).toBe("Chat")
})

test("every button's name contains its visible label and ends with its service (WCAG 2.5.3)", () => {
	renderLanding()
	const section = screen.getByRole("region", { name: "Noen å snakke med" })
	const rows = within(section).getAllByRole("listitem")
	expect(rows).toHaveLength(4)
	for (const li of rows) {
		const [name, ...buttons] = within(li).getAllByRole("link")
		const service = name?.textContent ?? ""
		expect(buttons).toHaveLength(2)
		for (const button of buttons) {
			expect(button).toHaveAccessibleName(
				new RegExp(`${escapeRegExp(visibleText(button))}.*, ${escapeRegExp(service)}$`)
			)
		}
	}
})

test("the English landing labels the groups in English and keeps the service names", async () => {
	stubDataFiles({ resources: helplineRows })
	window.history.replaceState(null, "", "/en/")
	renderLanding(bakedHelplines("en"))
	const section = await screen.findByRole("region", { name: "Someone to talk to" })
	expect(
		within(section)
			.getAllByRole("heading", { level: 3 })
			.map((h) => h.textContent)
	).toEqual(["For adults and general life crises", "For children and young people"])
	expect(
		within(section).getByRole("link", { name: "Call 116 123, Mental Helse" })
	).toBeInTheDocument()
})

test("a row whose only chat is not https shows its phone button and no chat link", () => {
	const groups = pickHelplines(
		helplineRows.map((r) => (r.id === 122 ? { ...r, chatUrl: "javascript:alert(1)" } : r))
	)
	renderLanding({ helplines: { lang: "nb", entries: groups } })
	const section = screen.getByRole("region", { name: "Noen å snakke med" })
	const mentalHelse = within(section).getAllByRole("listitem")[0] as HTMLElement
	expect(
		within(mentalHelse)
			.getAllByRole("link")
			.map((a) => a.getAttribute("href"))
	).toEqual(["/resources/1", "tel:116123"])
})

test("coming back to the landing page without baked data loads the helplines", async () => {
	stubDataFiles({ resources: helplineRows })
	render(<App />)
	const section = await screen.findByRole("region", { name: "Noen å snakke med" })
	expect(within(section).getAllByRole("listitem")).toHaveLength(4)
})

test("with the index already loaded, the section shows on the first render", async () => {
	stubDataFiles({ resources: helplineRows })
	await loadIndex("nb")
	render(<App />)
	const section = screen.getByRole("region", { name: "Noen å snakke med" })
	expect(within(section).getAllByRole("listitem")).toHaveLength(4)
})

test("baked Norwegian helplines are not reused on the English landing page", async () => {
	stubDataFiles({ resources: helplineRows })
	window.history.replaceState(null, "", "/en/")
	renderLanding()
	const section = await screen.findByRole("region", { name: "Someone to talk to" })
	expect(within(section).getAllByRole("listitem")).toHaveLength(4)
	const requested = vi.mocked(fetch).mock.calls.map(([input]) => String(input))
	expect(requested.some((url) => url.includes("resources.en.json"))).toBe(true)
})

test("a landing page whose export holds no helplines still renders, without the section", async () => {
	stubDataFiles({ resources: [] })
	await loadIndex("nb")
	render(<App />)
	expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument()
	expect(screen.queryByRole("region", { name: "Noen å snakke med" })).toBeNull()
})
