import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { ResourceDetail } from "../src/components/ResourceDetail.tsx"
import { AnnouncerProvider } from "../src/components/StatusRegion.tsx"
import { type Lang, LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { PageDataContext } from "../src/pageData.ts"
import { NO_FAMILY } from "../src/services/family.ts"
import type { ResourceDto } from "../src/types/api.ts"
import { makeResource } from "./stubData.ts"

const ringsaker: ResourceDto = makeResource({
	id: 102,
	name: "Psykisk helse- og rustjenester, Ringsaker kommune",
	description: "Kommunens tilbud.",
	phone: "62 33 52 20",
})

// jsdom ships neither navigator.share nor navigator.clipboard; each test installs what it is about.
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
afterEach(() => {
	restoreNavigator()
	restoreNavigator = () => {}
})

// The prerendered path: the resource is baked in, so the page renders without a fetch.
function tree(resource: ResourceDto, lang: Lang) {
	return (
		<PageDataContext.Provider value={{ resource, family: NO_FAMILY }}>
			<LanguageProvider lang={lang}>
				<AnnouncerProvider>
					<ResourceDetail id={resource.id} />
				</AnnouncerProvider>
			</LanguageProvider>
		</PageDataContext.Provider>
	)
}

function renderBaked(resource: ResourceDto = ringsaker, lang: Lang = "nb") {
	return render(tree(resource, lang))
}

const actions = () => [...document.querySelectorAll<HTMLElement>(".detail-head .action-btn")]
const shortLabels = () => actions().map((a) => a.querySelector(".action-label")?.textContent)
const tips = () => actions().map((a) => a.querySelector(".action-tip")?.textContent)

test("with share and clipboard the head ends with copy, share and report, named in full", () => {
	restoreNavigator = installNavigator({
		share: vi.fn().mockResolvedValue(undefined),
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	})
	renderBaked()
	expect(actions().map((a) => a.getAttribute("aria-label"))).toEqual([
		"Kopier nummer",
		"Del",
		"Meld feil i oppføringen",
	])
	expect(shortLabels()).toEqual(["Kopier nummer", "Del", "Meld feil"])
	expect(tips()).toEqual(["Kopier nummer", "Del", "Meld feil i oppføringen"])
	for (const a of actions()) {
		expect(a.querySelector(".action-label")).toHaveAttribute("aria-hidden", "true")
		expect(a.querySelector(".action-tip")).toHaveAttribute("aria-hidden", "true")
		expect(a.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
	}
	// The group is the last thing in the head, after the title block.
	expect(document.querySelector(".detail-head")?.lastElementChild).toHaveClass("detail-actions")
	expect(document.querySelector(".detail-actions")).not.toHaveAttribute("role")
})

test("in English the names are Copy number, Share and Report an error in this listing", () => {
	restoreNavigator = installNavigator({
		share: vi.fn().mockResolvedValue(undefined),
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	})
	renderBaked(ringsaker, "en")
	expect(actions().map((a) => a.getAttribute("aria-label"))).toEqual([
		"Copy number",
		"Share",
		"Report an error in this listing",
	])
	expect(shortLabels()).toEqual(["Copy number", "Share", "Report"])
})

test("each short label is contained in its accessible name (WCAG 2.5.3), in both languages", () => {
	restoreNavigator = installNavigator({
		share: vi.fn().mockResolvedValue(undefined),
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	})
	for (const lang of ["nb", "en"] as const) {
		const { unmount } = renderBaked(ringsaker, lang)
		for (const a of actions()) {
			const label = a.querySelector(".action-label")?.textContent ?? ""
			expect(a.getAttribute("aria-label")).toContain(label)
		}
		unmount()
	}
})

test("clipboard without share relabels share as Kopier lenke, label and tooltip too", () => {
	restoreNavigator = installNavigator({ clipboard: { writeText: vi.fn() } })
	renderBaked()
	const share = screen.getByRole("button", { name: "Kopier lenke" })
	expect(share.querySelector(".action-label")).toHaveTextContent("Kopier lenke")
	expect(share.querySelector(".action-tip")).toHaveTextContent("Kopier lenke")
})

test("the report action is the existing mailto link, as a link", () => {
	renderBaked()
	const report = screen.getByRole("link", { name: "Meld feil i oppføringen" })
	expect(report).toHaveClass("action-btn")
	expect(report.getAttribute("href")).toMatch(/^mailto:varde\.purely709@passmail\.com\?subject=/)
})

test("a service with no phone has two actions, share and report, and no empty slot", () => {
	restoreNavigator = installNavigator({
		share: vi.fn().mockResolvedValue(undefined),
		clipboard: { writeText: vi.fn() },
	})
	renderBaked({ ...ringsaker, phone: null })
	expect(actions().map((a) => a.getAttribute("aria-label"))).toEqual([
		"Del",
		"Meld feil i oppføringen",
	])
	expect(document.querySelector(".detail-actions")?.children).toHaveLength(2)
})

// Escape hides the tooltips until the pointer or focus comes back (WCAG 1.4.13), as on the acute strip.
test("Escape hides the tooltips; pointer enter or focus brings them back", () => {
	renderBaked()
	const group = document.querySelector(".detail-actions")
	const report = screen.getByRole("link", { name: "Meld feil i oppføringen" })
	expect(group).not.toHaveAttribute("data-tips")
	fireEvent.keyDown(document, { key: "Escape" })
	expect(group).toHaveAttribute("data-tips", "hidden")
	fireEvent.pointerEnter(report)
	expect(group).not.toHaveAttribute("data-tips")
	fireEvent.keyDown(document, { key: "Escape" })
	expect(group).toHaveAttribute("data-tips", "hidden")
	fireEvent.focus(report)
	expect(group).not.toHaveAttribute("data-tips")
})

// Only setTimeout and clearTimeout are fake, so React's scheduler (setImmediate) is untouched and
// vi.getTimerCount() counts this component's timers alone. Nothing here waits with findBy, so no
// real time has to pass. Clicks go through fireEvent, not user-event: user-event's wrapper waits
// on a faked setTimeout(0) that nothing advances outside jest.
function setupTimers() {
	vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] })
}
afterEach(() => {
	vi.useRealTimers()
})

