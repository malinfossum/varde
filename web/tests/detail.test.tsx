import { render, screen } from "@testing-library/react"
import { expect, test, vi } from "vitest"
import { ResourceDetail } from "../src/components/ResourceDetail.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import type { ResourceDto } from "../src/types/api.ts"

const detail: ResourceDto = {
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

// --- share + copy-phone ---------------------------------------------------------------------
// jsdom ships neither navigator.share nor navigator.clipboard, so each test installs exactly
// the capabilities it is about and removes them again.

import { act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach } from "vitest"
import { AnnouncerProvider } from "../src/components/StatusRegion.tsx"

function installNavigator(overrides: { share?: unknown; clipboard?: unknown }) {
	for (const [key, value] of Object.entries(overrides)) {
		Object.defineProperty(navigator, key, { value, configurable: true })
	}
	return () => {
		for (const key of Object.keys(overrides)) {
			delete (navigator as unknown as Record<string, unknown>)[key]
		}
	}
}

let restoreNavigator = () => {}
afterEach(() => restoreNavigator())

async function renderDetail(resource: ResourceDto = detail) {
	vi.spyOn(globalThis, "fetch").mockResolvedValue(
		new Response(JSON.stringify(resource), { status: 200 })
	)
	render(
		<LanguageProvider initialLang="nb">
			<AnnouncerProvider>
				<ResourceDetail id={12} />
			</AnnouncerProvider>
		</LanguageProvider>
	)
	await screen.findByRole("heading", { name: resource.name })
}

test("with a share sheet the Del button shares name, phone and this page", async () => {
	const share = vi.fn().mockResolvedValue(undefined)
	restoreNavigator = installNavigator({ share })
	await renderDetail()
	await userEvent.click(screen.getByRole("button", { name: "Del" }))
	expect(share).toHaveBeenCalledWith({
		title: "Krisesenteret i Hamar",
		text: "Krisesenteret i Hamar — 62 00 00 00",
		url: window.location.href,
	})
})

test("without a share sheet the button copies the link and says so", async () => {
	const writeText = vi.fn().mockResolvedValue(undefined)
	restoreNavigator = installNavigator({ clipboard: { writeText } })
	await renderDetail()
	expect(screen.queryByRole("button", { name: "Del" })).not.toBeInTheDocument()
	await userEvent.click(screen.getByRole("button", { name: "Kopier lenke" }))
	expect(writeText).toHaveBeenCalledWith(window.location.href)
	expect(await screen.findByText("Lenken er kopiert")).toBeInTheDocument()
})

test("copy-phone copies the number as shown and announces it", async () => {
	const writeText = vi.fn().mockResolvedValue(undefined)
	restoreNavigator = installNavigator({ clipboard: { writeText } })
	await renderDetail()
	await userEvent.click(screen.getByRole("button", { name: "Kopier nummer" }))
	expect(writeText).toHaveBeenCalledWith("62 00 00 00")
	expect(await screen.findByText("Nummeret er kopiert")).toBeInTheDocument()
})

test("a refused clipboard write is announced, not swallowed", async () => {
	const writeText = vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError"))
	restoreNavigator = installNavigator({ clipboard: { writeText } })
	await renderDetail()
	await userEvent.click(screen.getByRole("button", { name: "Kopier nummer" }))
	expect(await screen.findByText("Kunne ikke kopiere")).toBeInTheDocument()
})

test("a cancelled share sheet announces nothing", async () => {
	const share = vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError"))
	restoreNavigator = installNavigator({ share })
	await renderDetail()
	await userEvent.click(screen.getByRole("button", { name: "Del" }))
	await act(async () => {})
	expect(screen.queryByText(/kopiert/)).not.toBeInTheDocument()
})

test("no phone means no copy-phone button", async () => {
	const writeText = vi.fn().mockResolvedValue(undefined)
	restoreNavigator = installNavigator({ clipboard: { writeText } })
	await renderDetail({ ...detail, phone: null })
	expect(screen.queryByRole("button", { name: "Kopier nummer" })).not.toBeInTheDocument()
})

test("with neither share nor clipboard the page has no share or copy buttons", async () => {
	await renderDetail()
	expect(screen.queryByRole("button", { name: /Del|Kopier/ })).not.toBeInTheDocument()
})

test("a share sheet without a clipboard shows Del but no copy-phone button", async () => {
	restoreNavigator = installNavigator({ share: vi.fn().mockResolvedValue(undefined) })
	await renderDetail()
	expect(screen.getByRole("button", { name: "Del" })).toBeInTheDocument()
	expect(screen.queryByRole("button", { name: "Kopier nummer" })).not.toBeInTheDocument()
})
