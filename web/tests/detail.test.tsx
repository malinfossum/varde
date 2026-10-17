import { act, render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { ResourceDetail } from "../src/components/ResourceDetail.tsx"
import { AnnouncerProvider } from "../src/components/StatusRegion.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { PageDataContext } from "../src/pageData.ts"
import { familyOf } from "../src/services/family.ts"
import type { ResourceDto } from "../src/types/api.ts"
import { helplineRows, stubDataFiles, visibleText } from "./stubData.ts"

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
	servedMunicipalityIds: [],
	parentId: null,
	phoneMenuOption: null,
}

// The two ready-branch tests below set window.history state directly (replaceState, and a
// back() spy) to drive the stateful back link. Reset both after every test in this file so
// that state can't leak into a later test that never asked for it. A review caught the share
// and copy-phone tests below silently inheriting `{ from: "sok" }` this way.
afterEach(() => {
	window.history.replaceState(null, "", "/")
})

test("detail shows hours with contact info and no handover banner", async () => {
	stubDataFiles({ resources: [detail] })
	render(
		<LanguageProvider lang="nb">
			<ResourceDetail id={12} />
		</LanguageProvider>
	)
	expect(await screen.findByRole("heading", { name: "Krisesenteret i Hamar" })).toBeInTheDocument()
	expect(screen.getByText(/Åpningstider/)).toBeInTheDocument()
	expect(screen.queryByText(/legevakt 116 117/i)).not.toBeInTheDocument() // banner is list-only
	// The card dropped its website link, so the detail page is now the only place this rel
	// attribute matters.
	const website = screen.getByRole("link", { name: /example.test|Nettside/ })
	expect(website).toHaveAttribute("rel", "noopener noreferrer")
})

test("the report link is a mailto to the role alias, named after this resource", async () => {
	stubDataFiles({ resources: [detail] })
	render(
		<LanguageProvider lang="nb">
			<ResourceDetail id={12} />
		</LanguageProvider>
	)
	const report = await screen.findByRole("link", { name: "Meld feil i oppføringen" })
	expect(report).toHaveAttribute(
		"href",
		"mailto:varde.purely709@passmail.com?subject=Varde%20%2312%3A%20Krisesenteret%20i%20Hamar"
	)
})

test("a 404 renders NotFoundState with a way back", async () => {
	stubDataFiles({ resources: [] })
	render(
		<LanguageProvider lang="nb">
			<ResourceDetail id={999} />
		</LanguageProvider>
	)
	// NotFoundState is the whole page in this state (Header's brand is a link, not a heading),
	// so it must own the page's one level-1 heading, not level 2.
	expect(
		await screen.findByRole("heading", { level: 1, name: "Fant ikke tjenesten" })
	).toBeInTheDocument()
	expect(screen.getByRole("link", { name: "Tilbake til resultater" })).toBeInTheDocument()
})

// --- ready branch: contact tiles + stateful back link -------------------------------------

test("the phone tile calls the service and the back link is a plain link without history state", async () => {
	stubDataFiles({ resources: [detail] })
	window.history.replaceState(null, "", "/resources/12")
	render(
		<LanguageProvider lang="nb">
			<AnnouncerProvider>
				<ResourceDetail id={12} arrival={0} />
			</AnnouncerProvider>
		</LanguageProvider>
	)
	const call = await screen.findByRole("link", { name: "Ring, døgnåpen, 62 00 00 00" })
	expect(call).toHaveAttribute("href", "tel:62000000")
	// Assert role + accessible name, not the class that styles the tile, so a redesign does not
	// have to touch this test.
	expect(screen.getByRole("link", { name: "Tilbake til resultater" })).toHaveAttribute(
		"href",
		"/sok"
	)
	await waitFor(() => expect(document.title).toBe("Krisesenteret i Hamar – Varde"))
})

test("with from=sok in history state the back control goes back", async () => {
	stubDataFiles({ resources: [detail] })
	window.history.replaceState({ from: "sok" }, "", "/resources/12")
	const back = vi.spyOn(window.history, "back").mockImplementation(() => {})
	render(
		<LanguageProvider lang="nb">
			<AnnouncerProvider>
				<ResourceDetail id={12} arrival={1} />
			</AnnouncerProvider>
		</LanguageProvider>
	)
	await screen.findByRole("heading", { level: 1, name: "Krisesenteret i Hamar" })
	await userEvent.setup().click(screen.getByRole("button", { name: "Tilbake til resultater" }))
	expect(back).toHaveBeenCalledTimes(1)
	// This is a spy on the real window.history, not a per-test fake. Left in place, it's a
	// permanent no-op for every test below that runs after this one in the file.
	back.mockRestore()
})

