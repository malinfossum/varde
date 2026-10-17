import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { renderToString } from "react-dom/server"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { HistoryButtons } from "../src/components/HistoryButtons.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { type HistoryEvents, HistoryEventsContext, NavigationContext } from "../src/navigation.ts"
import { createHistoryCounter } from "../src/services/historyCounter.ts"
import type { Lang } from "../src/services/urlState.ts"
import { makeResource, stubDataFiles } from "./stubData.ts"

afterEach(() => {
	vi.restoreAllMocks()
	vi.unstubAllGlobals()
	Reflect.deleteProperty(window, "navigation")
	window.history.replaceState(null, "", "/")
	document.documentElement.style.removeProperty("--history-bar-h")
})

function fakeEvents() {
	const listeners = new Set<() => void>()
	const events: HistoryEvents = {
		counter: createHistoryCounter(),
		subscribe(listener) {
			listeners.add(listener)
			return () => listeners.delete(listener)
		},
	}
	const notify = () =>
		act(() => {
			for (const listener of listeners) listener()
		})
	return { events, notify }
}

// A Navigation API stand-in: an EventTarget with the two flags the buttons read.
function fakeNavigation(canGoBack: boolean, canGoForward: boolean) {
	const nav = Object.assign(new EventTarget(), { canGoBack, canGoForward })
	Object.defineProperty(window, "navigation", { value: nav, configurable: true })
	return nav
}

function renderButtons({
	layout = "bar" as "bar" | "icons",
	atLanding = false,
	lang = "nb" as Lang,
	navigate = vi.fn(),
	events = fakeEvents().events,
} = {}) {
	const view = render(
		<LanguageProvider lang={lang}>
			<NavigationContext.Provider value={navigate}>
				<HistoryEventsContext.Provider value={events}>
					<HistoryButtons layout={layout} atLanding={atLanding} />
				</HistoryEventsContext.Provider>
			</NavigationContext.Provider>
		</LanguageProvider>
	)
	const nav = within(screen.getByRole("navigation"))
	return {
		...view,
		navigate,
		back: () => nav.getByRole("button", { name: lang === "nb" ? "Tilbake" : "Back" }),
		forward: () => nav.getByRole("button", { name: lang === "nb" ? "Fremover" : "Forward" }),
	}
}

test("both buttons are disabled in the server render, so hydration matches", () => {
	const html = renderToString(
		<LanguageProvider lang="nb">
			<HistoryButtons layout="bar" atLanding={false} />
		</LanguageProvider>
	)
	expect(html.match(/<button[^>]*disabled=""/g)).toHaveLength(2)
})

