import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { EmptyState } from "../src/components/EmptyState.tsx"
import { LoadingState } from "../src/components/LoadingState.tsx"
import { Pagination } from "../src/components/Pagination.tsx"
import { ResourceCard } from "../src/components/ResourceCard.tsx"
import { useResources } from "../src/hooks/useResources.ts"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import type { Filters } from "../src/services/urlState.ts"
import type { ResourceDto } from "../src/types/api.ts"
import { stubDataFiles } from "./stubData.ts"

const resource: ResourceDto = {
	id: 12,
	name: "Krisesenteret i Hamar",
	description: "Hjelp ved vold i nære relasjoner.",
	isFallbackTranslation: false,
	openingHours: "Døgnåpent",
	isNational: false,
	isAlwaysOpen: true,
	municipalityId: 1,
	municipalityName: "Hamar",
	address: null,
	phone: "62 00 00 00",
	email: null,
	website: "https://example.test",
	chatUrl: null,
	lastVerified: "2026-08-13",
	categories: [{ id: 9, slug: "nodtjenester", name: "Nødtjenester", isFallbackTranslation: false }],
	servedMunicipalityIds: [],
}

function withLang(ui: React.ReactNode) {
	return render(<LanguageProvider lang="nb">{ui}</LanguageProvider>)
}

afterEach(() => {
	vi.restoreAllMocks()
	window.history.replaceState(null, "", "/")
})

test("card renders badges from data, hours text and tel link", () => {
	withLang(<ResourceCard resource={resource} />)
	expect(screen.getByText("Akutt")).toBeInTheDocument()
	expect(screen.getByText("Døgnåpent", { selector: ".badge" })).toBeInTheDocument()
	expect(screen.queryByText("Nasjonal")).not.toBeInTheDocument()
	expect(screen.getByText(/Åpningstider/)).toBeInTheDocument()
	const tel = screen.getByRole("link", { name: /62 00 00 00/ })
	expect(tel).toHaveAttribute("href", "tel:62000000")
})

test("card order: name, badges in order, description, hours, Ring as a tel anchor, details, verified", () => {
	withLang(<ResourceCard resource={{ ...resource, isNational: true }} />)
	// Scoped to .badge: the fixture's openingHours text is itself "Døgnåpent", which would
	// otherwise collide with the alwaysOpen badge under an unscoped text match.
	const badges = screen
		.getAllByText(/^(Akutt|Nasjonal|Døgnåpent)$/, { selector: ".badge" })
		.map((el) => el.textContent)
	expect(badges).toEqual(["Akutt", "Nasjonal", "Døgnåpent"])
	const call = screen.getByRole("link", { name: /Ring 62 00 00 00/ })
	expect(call).toHaveAttribute("href", "tel:62000000")
	expect(screen.getByRole("link", { name: "Detaljer" })).toHaveAttribute("href", "/resources/12")
	expect(screen.getByText("Hjelp ved vold i nære relasjoner.")).toBeInTheDocument()
})

test("a card without a phone shows only Detaljer and the no-phone line", () => {
	withLang(<ResourceCard resource={{ ...resource, phone: null }} />)
	expect(screen.queryByRole("link", { name: /Ring/ })).not.toBeInTheDocument()
	expect(screen.getByText("Ingen telefon – se nettsiden")).toBeInTheDocument()
})

test("municipality name links to the kommune page when a slug is given", () => {
	withLang(<ResourceCard resource={resource} kommuneSlug="hamar" />)
	expect(screen.getByRole("link", { name: "Hamar" })).toHaveAttribute("href", "/kommune/hamar")
})

test("municipality name renders as plain text without a slug", () => {
	withLang(<ResourceCard resource={resource} />)
	expect(screen.getByText("Hamar")).toBeInTheDocument()
	expect(screen.queryByRole("link", { name: "Hamar" })).not.toBeInTheDocument()
})

test("loading renders skeletons under a busy status region", () => {
	withLang(<LoadingState />)
	expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true")
	// Visible, not visually-hidden: the loading heading reserves the same vertical space the
	// ready-state heading takes once results arrive (see LoadingState.tsx for why).
	expect(screen.getByRole("heading", { level: 1, name: "Laster …" })).not.toHaveClass(
		"visually-hidden"
	)
})

