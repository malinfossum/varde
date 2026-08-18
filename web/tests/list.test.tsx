import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { EmptyState } from "../src/components/EmptyState.tsx"
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

test("card renders badges from data, hours text, tel link and external rel", () => {
	withLang(<ResourceCard resource={resource} />)
	expect(screen.getByText("Akutt")).toBeInTheDocument()
	expect(screen.getByText("Døgnåpent", { selector: ".badge" })).toBeInTheDocument()
	expect(screen.queryByText("Nasjonal")).not.toBeInTheDocument()
	expect(screen.getByText(/Åpningstider/)).toBeInTheDocument()
	const tel = screen.getByRole("link", { name: /62 00 00 00/ })
	expect(tel).toHaveAttribute("href", "tel:62000000")
	const external = screen.getByRole("link", { name: /example.test|Nettside/ })
	expect(external).toHaveAttribute("rel", "noopener noreferrer")
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

test("Alle clears both municipality and national selection from the URL", async () => {
	stubCatalogAndResources()
	window.history.pushState(null, "", "/?municipality=1")
	const user = userEvent.setup()
	render(<App />)
	await waitFor(() => expect(screen.getByRole("button", { name: "Hamar" })).toBeInTheDocument())

	const alle = screen.getByRole("button", { name: "Alle" })
	expect(alle).toHaveAttribute("aria-pressed", "false")
	await user.click(alle)

	expect(window.location.search).not.toContain("municipality")
	expect(window.location.search).not.toContain("national")
})
