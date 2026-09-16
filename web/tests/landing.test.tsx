import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import nbStrings from "../src/i18n/nb.json"
import { CATEGORY_SLUGS } from "../src/services/categories.ts"
import { stubDataFiles } from "./stubData.ts"

const nb = nbStrings as Record<string, string>

const municipalities = [{ id: 1, name: "Hamar", county: "Innlandet" }]
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
	render(<App />)
	expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Finn riktig hjelp/)
	expect(fetchSpy).not.toHaveBeenCalled()
	expect(document.title).toBe("Varde – finn riktig hjelpetjeneste")
})

test("focusing the search box prefetches the catalog; Enter submits the text to /sok", async () => {
	const fetchSpy = stubCatalog()
	const user = userEvent.setup()
	render(<App />)
	const box = screen.getByRole("searchbox", { name: /Søk/ })
	await user.click(box)
	// loadIndex fetches all four data files together (resources, municipalities, categories,
	// kommuner) — the prefetch is all-or-nothing, unlike the old two-endpoint catalog call.
	await waitFor(() => expect(fetchSpy).toHaveBeenCalledTimes(4))
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
	expect(window.location.search).toContain("municipality=1")
})

test("a failed catalog still lets Enter navigate", async () => {
	stubCatalog(true)
	const user = userEvent.setup()
	render(<App />)
	await user.type(screen.getByRole("searchbox", { name: /Søk/ }), "vold{Enter}")
	expect(window.location.pathname).toBe("/sok")
})

test("nine category chips link to scoped results, each with its real label, and the strip numbers repeat below the fold", () => {
	stubCatalog()
	render(<App />)
	// Real labels, read from the i18n file rather than retyped here: a renamed or dropped
	// category label fails this test instead of passing under a vacuous ".+" match.
	for (const slug of CATEGORY_SLUGS) {
		const label = nb[`category.${slug}`]
		expect(screen.getByRole("link", { name: label })).toBeInTheDocument()
	}
	// Scoped to <main>: the acute strip above the header also links to /sok?category=nodtjenester,
	// and its href would otherwise double-count against the landing's own nine chips.
	const main = screen.getByRole("main")
	const chips = within(main)
		.getAllByRole("link")
		.filter((a) => a.getAttribute("href")?.startsWith("/sok?category="))
	expect(chips).toHaveLength(9)
	expect(screen.getAllByRole("link", { name: /116 117/ }).length).toBeGreaterThanOrEqual(2) // strip + emergency section
})