test("pagination disables at the edges and reports page changes", async () => {
	const { rerender } = withLang(
		<Pagination page={1} pageSize={20} totalCount={45} onPage={() => {}} />
	)
	expect(screen.getByRole("button", { name: "Forrige" })).toBeDisabled()
	expect(screen.getByText("Side 1 av 3")).toBeInTheDocument()
	rerender(
		<LanguageProvider lang="nb">
			<Pagination page={3} pageSize={20} totalCount={45} onPage={() => {}} />
		</LanguageProvider>
	)
	expect(screen.getByRole("button", { name: "Neste" })).toBeDisabled()
})

test("empty state offers national fallbacks as tel links", () => {
	withLang(<EmptyState onClearFilters={() => {}} suggestions={[]} onPick={() => {}} />)
	expect(screen.getByRole("link", { name: /116 123/ })).toHaveAttribute("href", "tel:116123")
	expect(screen.getByRole("link", { name: /116 117/ })).toHaveAttribute("href", "tel:116117")
	expect(screen.getByRole("button", { name: "Fjern alle filtre" })).toBeInTheDocument()
})

const municipalities = [
	{ id: 1, name: "Hamar", county: "Innlandet" },
	{ id: 8, name: "Oslo", county: "Oslo" },
]

function stubCatalogAndResources() {
	stubDataFiles({ municipalities, categories: [] })
}

test("a page beyond the last page shows EmptyState instead of a blank list", async () => {
	// Real results exist (totalCount > 0), but page 99 is past the last one — applyQuery slices
	// an empty page rather than a stale API response, distinct from the genuine zero-results case.
	const manyResources = Array.from({ length: 45 }, (_, i) => ({
		...resource,
		id: i + 1,
		name: `Treff ${i + 1}`,
	}))
	stubDataFiles({ resources: manyResources, municipalities, categories: [] })
	// "/" is the landing now — the list lives at /sok.
	window.history.pushState(null, "", "/sok?page=99")
	render(<App />)
	expect(await screen.findByRole("heading", { name: "Ingen treff" })).toBeInTheDocument()
})

test("an unknown ?municipality= value doesn't crash the app and the list renders unfiltered", async () => {
	stubDataFiles({ resources: [resource], municipalities, categories: [] })
	// "/" is the landing now — the list lives at /sok.
	window.history.pushState(null, "", "/sok?municipality=abc")
	render(<App />)

	// A non-numeric municipality id never survives URL parsing (parseFilters' positiveInt
	// rejects it), so filters.municipality stays null and the list renders unfiltered rather
	// than scoped to a municipality that doesn't exist.
	expect(await screen.findByText("Krisesenteret i Hamar")).toBeInTheDocument()
	// No phantom selection in the combobox either — its input stays empty rather than showing
	// some municipality's name.
	expect(screen.getByRole("combobox", { name: "Kommune" })).toHaveValue("")
})

test("Tøm clears both municipality and national selection from the URL", async () => {
	stubCatalogAndResources()
	// "/" is the landing now — the list lives at /sok.
	window.history.pushState(null, "", "/sok?municipality=1")
	const user = userEvent.setup()
	render(<App />)
	await waitFor(() =>
		expect(screen.getByRole("combobox", { name: "Kommune" })).toHaveValue("Hamar")
	)

	await user.click(screen.getByRole("button", { name: "Tøm" }))

	expect(window.location.search).not.toContain("municipality")
	expect(window.location.search).not.toContain("national")
})

test("list page heading levels never skip: h1 results heading, h2 cards", async () => {
	stubDataFiles({ resources: [resource], municipalities, categories: [] })
	// "/" is the landing now — the list lives at /sok.
	window.history.pushState(null, "", "/sok")
	render(<App />)
	await screen.findByRole("heading", { level: 2, name: "Krisesenteret i Hamar" })
	expect(screen.getByRole("heading", { level: 1, name: "1 treff" })).toBeInTheDocument()

	// The results heading is /sok's own <h1> (it doubles as the arrival-focus target), and
	// each card name sits one level under it. This guards against any level being skipped
	// among whatever headings the page renders.
	const levels = screen.getAllByRole("heading").map((h) => Number(h.tagName.slice(1)))
	for (let i = 1; i < levels.length; i++) {
		expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1)
	}
})

// R17/migration note: the three "catalog error alongside X" tests that lived here (a catalog
// failure independent of the resources outcome) tested a divergence that the JSON index layer
// makes structurally impossible — useCatalog and useResources both call the same loadIndex(lang)
// promise (services/data.ts's per-language cache), so they always settle together, never one
// erroring while the other loads or succeeds. The "exactly one h1" invariant they guarded stays
// covered: axe.test.tsx asserts it across all six page/mode combinations in both themes, and
// errorRecovery.test.tsx's "catalog and resources both failing" test covers the one shared-failure
// case that can still happen.

