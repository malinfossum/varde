import { render, screen, waitFor, within } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { render as prerender } from "../src/entry-server.tsx"
import { clearIndexCache } from "../src/services/data.ts"
import { buildKommuneIndex } from "../src/services/kommuneIndex.ts"
import type { ResourceDto } from "../src/types/api.ts"
import { stubDataFiles } from "./stubData.ts"

const hamar = { id: 1, slug: "hamar", name: "Hamar", county: "Innlandet", number: "3403" }
const elverum = { id: 2, slug: "elverum", name: "Elverum", county: "Innlandet", number: "3420" }
const oslo = { id: 3, slug: "oslo", name: "Oslo", county: "Oslo", number: "0301" }
const base = {
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
	servedMunicipalityIds: [],
}
const rows = [
	{ ...base, id: 1, name: "NAV Hamar", municipalityId: 1, isNational: false },
	{
		...base,
		id: 2,
		name: "Krisesenteret",
		municipalityId: 9,
		servedMunicipalityIds: [1],
		isNational: false,
	},
	{ ...base, id: 3, name: "Mental Helse", municipalityId: null, isNational: true },
] as unknown as ResourceDto[]

afterEach(() => {
	clearIndexCache()
	vi.unstubAllGlobals()
	window.history.replaceState(null, "", "/")
})

test("lists each fylke as a region with its kommuner, counts and the national line", async () => {
	stubDataFiles({ resources: rows, kommuner: [hamar, elverum, oslo] })
	window.history.pushState(null, "", "/kommune")
	const { container } = render(<App />)
	expect(
		await screen.findByRole("heading", { level: 1, name: "Hjelpetjenester per kommune" })
	).toBeInTheDocument()
	const innlandet = screen.getByRole("region", { name: "Innlandet" })
	const links = within(innlandet).getAllByRole("link")
	expect(links.map((a) => a.getAttribute("href"))).toEqual(["/kommune/elverum", "/kommune/hamar"])
	expect(within(innlandet).getByRole("link", { name: "Hamar 2 tjenester" })).toBeInTheDocument()
	expect(within(innlandet).getByRole("link", { name: "Elverum 0 tjenester" })).toBeInTheDocument()
	expect(within(innlandet).getByRole("list")).toBeInTheDocument()
	expect(screen.getByRole("region", { name: "Oslo" })).toBeInTheDocument()
	expect(screen.getByText(/1 nasjonal tjeneste gjelder i hele landet\./)).toBeInTheDocument()
	expect(screen.getByRole("link", { name: "Se alle tjenester" })).toHaveAttribute("href", "/sok")
	expect(container.querySelectorAll("h1")).toHaveLength(1)
	await waitFor(() => expect(document.title).toBe("Hjelpetjenester per kommune – Varde"))
})

test("one service says tjeneste, and the English page says service and services", async () => {
	stubDataFiles({ resources: rows.slice(0, 1), kommuner: [hamar] })
	window.history.pushState(null, "", "/en/kommune")
	render(<App />)
	expect(
		await screen.findByRole("heading", { level: 1, name: "Help services by municipality" })
	).toBeInTheDocument()
	expect(screen.getByRole("link", { name: "Hamar 1 service" })).toHaveAttribute(
		"href",
		"/en/kommune/hamar"
	)
	// No national rows: the line is left out.
	expect(screen.queryByText(/national services cover/)).toBeNull()
})

test("two national services say tjenester, and one English national service says service", async () => {
	const twoNational = [
		...rows,
		{ ...base, id: 4, name: "Kirkens SOS", municipalityId: null, isNational: true },
	] as unknown as ResourceDto[]
	stubDataFiles({ resources: twoNational, kommuner: [hamar] })
	window.history.pushState(null, "", "/kommune")
	const { unmount } = render(<App />)
	expect(
		await screen.findByText(/2 nasjonale tjenester gjelder i hele landet\./)
	).toBeInTheDocument()
	unmount()

	clearIndexCache()
	stubDataFiles({ resources: rows, kommuner: [hamar] })
	window.history.pushState(null, "", "/en/kommune")
	render(<App />)
	expect(
		await screen.findByText(/1 national service covers the whole country\./)
	).toBeInTheDocument()
})

test("a failed index load shows the error state", async () => {
	vi.stubGlobal(
		"fetch",
		vi.fn(async () => new Response("down", { status: 503 }))
	)
	window.history.pushState(null, "", "/kommune")
	render(<App />)
	expect(await screen.findByRole("button", { name: /prøv igjen/i })).toBeInTheDocument()
})

// Last on purpose: prerender() in jsdom leaves UrlContext holding the prerendered URL, which
// would break any client render after it (same note as headerMenu.test.tsx).
test("a prerendered page renders from baked data and fetches nothing", async () => {
	const fetchSpy = vi.fn()
	vi.stubGlobal("fetch", fetchSpy)
	const kommuneIndex = buildKommuneIndex([hamar], rows)
	const { html } = await prerender("/kommune", { lang: "nb", kommuneIndex })
	expect(html).toContain("Hjelpetjenester per kommune")
	expect(html).toContain('href="/kommune/hamar"')
	expect(html).not.toContain("<script")
	expect(html).not.toContain(" style=")
	expect(fetchSpy).not.toHaveBeenCalled()
})