const flush = () => act(async () => {})
const feedbackIn = (el: HTMLElement) => el.querySelector(".action-feedback")
const tipIn = (el: HTMLElement) => el.querySelector(".action-tip")
const click = async (el: HTMLElement) => {
	fireEvent.click(el)
	await flush()
}

test("a copy shows Nummeret er kopiert in place of the tooltip, hidden from screen readers, for 4 seconds", async () => {
	setupTimers()
	restoreNavigator = installNavigator({
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	})
	renderBaked()
	const copy = screen.getByRole("button", { name: "Kopier nummer" })
	await click(copy)
	expect(feedbackIn(copy)).toHaveTextContent("Nummeret er kopiert")
	expect(feedbackIn(copy)).toHaveAttribute("aria-hidden", "true")
	expect(tipIn(copy)).toBeNull()
	// The live region still speaks it, once.
	expect(screen.getAllByText("Nummeret er kopiert", { selector: "[aria-live]" })).toHaveLength(1)
	act(() => vi.advanceTimersByTime(3999))
	expect(feedbackIn(copy)).not.toBeNull()
	act(() => vi.advanceTimersByTime(1))
	expect(feedbackIn(copy)).toBeNull()
	expect(tipIn(copy)).toHaveTextContent("Kopier nummer")
})

test("switching language while the confirmation shows switches the bubble too", async () => {
	setupTimers()
	restoreNavigator = installNavigator({
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	})
	const { rerender } = renderBaked()
	await click(screen.getByRole("button", { name: "Kopier nummer" }))
	rerender(tree(ringsaker, "en"))
	expect(feedbackIn(screen.getByRole("button", { name: "Copy number" }))).toHaveTextContent(
		"Number copied"
	)
})

test("a refused copy shows Kunne ikke kopiere on screen too, then the name tooltip is back", async () => {
	setupTimers()
	restoreNavigator = installNavigator({
		clipboard: {
			writeText: vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError")),
		},
	})
	renderBaked()
	const copy = screen.getByRole("button", { name: "Kopier nummer" })
	await click(copy)
	expect(feedbackIn(copy)).toHaveTextContent("Kunne ikke kopiere")
	expect(tipIn(copy)).toBeNull()
	act(() => vi.advanceTimersByTime(4000))
	expect(feedbackIn(copy)).toBeNull()
	expect(tipIn(copy)).toHaveTextContent("Kopier nummer")
})

