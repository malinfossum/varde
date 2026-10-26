import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { PageDataContext } from "../src/pageData.ts"
import type { ResourceDto } from "../src/types/api.ts"
import { bakedHelplines, stubDataFiles } from "./stubData.ts"

// Safari and VoiceOver drop the list role from a <ul> whose list-style is none, and Tailwind's
// Preflight sets that on every list. Only an explicit role="list" keeps "list, N items", so every
// list the pages render must carry it.

const resource: ResourceDto = {
	id: 12,
	name: "Krisesenteret i Hamar",
	description: "Hjelp ved vold i nære relasjoner.",
	isFallbackTranslation: false,
	openingHours: "Døgnåpent",
	isNational: false,
	isAlwaysOpen: true,
	isLowThreshold: true,
	cost: "free",
	costNote: null,
	municipalityId: 1,
	municipalityName: "Hamar",
	address: null,
	phone: "62 00 00 00",
	email: null,
	website: "https://example.test",
	chatUrl: null,
	lastVerified: "2026-08-13",
	categories: [{ id: 4, slug: "rus", name: "Rus og avhengighet", isFallbackTranslation: false }],
	servedMunicipalityIds: [],
	parentId: null,
	phoneMenuOption: null,
}

function listsWithoutRole() {
	return [...document.querySelectorAll("ul, ol")]
		.filter((list) => list.getAttribute("role") !== "list")
		.map((list) => list.className || list.getAttribute("aria-label") || list.tagName)
}

afterEach(() => {
	cleanup()
	vi.restoreAllMocks()
	window.history.replaceState(null, "", "/")
})

test("the landing's lists keep role=list: strip, featured row, chip grid, emergency, helplines", () => {
	stubDataFiles()
	render(
		<PageDataContext.Provider value={bakedHelplines("nb")}>
			<App />
		</PageDataContext.Provider>
	)
	expect(document.querySelector(".acute-strip")).toHaveAttribute("role", "list")
	expect(document.querySelector(".chip-featured-row")).toHaveAttribute("role", "list")
	expect(document.querySelector(".chip-grid")).toHaveAttribute("role", "list")
	expect(document.querySelectorAll("ul, ol").length).toBeGreaterThanOrEqual(5)
	expect(listsWithoutRole()).toEqual([])
})

test("the results page's lists keep role=list: filter chips, result cards, badges", async () => {
	stubDataFiles({
		resources: [resource],
		municipalities: [{ id: 1, name: "Hamar", county: "Innlandet" }],
		categories: [{ id: 4, slug: "rus", name: "Rus og avhengighet", isFallbackTranslation: false }],
	})
	window.history.pushState(null, "", "/sok")
	render(<App />)
	const card = await screen.findByRole("heading", { level: 2, name: "Krisesenteret i Hamar" })
	expect(card.closest("ul")).toHaveAttribute("role", "list")
	expect(screen.getByText("Lavterskel").closest("ul")).toHaveAttribute("role", "list")
	expect(listsWithoutRole()).toEqual([])
})
