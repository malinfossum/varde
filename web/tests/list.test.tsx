import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { EmptyState } from "../src/components/EmptyState.tsx"
import { LoadingState } from "../src/components/LoadingState.tsx"
import { Pagination } from "../src/components/Pagination.tsx"
import { ResourceCard } from "../src/components/ResourceCard.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import type { ResourceDto } from "../src/types/api.ts"

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
}

function withLang(ui: React.ReactNode) {
	return render(<LanguageProvider initialLang="nb">{ui}</LanguageProvider>)
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

test("loading renders skeletons under a busy status region", () => {
	withLang(<LoadingState />)
	expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true")
	expect(screen.getByText("Laster …")).toHaveClass("visually-hidden")
})

test("pagination disables at the edges and reports page changes", async () => {
	const { rerender } = withLang(
		<Pagination page={1} pageSize={20} totalCount={45} onPage={() => {}} />
	)
	expect(screen.getByRole("button", { name: "Forrige" })).toBeDisabled()
	expect(screen.getByText("Side 1 av 3")).toBeInTheDocument()
	rerender(
		<LanguageProvider initialLang="nb">
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
	vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL) => {
		const url = String(input)
		if (url.includes("/api/municipalities")) {
			return Promise.resolve(new Response(JSON.stringify(municipalities), { status: 200 }))
		}
		if (url.includes("/api/categories")) {
			return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
		}
		return Promise.resolve(
			new Response(JSON.stringify({ items: [], page: 1, pageSize: 20, totalCount: 0 }), {
				status: 200,
			})
		)
	})
}

test("a page beyond the last page shows EmptyState instead of a blank list", async () => {
	vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL) => {
		const url = String(input)
		if (url.includes("/api/municipalities")) {
			return Promise.resolve(new Response(JSON.stringify(municipalities), { status: 200 }))
		}
		if (url.includes("/api/categories")) {
			return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
		}
		// Real results exist elsewhere (totalCount > 0), but this page is past the last one —
		// the API returns an empty items array, distinct from the genuine zero-results case.
		return Promise.resolve(
			new Response(JSON.stringify({ items: [], page: 99, pageSize: 20, totalCount: 45 }), {
				status: 200,
			})
		)
	})
	window.history.pushState(null, "", "/?page=99")
	render(<App />)
	expect(await screen.findByRole("heading", { name: "Ingen treff" })).toBeInTheDocument()
})

test("an unknown ?municipality= value doesn't crash the app and the list renders unfiltered", async () => {
	let resourcesUrl = ""
	vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL) => {
		const url = String(input)
		if (url.includes("/api/municipalities")) {
			return Promise.resolve(new Response(JSON.stringify(municipalities), { status: 200 }))
		}
		if (url.includes("/api/categories")) {
			return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
		}
		resourcesUrl = url
		return Promise.resolve(
			new Response(JSON.stringify({ items: [resource], page: 1, pageSize: 20, totalCount: 1 }), {
				status: 200,
			})
		)
	})
	window.history.pushState(null, "", "/?municipality=abc")
	render(<App />)

	expect(await screen.findByText("Krisesenteret i Hamar")).toBeInTheDocument()
	// A non-numeric municipality id never survives URL parsing (parseFilters' positiveInt
	// rejects it), so it never reaches the resources request — the list is unfiltered rather
	// than scoped to a municipality that doesn't exist.
	expect(resourcesUrl).not.toContain("municipality")
	// No phantom selection in the combobox either — its input stays empty rather than showing
	// some municipality's name.
	expect(screen.getByRole("combobox", { name: "Kommune" })).toHaveValue("")
})

test("Tøm clears both municipality and national selection from the URL", async () => {
	stubCatalogAndResources()
	window.history.pushState(null, "", "/?municipality=1")
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
	vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL) => {
		const url = String(input)
		if (url.includes("/api/municipalities")) {
			return Promise.resolve(new Response(JSON.stringify(municipalities), { status: 200 }))
		}
		if (url.includes("/api/categories")) {
			return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
		}
		return Promise.resolve(
			new Response(JSON.stringify({ items: [resource], page: 1, pageSize: 20, totalCount: 1 }), {
				status: 200,
			})
		)
	})
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

test("paging moves focus to the results heading; typing in search does not", async () => {
	vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL) => {
		const url = String(input)
		if (url.includes("/api/municipalities")) {
			return Promise.resolve(new Response(JSON.stringify(municipalities), { status: 200 }))
		}
		if (url.includes("/api/categories")) {
			return Promise.resolve(new Response(JSON.stringify([]), { status: 200 }))
		}
		const page = Number(new URL(url).searchParams.get("page") ?? "1")
		return Promise.resolve(
			new Response(
				JSON.stringify({
					items: [{ ...resource, id: page, name: `Treff side ${page}` }],
					page,
					pageSize: 1,
					totalCount: 3,
				}),
				{ status: 200 }
			)
		)
	})
	const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView")
	const user = userEvent.setup()
	// "/" is the landing now — the list lives at /sok.
	window.history.pushState(null, "", "/sok")
	render(<App />)
	const heading = await screen.findByRole("heading", { level: 1, name: "3 treff" })
	// Initial load leaves focus and scroll alone — nothing was interacted with yet.
	expect(heading).not.toHaveFocus()
	expect(scrollIntoView).not.toHaveBeenCalled()

	// The pager sits below a long list; after paging, the user would otherwise be left staring
	// at the (now stale-looking) pager with focus stranded on the button they pressed.
	await user.click(screen.getByRole("button", { name: "Neste" }))
	await screen.findByText("Treff side 2")
	await waitFor(() =>
		expect(screen.getByRole("heading", { level: 1, name: "3 treff" })).toHaveFocus()
	)
	expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" })

	// Filtering must never steal focus from the search box mid-typing.
	const search = screen.getByLabelText("Søk etter tjeneste, kommune eller tema")
	await user.type(search, "k")
	await screen.findByText("Treff side 1")
	expect(search).toHaveFocus()
})