test("paging moves focus to the results heading; typing in search does not", async () => {
	// pageSize is fixed at 20 by query.ts now (the API's pageSize:1 stub had no equivalent) —
	// 21 rows makes a genuine second page. Zero-padded names keep collator (name) order the same
	// as numeric order, so page 2 predictably holds the highest-numbered row. None contain "k",
	// so the search below narrows to zero matches, which still proves typing doesn't steal focus.
	const many = Array.from({ length: 21 }, (_, i) => ({
		...resource,
		id: i + 1,
		name: `Treff ${String(i + 1).padStart(2, "0")}`,
	}))
	stubDataFiles({ resources: many, municipalities, categories: [] })
	const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView")
	const user = userEvent.setup()
	// "/" is the landing now — the list lives at /sok.
	window.history.pushState(null, "", "/sok")
	render(<App />)
	const heading = await screen.findByRole("heading", { level: 1, name: "21 treff" })
	// Initial load leaves focus and scroll alone — nothing was interacted with yet.
	expect(heading).not.toHaveFocus()
	expect(scrollIntoView).not.toHaveBeenCalled()

	// The pager sits below a long list; after paging, the user would otherwise be left staring
	// at the (now stale-looking) pager with focus stranded on the button they pressed.
	await user.click(screen.getByRole("button", { name: "Neste" }))
	await screen.findByText("Treff 21")
	await waitFor(() =>
		expect(screen.getByRole("heading", { level: 1, name: "21 treff" })).toHaveFocus()
	)
	expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" })

	// Filtering must never steal focus from the search box mid-typing.
	const search = screen.getByLabelText("Søk etter tjeneste, kommune eller tema")
	await user.type(search, "k")
	await screen.findByRole("heading", { name: "Ingen treff" })
	expect(search).toHaveFocus()
})

const baseFilters: Filters = {
	search: "",
	categories: [],
	municipality: null,
	national: false,
	page: 1,
}

test("once the index is cached, filtering (e.g. two keystrokes in the search box) never re-enters loading", async () => {
	const many = Array.from({ length: 5 }, (_, i) => ({ ...resource, id: i + 1, name: `Treff ${i}` }))
	stubDataFiles({ resources: many, municipalities, categories: [] })
	const { result, rerender } = renderHook(
		({ filters }: { filters: Filters }) => useResources(filters, "nb"),
		{
			initialProps: { filters: baseFilters },
		}
	)
	await waitFor(() => expect(result.current.state.kind).toBe("ready"))

	// Two keystrokes worth of filter changes, applied to an index that's already settled — the
	// hook must answer both synchronously from cache rather than dropping into "loading" for a
	// fetch that never happens.
	rerender({ filters: { ...baseFilters, search: "t" } })
	expect(result.current.state.kind).toBe("ready")
	rerender({ filters: { ...baseFilters, search: "tr" } })
	expect(result.current.state.kind).toBe("ready")
})

test("typing debounces the announced result count instead of announcing every keystroke", async () => {
	const many = Array.from({ length: 3 }, (_, i) => ({
		...resource,
		id: i + 1,
		name: `Krisesenter ${i}`,
	}))
	stubDataFiles({ resources: many, municipalities, categories: [] })
	window.history.pushState(null, "", "/sok")
	render(<App />)
	await screen.findByRole("heading", { level: 1, name: "3 treff" })
	const region = document.querySelector("[aria-live]") as HTMLElement
	const search = screen.getByLabelText("Søk etter tjeneste, kommune eller tema")

	vi.useFakeTimers()
	try {
		// "k" still matches all three (case-insensitive substring of "Krisesenter"); "kz" matches
		// none. The second keystroke lands well inside the first one's 300ms debounce window, so
		// the intermediate "3 treff" must never reach the live region.
		fireEvent.change(search, { target: { value: "k" } })
		act(() => vi.advanceTimersByTime(200))
		fireEvent.change(search, { target: { value: "kz" } })
		act(() => vi.advanceTimersByTime(200))
		expect(region.textContent).not.toContain("3 treff")
		expect(region.textContent).not.toContain("0 treff")
		act(() => vi.advanceTimersByTime(150))
		expect(region.textContent).toContain("0 treff")
	} finally {
		vi.useRealTimers()
	}
})