test("share by copy shows Lenken er kopiert under the share button", async () => {
	setupTimers()
	restoreNavigator = installNavigator({
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	})
	renderBaked()
	const share = screen.getByRole("button", { name: "Kopier lenke" })
	await click(share)
	expect(feedbackIn(share)).toHaveTextContent("Lenken er kopiert")
})

test("a failed share with a refused clipboard shows Kunne ikke kopiere under the share button", async () => {
	setupTimers()
	restoreNavigator = installNavigator({
		share: vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError")),
		clipboard: {
			writeText: vi.fn().mockRejectedValue(new DOMException("denied", "NotAllowedError")),
		},
	})
	renderBaked()
	const share = screen.getByRole("button", { name: "Del" })
	await click(share)
	expect(feedbackIn(share)).toHaveTextContent("Kunne ikke kopiere")
	expect(tipIn(share)).toBeNull()
})

test("a native share sheet shows nothing: the sheet is the feedback", async () => {
	setupTimers()
	restoreNavigator = installNavigator({ share: vi.fn().mockResolvedValue(undefined) })
	renderBaked()
	await click(screen.getByRole("button", { name: "Del" }))
	expect(document.querySelector(".action-feedback")).toBeNull()
})

test("Escape clears the confirmation early", async () => {
	setupTimers()
	restoreNavigator = installNavigator({
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	})
	renderBaked()
	const copy = screen.getByRole("button", { name: "Kopier nummer" })
	await click(copy)
	expect(feedbackIn(copy)).not.toBeNull()
	fireEvent.keyDown(document, { key: "Escape" })
	expect(feedbackIn(copy)).toBeNull()
	expect(document.querySelector(".detail-actions")).toHaveAttribute("data-tips", "hidden")
})

test("a click on another action clears it, and the report link clears it too", async () => {
	setupTimers()
	restoreNavigator = installNavigator({
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	})
	renderBaked()
	const copy = screen.getByRole("button", { name: "Kopier nummer" })
	const share = screen.getByRole("button", { name: "Kopier lenke" })
	await click(copy)
	await click(share)
	expect(feedbackIn(copy)).toBeNull()
	expect(feedbackIn(share)).toHaveTextContent("Lenken er kopiert")
	// jsdom does not follow a mailto link; a click event is enough to prove the handler.
	fireEvent.click(screen.getByRole("link", { name: "Meld feil i oppføringen" }))
	expect(document.querySelector(".action-feedback")).toBeNull()
})

test("a second click on the same action restarts the 4 seconds", async () => {
	setupTimers()
	restoreNavigator = installNavigator({
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	})
	renderBaked()
	const copy = screen.getByRole("button", { name: "Kopier nummer" })
	await click(copy)
	act(() => vi.advanceTimersByTime(3000))
	await click(copy)
	act(() => vi.advanceTimersByTime(3000))
	expect(feedbackIn(copy)).toHaveTextContent("Nummeret er kopiert")
	act(() => vi.advanceTimersByTime(1000))
	expect(feedbackIn(copy)).toBeNull()
})

test("leaving the page mid-message leaves no timer and logs no error", async () => {
	setupTimers()
	const errors = vi.spyOn(console, "error").mockImplementation(() => {})
	restoreNavigator = installNavigator({
		clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
	})
	const { unmount } = renderBaked()
	await click(screen.getByRole("button", { name: "Kopier nummer" }))
	unmount()
	expect(vi.getTimerCount()).toBe(0)
	act(() => vi.advanceTimersByTime(5000))
	expect(errors).not.toHaveBeenCalled()
	errors.mockRestore()
})

test("leaving the page while the clipboard is still writing starts no timer", async () => {
	setupTimers()
	let finish: () => void = () => {}
	const writeText = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)))
	restoreNavigator = installNavigator({ clipboard: { writeText } })
	const { unmount } = renderBaked()
	fireEvent.click(screen.getByRole("button", { name: "Kopier nummer" }))
	unmount()
	await act(async () => finish())
	expect(vi.getTimerCount()).toBe(0)
})
