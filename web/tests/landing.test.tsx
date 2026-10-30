import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import nbStrings from "../src/i18n/nb.json"
import { PageDataContext } from "../src/pageData.ts"
import { CATEGORY_SLUGS, FEATURED_SLUGS, GRID_SLUGS } from "../src/services/categories.ts"
import { categorySearch } from "../src/services/filters.ts"
import { bakedHelplines, stubDataFiles } from "./stubData.ts"

const nb = nbStrings as Record<string, string>

const municipalities = [
	{ id: 1, name: "Hamar", county: "Innlandet", number: "3403", countyNumber: "34" },
]
const categories = [
	{ id: 4, slug: "rus", name: "Rus og avhengighet", isFallbackTranslation: false },
]

function stubCatalog(fail = false) {
	if (fail) {
		const fetchMock = vi.fn(async () => new Response(null, { status: 500 }))
		vi.stubGlobal("fetch", fetchMock)
		return fetchMock
	}
	stubDataFiles({ municipalities, categories })
	// stubDataFiles installs its own vi.fn() — hand it back so callers here can still count
	// calls the way the API-era stub let them (fetchSpy.toHaveBeenCalledTimes(2), etc.).
	return fetch as ReturnType<typeof vi.fn>
}

afterEach(() => {
	vi.restoreAllMocks()
	window.history.replaceState(null, "", "/")
})

test("the landing renders without a single request", () => {
	const fetchSpy = stubCatalog()
	render(
		<PageDataContext.Provider value={bakedHelplines("nb")}>
			<App />
		</PageDataContext.Provider>
	)
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Finn riktig hjelp/)
	expect(fetchSpy).not.toHaveBeenCalled()
	expect(document.title).toBe("Varde – finn riktig hjelpetjeneste")
})

test("focusing the search box prefetches the catalog; Enter submits the text to /sok", async () => {
	const fetchSpy = stubCatalog()
	const user = userEvent.setup()
	render(
		<PageDataContext.Provider value={bakedHelplines("nb")}>
			<App />
		</PageDataContext.Provider>
	)
	const box = screen.getByRole("searchbox", { name: /Søk/ })
	expect(fetchSpy).not.toHaveBeenCalled()
	await user.click(box)
	// loadIndex fetches all six data files together (resources, municipalities, categories,
	// kommuner, counties, aliases) — the prefetch is all-or-nothing, unlike the old two-endpoint catalog call.
	await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(6))
	await user.type(box, "rus{Enter}")
	expect(window.location.pathname).toBe("/sok")
	expect(window.location.search).toContain("search=rus")
})

test("a suggestion goes straight to scoped results", async () => {
	stubCatalog()
	const user = userEvent.setup()
	render(<App />)
	await user.type(screen.getByRole("searchbox", { name: /Søk/ }), "ham")
	await user.click(await screen.findByRole("button", { name: /Hamar/ }))
	expect(window.location.pathname).toBe("/sok")
	expect(window.location.search).toContain("municipality=3403")
})

test("a failed catalog still lets Enter navigate", async () => {
	stubCatalog(true)
	const user = userEvent.setup()
	render(<App />)
	await user.type(screen.getByRole("searchbox", { name: /Søk/ }), "vold{Enter}")
	expect(window.location.pathname).toBe("/sok")
})

test("ten category chips link to scoped results, each with its real label, and the strip numbers repeat below the fold", () => {
	stubCatalog()
	render(<App />)
	// Real labels, read from the i18n file rather than retyped here: a renamed or dropped
	// category label fails this test instead of passing under a vacuous ".+" match.
	for (const slug of CATEGORY_SLUGS) {
		const label = nb[`category.${slug}`]
		expect(screen.getByRole("link", { name: label })).toBeInTheDocument()
	}
	// Scoped to <main>: the acute strip above the header also links to /sok?category=nodtjenester,
	// and its href would otherwise double-count against the landing's own ten chips.
	const main = screen.getByRole("main")
	const chips = within(main)
		.getAllByRole("link")
		.filter((a) => a.getAttribute("href")?.startsWith("/sok?"))
	expect(chips).toHaveLength(10)
	expect(screen.getAllByRole("link", { name: /116 117/ }).length).toBeGreaterThanOrEqual(2) // strip + emergency section
})

test("Nødtjenester and Lavterskeltilbud lead as a list of two; the other eight sit in one grid in category order", () => {
	stubCatalog()
	render(<App />)
	const main = screen.getByRole("main")
	// Found by href, not by name: the nb label carries a soft hyphen.
	const byHref = (slug: string) =>
		within(main)
			.getAllByRole("link")
			.find((a) => a.getAttribute("href") === `/sok${categorySearch(slug)}`) as HTMLElement
	const acute = byHref("nodtjenester")
	const featured = byHref("lavterskeltilbud")
	expect(acute).toHaveClass("chip", "chip-acute")
	expect(featured).toHaveClass("chip", "chip-featured")
	expect(featured).not.toHaveClass("chip-acute")
	expect(featured).toHaveTextContent(nb["category.lavterskeltilbud"] as string)
	const row = acute.closest("ul") as HTMLElement
	expect(row).toHaveClass("chip-featured-row")
	expect(featured.closest("ul")).toBe(row)
	expect(within(row).getAllByRole("listitem")).toHaveLength(2)
	expect(
		within(row)
			.getAllByRole("link")
			.map((a) => a.getAttribute("href"))
	).toEqual(FEATURED_SLUGS.map((s) => `/sok${categorySearch(s)}`))
	const grid = byHref("bolig").closest("ul") as HTMLElement
	expect(grid).not.toBe(row)
	expect(
		within(grid)
			.getAllByRole("link")
			.map((a) => a.textContent)
	).toEqual(GRID_SLUGS.map((s) => nb[`category.${s}`]))
})

test("the headline keeps its last three words together, in both languages", () => {
	stubCatalog()
	const { unmount } = render(<App />)
	expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
		"Finn riktig hjelp, der\u00a0du\u00a0bor."
	)
	unmount()
	window.history.replaceState(null, "", "/en/")
	render(<App />)
	expect(screen.getByRole("heading", { level: 1 }).textContent).toBe(
		"Find the right help, where\u00a0you\u00a0live."
	)
})

test("the emergency intro is the plain new line, in both languages", () => {
	stubCatalog()
	const { unmount } = render(<App />)
	expect(screen.getByText("Ved akutt fare, ring:")).toBeInTheDocument()
	unmount()
	window.history.replaceState(null, "", "/en/")
	render(<App />)
	expect(screen.getByText("In an emergency, call:")).toBeInTheDocument()
})

test("the landing has no trust line, and the Shift hint lives on the quick exit", () => {
	stubCatalog()
	render(<App />)
	// The trust line went on 2026-10-16: the footer says "Ingen sporing" and About covers the
	// sources and the six-month check.
	expect(screen.queryByRole("region", { name: "Derfor kan du stole på Varde" })).toBeNull()
	expect(screen.getByRole("link", { name: "Forlat siden" })).toHaveAccessibleDescription(
		"Du kan også trykke Shift tre ganger."
	)
})
