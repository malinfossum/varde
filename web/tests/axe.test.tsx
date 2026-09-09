import { render, screen } from "@testing-library/react"
import { afterEach, describe, expect, test, vi } from "vitest"
import { axe } from "vitest-axe"
import { App } from "../src/App.tsx"
import type { ResourceDto } from "../src/types/api.ts"

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
}
const municipalities = [{ id: 1, name: "Hamar", county: "Innlandet" }]
const categories = [
	{ id: 9, slug: "nodtjenester", name: "Nødtjenester", isFallbackTranslation: false },
]

type Mode = "ok" | "empty" | "error"
function stub(mode: Mode) {
	vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
		const url = String(input)
		if (mode === "error") return Promise.resolve(new Response(null, { status: 500 }))
		if (url.includes("/api/municipalities"))
			return Promise.resolve(new Response(JSON.stringify(municipalities)))
		if (url.includes("/api/categories"))
			return Promise.resolve(new Response(JSON.stringify(categories)))
		if (/\/api\/resources\/\d+/.test(url))
			return Promise.resolve(new Response(JSON.stringify(resource)))
		const items = mode === "empty" ? [] : [resource]
		return Promise.resolve(
			new Response(JSON.stringify({ items, page: 1, pageSize: 20, totalCount: items.length }))
		)
	})
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