test("cameFromResults recomputes per id, not just on mount", async () => {
	// App.tsx renders <ResourceDetail id={route.id} /> without a `key`, so a detail-to-detail
	// transition (e.g. history.go(-2) landing on a different resource while still on a detail
	// route) reuses this component instance instead of remounting it. The mount-only effect this
	// task started with would keep showing resource A's back-link style for resource B.
	const other: ResourceDto = { ...detail, id: 13, name: "Et annet tilbud" }
	stubDataFiles({ resources: [detail, other] })
	window.history.replaceState({ from: "sok" }, "", "/resources/12")
	const { rerender } = render(
		<LanguageProvider lang="nb">
			<AnnouncerProvider>
				<ResourceDetail id={12} />
			</AnnouncerProvider>
		</LanguageProvider>
	)
	await screen.findByRole("heading", { level: 1, name: "Krisesenteret i Hamar" })
	expect(screen.getByRole("button", { name: "Tilbake til resultater" })).toBeInTheDocument()

	window.history.replaceState(null, "", "/resources/13")
	rerender(
		<LanguageProvider lang="nb">
			<AnnouncerProvider>
				<ResourceDetail id={13} />
			</AnnouncerProvider>
		</LanguageProvider>
	)
	await screen.findByRole("heading", { level: 1, name: "Et annet tilbud" })
	expect(screen.getByRole("link", { name: "Tilbake til resultater" })).toHaveAttribute(
		"href",
		"/sok"
	)
})

test("badges render on the detail page in the fixed order Akutt, Nasjonal, Døgnåpent", async () => {
	stubDataFiles({
		resources: [
			{
				...detail,
				isNational: true,
				categories: [
					{ id: 9, slug: "nodtjenester", name: "Nødtjenester", isFallbackTranslation: false },
				],
			},
		],
	})
	render(
		<LanguageProvider lang="nb">
			<AnnouncerProvider>
				<ResourceDetail id={12} />
			</AnnouncerProvider>
		</LanguageProvider>
	)
	await screen.findByRole("heading", { level: 1, name: "Krisesenteret i Hamar" })
	// ResourceBadges was extracted out of ResourceCard, and ResourceDetail is its second
	// consumer. A broken import, wrong prop, or reordering here would otherwise go undetected,
	// since only list.test.tsx exercised the component before this.
	const badges = screen
		.getAllByText(/^(Akutt|Nasjonal|Døgnåpent)$/, { selector: ".badge" })
		.map((el) => el.textContent)
	expect(badges).toEqual(["Akutt", "Nasjonal", "Døgnåpent"])
})

// --- share + copy-phone ---------------------------------------------------------------------
// jsdom ships neither navigator.share nor navigator.clipboard, so each test installs exactly
// the capabilities it is about and removes them again.

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
	stubDataFiles({ resources: [resource] })
	render(
		<LanguageProvider lang="nb">
			<AnnouncerProvider>
				<ResourceDetail id={12} />
			</AnnouncerProvider>
		</LanguageProvider>
	)
	await screen.findByRole("heading", { name: resource.name })
	// findByRole resolves on the DOM mutation, before the actions' mount effect has hidden what
	// this browser cannot do. Let it settle so the tests read the final buttons.
	await act(async () => {})
}

