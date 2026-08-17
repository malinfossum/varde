import { render, screen } from "@testing-library/react"
import { expect, test, vi } from "vitest"
import { ResourceDetail } from "../src/components/ResourceDetail.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"

const detail = {
	id: 12,
	name: "Krisesenteret i Hamar",
	description: "Hjelp.",
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
	categories: [],
}

test("detail shows hours with contact info and no handover banner", async () => {
	vi.spyOn(globalThis, "fetch").mockResolvedValue(
		new Response(JSON.stringify(detail), { status: 200 })
	)
	render(
		<LanguageProvider initialLang="nb">
			<ResourceDetail id={12} />
		</LanguageProvider>
	)
	expect(await screen.findByRole("heading", { name: "Krisesenteret i Hamar" })).toBeInTheDocument()
	expect(screen.getByText(/Åpningstider/)).toBeInTheDocument()
	expect(screen.queryByText(/legevakt 116 117/i)).not.toBeInTheDocument() // banner is list-only
})

test("a 404 renders NotFoundState with a way back", async () => {
	vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 404 }))
	render(
		<LanguageProvider initialLang="nb">
			<ResourceDetail id={999} />
		</LanguageProvider>
	)
	expect(await screen.findByRole("heading", { name: "Fant ikke tjenesten" })).toBeInTheDocument()
	expect(screen.getByRole("link", { name: "Tilbake til søket" })).toBeInTheDocument()
})
