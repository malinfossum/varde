import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"
import { axe } from "vitest-axe"
import { App } from "../src/App.tsx"
import type { ResourceDto } from "../src/types/api.ts"
import { stubDataFiles } from "./stubData.ts"

// Copied from tests/list.test.tsx.
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
const municipalities = [{ id: 1, name: "Hamar", county: "Innlandet" }]
const categories = [
	{ id: 9, slug: "nodtjenester", name: "Nødtjenester", isFallbackTranslation: false },
]
const kommuner = [{ id: 1, slug: "hamar", name: "Hamar", county: "Innlandet" }]

type Mode = "ok" | "empty" | "error"
function stub(mode: Mode) {
	if (mode === "error") {
		vi.stubGlobal(
			"fetch",
			vi.fn(async () => new Response(null, { status: 500 }))
		)
		return
	}
	// "empty" doesn't need its own fixture: /sok?search=zzz matches nothing in the one seeded
	// resource, so applyQuery (query.ts) naturally returns zero results, same as before this
	// task when the API was told to return an empty page directly.
	stubDataFiles({ resources: [resource], municipalities, categories, kommuner })
}

// jsdom does no layout, so axe cannot judge colour; tests/tokens.test.ts covers contrast.
const options = { rules: { "color-contrast": { enabled: false } } }

const pages: [string, string, Mode, RegExp][] = [
	["landing", "/", "ok", /Finn riktig hjelp/],
	["results", "/sok", "ok", /treff/],
	["empty", "/sok?search=zzz", "empty", /Ingen treff/],
	["error", "/sok", "error", /Noe gikk galt/],
	["detail", "/resources/12", "ok", /Krisesenteret i Hamar/],
	["not found", "/nope", "ok", /Fant ikke/],
	["kommune", "/kommune/hamar", "ok", /Hjelpetjenester i Hamar/],
]

afterEach(() => {
	vi.restoreAllMocks()
	window.history.replaceState(null, "", "/")
	document.documentElement.removeAttribute("data-theme")
})

describe.each(["light", "dark"])("%s theme", (theme) => {
	test.each(pages)("%s has no axe violations", async (_name, path, mode, settled) => {
		document.documentElement.dataset.theme = theme
		stub(mode)
		window.history.replaceState(null, "", path)
		const { container } = render(<App />)
		// A heading query, not findByText: the live region echoes the same wording (e.g. "1
		// treff") as the results heading, so a plain text match is ambiguous. Asserting the
		// heading itself also proves the real page — not an empty container — is mounted.
		await screen.findByRole("heading", { name: settled })
		// axe's page-has-heading-one only checks that at least one h1 exists. Exactly one is the
		// invariant that has broken three times on this branch, so assert the count directly.
		expect(container.querySelectorAll("h1")).toHaveLength(1)
		expect(await axe(container, options)).toHaveNoViolations()
	})
})
