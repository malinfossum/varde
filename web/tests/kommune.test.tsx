import { render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { clearIndexCache } from "../src/services/data.ts"
import { stubDataFiles } from "./stubData.ts"

const hamar = { id: 1, slug: "hamar", name: "Hamar", county: "Innlandet", number: "3403" }
const rows = [
	{ id: 1, name: "NAV Hamar", municipalityId: 1, servedMunicipalityIds: [], isNational: false },
	{
		id: 2,
		name: "Krisesenteret",
		municipalityId: 9,
		servedMunicipalityIds: [1],
		isNational: false,
		// A badge on a local card: its <li> must not be mistaken for a card below.
		isAlwaysOpen: true,
	},
	{
		id: 3,
		name: "Mental Helse",
		municipalityId: null,
		servedMunicipalityIds: [],
		isNational: true,
	},
	{ id: 4, name: "NAV Elverum", municipalityId: 9, servedMunicipalityIds: [], isNational: false },
].map((r) => ({
	description: "d",
	isFallbackTranslation: false,
	openingHours: null,
	isLowThreshold: false,
	cost: null,
	costNote: null,
	municipalityName: null,
	address: null,
	phone: "12345678",
	email: null,
	website: null,
	chatUrl: null,
	lastVerified: "2026-08-17",
	categories: [],
	parentId: null,
	phoneMenuOption: null,
	isAlwaysOpen: false,
	...r,
}))

afterEach(() => {
	clearIndexCache()
	vi.unstubAllGlobals()
})

test("renders own and served resources, then national ones, with one h1", async () => {
	stubDataFiles({
		resources: rows,
		kommuner: [hamar],
		municipalities: [
			{ id: 1, name: "Hamar", county: "Innlandet", number: "3403", countyNumber: "34" },
		],
	})
	window.history.pushState(null, "", "/kommune/hamar")
	const { container } = render(<App />)
	expect(
		await screen.findByRole("heading", { level: 1, name: "Hjelpetjenester i Hamar" })
	).toBeInTheDocument()
	const local = screen.getByRole("region", { name: "Tjenester i Hamar" })
	// Cards are counted by their headings: a card's badges are list items too.
	expect(
		within(local)
			.getAllByRole("heading", { level: 3 })
			.map((h) => h.textContent)
	).toEqual(["Krisesenteret", "NAV Hamar"])
	const national = screen.getByRole("region", { name: "Nasjonale tjenester" })
	expect(within(national).getAllByRole("heading", { level: 3 })).toHaveLength(1)
	expect(screen.getByRole("link", { name: "Søk og filtrer i Hamar" })).toHaveAttribute(
		"href",
		"/sok?municipality=1"
	)
	expect(container.querySelectorAll("h1")).toHaveLength(1)
	// PageHead sets the title in a passive effect, which can flush after the heading is
	// already in the DOM — a synchronous read here flaked once under load.
	await waitFor(() => expect(document.title).toBe("Hjelpetjenester i Hamar – Varde"))
})

test("unknown slug is not found", async () => {
	stubDataFiles({ kommuner: [hamar] })
	window.history.pushState(null, "", "/kommune/nope")
	render(<App />)
	expect(await screen.findByRole("heading", { level: 1, name: /fant ikke/i })).toBeInTheDocument()
})