test("names and the nav label in nb and en, arrows only", () => {
	for (const [lang, label, back, forward] of [
		["nb", "Sidehistorikk", "Tilbake", "Fremover"],
		["en", "Page history", "Back", "Forward"],
	] as const) {
		const { unmount } = renderButtons({ lang, layout: "icons" })
		const nav = screen.getByRole("navigation", { name: label })
		expect(within(nav).getByRole("button", { name: back })).toBeInTheDocument()
		expect(within(nav).getByRole("button", { name: forward })).toBeInTheDocument()
		for (const button of within(nav).getAllByRole("button")) {
			expect(button.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
			expect(button.querySelector(".visually-hidden")).not.toBeNull()
		}
		unmount()
	}
})

test("only the icons have tooltips, hidden from screen readers", () => {
	const { unmount } = renderButtons({ layout: "icons" })
	expect(document.querySelectorAll(".history-tip")).toHaveLength(2)
	for (const tip of document.querySelectorAll(".history-tip")) {
		expect(tip).toHaveAttribute("aria-hidden", "true")
	}
	unmount()
	renderButtons({ layout: "bar" })
	expect(document.querySelector(".history-tip")).toBeNull()
})

test("with the Navigation API, canGoBack and canGoForward drive disabled", () => {
	const nav = fakeNavigation(true, false)
	const { back, forward } = renderButtons()
	expect(back()).toBeEnabled()
	expect(forward()).toBeDisabled()
	nav.canGoForward = true
	act(() => {
		nav.dispatchEvent(new Event("currententrychange"))
	})
	expect(forward()).toBeEnabled()
	nav.canGoBack = false
	nav.canGoForward = false
	act(() => {
		window.dispatchEvent(new Event("pageshow"))
	})
	expect(forward()).toBeDisabled() // only the pageshow re-read can have changed this
	expect(back()).toBeEnabled() // not the landing page: Back can still go home
})

test("without the API the router's counter drives disabled, refreshed on each notice", () => {
	const { events, notify } = fakeEvents()
	const { back, forward } = renderButtons({ atLanding: true, events })
	expect(back()).toBeDisabled()
	expect(forward()).toBeDisabled()
	events.counter.push()
	notify()
	expect(back()).toBeEnabled()
	events.counter.arrive(0)
	notify()
	expect(back()).toBeDisabled()
	expect(forward()).toBeEnabled()
})

test("Back with an entry behind calls history.back; Forward calls history.forward", () => {
	fakeNavigation(true, true)
	const historyBack = vi.spyOn(window.history, "back").mockImplementation(() => {})
	const historyForward = vi.spyOn(window.history, "forward").mockImplementation(() => {})
	const { back, forward, navigate } = renderButtons()
	fireEvent.click(back())
	fireEvent.click(forward())
	expect(historyBack).toHaveBeenCalledTimes(1)
	expect(historyForward).toHaveBeenCalledTimes(1)
	expect(navigate).not.toHaveBeenCalled()
})

test("Back on a first load goes home through the router; on the landing page it is disabled", () => {
	fakeNavigation(false, false)
	const historyBack = vi.spyOn(window.history, "back").mockImplementation(() => {})
	const first = renderButtons({ atLanding: false })
	fireEvent.click(first.back())
	expect(first.navigate).toHaveBeenCalledWith("/", "")
	expect(historyBack).not.toHaveBeenCalled()
	first.unmount()
	expect(renderButtons({ atLanding: true }).back()).toBeDisabled()
})

test("the bar writes its real height to --history-bar-h and removes it when it goes", () => {
	let report: () => void = () => {}
	vi.stubGlobal(
		"ResizeObserver",
		class {
			constructor(callback: () => void) {
				report = callback
			}
			observe() {}
			disconnect() {}
		}
	)
	const { unmount } = renderButtons({ layout: "bar" })
	const bar = document.querySelector(".history-bar") as HTMLElement
	vi.spyOn(bar, "getBoundingClientRect").mockReturnValue({ height: 122 } as DOMRect)
	act(() => report())
	expect(document.documentElement.style.getPropertyValue("--history-bar-h")).toBe("122px")
	unmount()
	expect(document.documentElement.style.getPropertyValue("--history-bar-h")).toBe("")
})

test("Escape hides the icon tooltips until focus lands on a button again", () => {
	fakeNavigation(true, true)
	const { back } = renderButtons({ layout: "icons" })
	const nav = document.querySelector(".history-icons") as HTMLElement
	fireEvent.keyDown(document, { key: "Escape" })
	expect(nav).toHaveAttribute("data-tips", "hidden")
	fireEvent.focus(back())
	expect(nav).not.toHaveAttribute("data-tips")
})

// React runs the buttons' first read before the router's own mount effect has set the counter,
// so the router has to tell them once it has.
test("after a reload at idx 2 without the Navigation API, Back on the landing page is enabled", async () => {
	vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise(() => {}))
	window.history.replaceState({ idx: 2 }, "", "/")
	render(<App />)
	const backs = screen.getAllByRole("button", { name: "Tilbake" })
	expect(backs).toHaveLength(2)
	for (const back of backs) await waitFor(() => expect(back).toBeEnabled())
	for (const forward of screen.getAllByRole("button", { name: "Fremover" })) {
		expect(forward).toBeDisabled()
	}
})

// Chromium blurs a focused button to <body> when it becomes disabled. The arrival-focus restore
// must see the button already disabled, so focus lands on the heading and not on <body>.
test("Forward onto the last entry disables itself in the same render that restores focus", async () => {
	vi.spyOn(globalThis, "fetch").mockImplementation(() => new Promise(() => {}))
	window.history.replaceState(null, "", "/om")
	render(<App />)
	await screen.findByRole("heading", { level: 1 })
	const [, forward] = screen.getAllByRole("button", { name: "Fremover" })
	if (!forward) throw new Error("missing Forward button")
	// A fragment link makes a second entry on the same route; Back then leaves it ahead.
	fireEvent.click(screen.getByRole("link", { name: "Hopp til innhold" }))
	await waitFor(() => expect(window.location.hash).toBe("#main"))
	act(() => window.history.back())
	await waitFor(() => expect(window.location.hash).toBe(""))
	await waitFor(() => expect(forward).toBeEnabled())
	forward.focus()
	fireEvent.click(forward)
	await waitFor(() => expect(forward).toBeDisabled())
	await waitFor(() => expect(screen.getByRole("heading", { level: 1 })).toHaveFocus())
	expect(document.body).not.toHaveFocus()
})

// The same blur on /sok when the entry ahead has no results: the empty state's heading is the
// page heading then, so focus lands there and not on <body>.
test("Forward onto a /sok entry with zero results moves focus to the empty state's heading", async () => {
	stubDataFiles({ resources: [makeResource({ id: 1, name: "NAV Hamar", isNational: false })] })
	window.history.replaceState(null, "", "/sok")
	render(<App />)
	await screen.findByRole("heading", { level: 1, name: "1 treff" })
	const [, forward] = screen.getAllByRole("button", { name: "Fremover" })
	if (!forward) throw new Error("missing Forward button")
	// Only national services: a pushed entry on the same route with no results.
	fireEvent.click(screen.getByRole("button", { name: "Nasjonale tjenester" }))
	await screen.findByRole("heading", { level: 1, name: "Ingen treff" })
	act(() => window.history.back())
	await screen.findByRole("heading", { level: 1, name: "1 treff" })
	await waitFor(() => expect(forward).toBeEnabled())
	forward.focus()
	fireEvent.click(forward)
	await waitFor(() => expect(forward).toBeDisabled())
	const heading = await screen.findByRole("heading", { level: 1, name: "Ingen treff" })
	await waitFor(() => expect(heading).toHaveFocus())
	expect(document.body).not.toHaveFocus()
})