test("with a share sheet the Del button shares name, phone and this page", async () => {
	const share = vi.fn().mockResolvedValue(undefined)
	restoreNavigator = installNavigator({ share })
	await renderDetail()
	await userEvent.click(screen.getByRole("button", { name: "Del" }))
	expect(share).toHaveBeenCalledWith({
		title: "Krisesenteret i Hamar",
		text: "Krisesenteret i Hamar: 62 00 00 00",
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
	expect(
		await screen.findByText("Lenken er kopiert", { selector: "[aria-live]" })
	).toBeInTheDocument()
})

test("copy-phone copies the number as shown and announces it", async () => {
	const writeText = vi.fn().mockResolvedValue(undefined)
	restoreNavigator = installNavigator({ clipboard: { writeText } })
	await renderDetail()
	await userEvent.click(screen.getByRole("button", { name: "Kopier nummer" }))
	expect(writeText).toHaveBeenCalledWith("62 00 00 00")
	expect(
		await screen.findByText("Nummeret er kopiert", { selector: "[aria-live]" })
	).toBeInTheDocument()
})

test("a refused clipboard write is announced, not swallowed", async () => {
	const writeText = vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError"))
	restoreNavigator = installNavigator({ clipboard: { writeText } })
	await renderDetail()
	await userEvent.click(screen.getByRole("button", { name: "Kopier nummer" }))
	expect(
		await screen.findByText("Kunne ikke kopiere", { selector: "[aria-live]" })
	).toBeInTheDocument()
})

test("a cancelled share sheet announces nothing", async () => {
	const share = vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError"))
	restoreNavigator = installNavigator({ share })
	await renderDetail()
	await userEvent.click(screen.getByRole("button", { name: "Del" }))
	await act(async () => {})
	// Nothing is spoken (the live region is empty) and nothing is shown (no bubble under the button).
	for (const region of document.querySelectorAll("[aria-live]")) {
		expect(region).toBeEmptyDOMElement()
	}
	expect(document.querySelector(".action-feedback")).toBeNull()
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

function renderHelpline(id: number, lang: "nb" | "en" = "nb") {
	stubDataFiles({ resources: helplineRows })
	render(
		<LanguageProvider lang={lang}>
			<AnnouncerProvider>
				<ResourceDetail id={id} />
			</AnnouncerProvider>
		</LanguageProvider>
	)
}

test("Mental Helse's contact block: its phone, Sidetmedord's chat, then Arbeidslivstelefonen", async () => {
	renderHelpline(1)
	const block = await screen.findByRole("region", { name: "Kontakt" })
	expect(within(block).getByRole("heading", { level: 2, name: "Kontakt" })).toBeInTheDocument()
	const tiles = within(block).getAllByRole("link")
	expect(tiles.map((a) => a.getAttribute("href"))).toEqual([
		"tel:116123",
		"https://mentalhelse.no/hjelpechat/",
		"tel:116123",
	])
	expect(tiles[0]).toHaveAccessibleName("Ring, døgnåpen, 116 123")
	expect(tiles[0]).not.toHaveAccessibleName(/·/)
	expect(visibleText(tiles[0] as HTMLElement)).toContain("Ring · døgnåpen")
	expect(tiles[1]).toHaveAccessibleName("Sidetmedord (Mental Helse), Åpne chatten")
	expect(tiles[2]).toHaveAccessibleName("Arbeidslivstelefonen (Mental Helse), 116 123, tast 3")
})

test("døgnåpen sits on Kirkens SOS's phone tile and never on its chat tile", async () => {
	renderHelpline(2)
	const block = await screen.findByRole("region", { name: "Kontakt" })
	const [phone, chat] = within(block).getAllByRole("link")
	expect(phone).toHaveAccessibleName("Ring, døgnåpen, 22 40 00 40")
	expect(chat).toHaveAccessibleName("Chat, Åpne chatten")
	expect(chat).toHaveAttribute("href", "https://www.soschat.no")
})

test("in English the tiles say Call, open 24/7, Open the chat and press 3", async () => {
	renderHelpline(1, "en")
	const block = await screen.findByRole("region", { name: "Contact" })
	expect(within(block).getAllByRole("link")).toHaveLength(3)
	const [phone, chat, work] = within(block).getAllByRole("link")
	expect(phone).toHaveAccessibleName("Call, open 24/7, 116 123")
	expect(chat).toHaveAccessibleName("Sidetmedord (Mental Helse), Open the chat")
	expect(work).toHaveAccessibleName("Arbeidslivstelefonen (Mental Helse), 116 123, press 3")
})

test("a child page says which service it belongs to, linking there", async () => {
	renderHelpline(9)
	await screen.findByRole("heading", { level: 1, name: "Arbeidslivstelefonen (Mental Helse)" })
	const parent = screen.getByRole("link", { name: "Hjelpetelefonen (Mental Helse)" })
	expect(parent).toHaveAttribute("href", "/resources/1")
	expect(parent.parentElement).toHaveTextContent("Del av Hjelpetelefonen (Mental Helse)")
})

test("in English the parent link keeps the English prefix", async () => {
	renderHelpline(9, "en")
	const parent = await screen.findByRole("link", { name: "Hjelpetelefonen (Mental Helse)" })
	expect(parent).toHaveAttribute("href", "/en/resources/1")
	expect(parent.parentElement).toHaveTextContent("Part of Hjelpetelefonen (Mental Helse)")
})

test("a child whose parent is missing from the data shows no Del av line", async () => {
	stubDataFiles({ resources: helplineRows.filter((r) => r.id !== 1) })
	render(
		<LanguageProvider lang="nb">
			<AnnouncerProvider>
				<ResourceDetail id={9} />
			</AnnouncerProvider>
		</LanguageProvider>
	)
	await screen.findByRole("heading", { level: 1, name: "Arbeidslivstelefonen (Mental Helse)" })
	expect(screen.queryByText(/Del av/)).toBeNull()
})

test("a prerendered Mental Helse page shows its child tiles without a request", () => {
	const fetchSpy = vi.spyOn(globalThis, "fetch")
	const resource = helplineRows.find((r) => r.id === 1) as ResourceDto
	render(
		<PageDataContext.Provider value={{ resource, family: familyOf(resource, helplineRows) }}>
			<LanguageProvider lang="nb">
				<AnnouncerProvider>
					<ResourceDetail id={1} />
				</AnnouncerProvider>
			</LanguageProvider>
		</PageDataContext.Provider>
	)
	const block = screen.getByRole("region", { name: "Kontakt" })
	expect(within(block).getAllByRole("link")).toHaveLength(3)
	expect(fetchSpy).not.toHaveBeenCalled()
	fetchSpy.mockRestore()
})

test("a service with no phone, no chat and no children has no contact block", async () => {
	await renderDetail({ ...detail, phone: null, chatUrl: null })
	expect(screen.queryByRole("region", { name: "Kontakt" })).toBeNull()
})

test("the chat is a tile now, not a raw address in the facts list", async () => {
	await renderDetail({ ...detail, chatUrl: "https://chat.example.test/" })
	expect(screen.queryByText("https://chat.example.test/")).toBeNull()
	expect([...document.querySelectorAll("dt")].map((dt) => dt.textContent)).not.toContain("Chat")
	expect(screen.getByRole("link", { name: "Chat, Åpne chatten" })).toHaveAttribute(
		"href",
		"https://chat.example.test/"
	)
})

test("a chat address that is not https never becomes a tile", async () => {
	await renderDetail({ ...detail, chatUrl: "javascript:alert(1)" })
	expect(screen.queryByRole("link", { name: /Åpne chatten/ })).toBeNull()
})

test("the email is the last contact tile, named E-post, and not a row in the facts", async () => {
	await renderDetail({ ...detail, email: "post@krisesenter.example.no" })
	const block = screen.getByRole("region", { name: "Kontakt" })
	const tiles = within(block).getAllByRole("link")
	const email = tiles.at(-1) as HTMLElement
	expect(email).toHaveAccessibleName("E-post, post@krisesenter.example.no")
	expect(email).toHaveAttribute("href", "mailto:post@krisesenter.example.no")
	expect(email).not.toHaveAttribute("rel")
	expect(email).not.toHaveAttribute("target")
	expect([...document.querySelectorAll("dt")].map((dt) => dt.textContent)).not.toContain("E-post")
})

test("an unsafe email gets no tile and no link anywhere", async () => {
	await renderDetail({ ...detail, email: "a@b.no?bcc=x@y.no" })
	expect(document.querySelector('a[href^="mailto:a@b.no"]')).toBeNull()
})

test("in English the email tile is named Email", async () => {
	stubDataFiles({ resources: [{ ...detail, email: "post@example.no" }] })
	render(
		<LanguageProvider lang="en">
			<AnnouncerProvider>
				<ResourceDetail id={12} />
			</AnnouncerProvider>
		</LanguageProvider>
	)
	const block = await screen.findByRole("region", { name: "Contact" })
	expect(within(block).getAllByRole("link").at(-1)).toHaveAccessibleName("Email, post@example.no")
})

const ringsaker: ResourceDto = {
	...detail,
	name: "Psykisk helse- og rustjenester, Ringsaker kommune",
	description: "Kommunens tilbud til voksne.",
	openingHours: "Kan kontaktes i tidsrommet 08-15.30",
	address: "Brugata 3, 2380 Brumunddal",
	email: "postmottak.psykisk.helse@ringsaker.kommune.no",
	website: "https://www.ringsaker.kommune.no/",
}

test("the card has an h1 and three h2 sections in order, each a region named by its heading", async () => {
	await renderDetail(ringsaker)
	const card = screen.getByRole("article")
	expect(within(card).getByRole("heading", { level: 1 })).toHaveTextContent(ringsaker.name)
	expect(
		within(card)
			.getAllByRole("heading", { level: 2 })
			.map((h) => h.textContent)
	).toEqual(["Kontakt", "Om tjenesten", "Praktisk informasjon"])
	for (const name of ["Kontakt", "Om tjenesten", "Praktisk informasjon"]) {
		expect(within(card).getByRole("region", { name })).toBeInTheDocument()
	}
})

test("Praktisk informasjon lists hours, address and website in that order, each label beside its value", async () => {
	await renderDetail(ringsaker)
	const facts = screen.getByRole("region", { name: "Praktisk informasjon" })
	expect([...facts.querySelectorAll("dt")].map((dt) => dt.textContent)).toEqual([
		"Åpningstider",
		"Adresse",
		"Nettside",
	])
	for (const pair of facts.querySelectorAll("dl > div")) {
		expect(pair.querySelectorAll("dt")).toHaveLength(1)
		expect(pair.querySelectorAll("dd")).toHaveLength(1)
	}
})

test("the footer holds last verified, inside the card, with no heading", async () => {
	await renderDetail(ringsaker)
	const footer = screen.getByText(/Sist bekreftet/).closest("footer")
	expect(footer).not.toBeNull()
	expect(footer).toHaveTextContent("Sist bekreftet 2026-08-13")
	expect(screen.getByRole("article")).toContainElement(footer)
	expect(within(footer as HTMLElement).queryByRole("heading")).toBeNull()
})

test.each(["", "   "])("a blank description (%j) leaves Om tjenesten out", async (description) => {
	await renderDetail({ ...ringsaker, description })
	expect(screen.queryByRole("region", { name: "Om tjenesten" })).toBeNull()
})

test("no hours, address or website leaves Praktisk informasjon out", async () => {
	await renderDetail({ ...ringsaker, openingHours: null, address: null, website: null })
	expect(screen.queryByRole("region", { name: "Praktisk informasjon" })).toBeNull()
})

test("no tiles leaves Kontakt out, and the other sections stay", async () => {
	await renderDetail({ ...ringsaker, phone: null, email: null, chatUrl: null })
	expect(screen.queryByRole("region", { name: "Kontakt" })).toBeNull()
	expect(screen.getByRole("region", { name: "Om tjenesten" })).toBeInTheDocument()
})

function renderEnglish(resource: ResourceDto) {
	stubDataFiles({ resources: [resource] })
	render(
		<LanguageProvider lang="en">
			<AnnouncerProvider>
				<ResourceDetail id={12} />
			</AnnouncerProvider>
		</LanguageProvider>
	)
	return screen.findByRole("heading", { level: 1 })
}

test("on /en a fallback description is marked as Norwegian, and only the description", async () => {
	await renderEnglish({ ...ringsaker, isFallbackTranslation: true })
	expect(screen.getByText("Kommunens tilbud til voksne.")).toHaveAttribute("lang", "nb")
	expect(screen.getByRole("heading", { level: 1 })).not.toHaveAttribute("lang")
	expect(screen.getByRole("region", { name: "About the service" })).toBeInTheDocument()
	expect(screen.getByRole("region", { name: "Practical details" })).toBeInTheDocument()
})

test("on /en a translated description carries no lang", async () => {
	await renderEnglish(ringsaker)
	expect(screen.getByText("Kommunens tilbud til voksne.")).not.toHaveAttribute("lang")
})

test("a website that is not https shows as text, never as a link", async () => {
	await renderDetail({ ...ringsaker, website: "javascript:alert(1)" })
	const facts = screen.getByRole("region", { name: "Praktisk informasjon" })
	expect(within(facts).queryByRole("link")).toBeNull()
	expect(facts).toHaveTextContent("javascript:alert(1)")
})

test("the back link stays outside the card", async () => {
	await renderDetail(ringsaker)
	const back = screen.getByRole("link", { name: "Tilbake til resultater" })
	expect(screen.getByRole("article")).not.toContainElement(back)
})
