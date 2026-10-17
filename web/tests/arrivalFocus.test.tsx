import { act, render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, expect, test, vi } from "vitest"
import { PageHead } from "../src/components/PageHead.tsx"
import { useArrivalFocus } from "../src/hooks/useArrivalFocus.ts"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { ArrivalContext } from "../src/navigation.ts"

afterEach(() => {
	document.title = ""
	vi.restoreAllMocks()
})

function Probe({ arrival, ready }: { arrival: number; ready: boolean }) {
	const { ref } = useArrivalFocus<HTMLHeadingElement>(arrival, ready)
	return ready ? (
		<h1 ref={ref} tabIndex={-1}>
			Heading
		</h1>
	) : (
		<p>loading</p>
	)
}

test("first load never steals focus", () => {
	render(<Probe arrival={0} ready={true} />)
	expect(screen.getByRole("heading")).not.toHaveFocus()
})

test("an arrival focuses the heading once it is ready, and only once", () => {
	const { rerender } = render(<Probe arrival={1} ready={false} />)
	rerender(<Probe arrival={1} ready={true} />)
	expect(screen.getByRole("heading")).toHaveFocus()
	screen.getByRole("heading").blur()
	rerender(<Probe arrival={1} ready={true} />)
	expect(screen.getByRole("heading")).not.toHaveFocus()
})

// Arriving on a page must show the page from its top — the acute strip, header and (on /sok)
// the search box included. Scrolling the heading itself into view put all of that above the
// fold, so a category chip or the "Varde" link appeared to land mid-page. Only the pager
// (requestFocus) wants the results heading pinned to the top, because the pager sits far
// below it and the user just pressed a button down there.
test("an arrival scrolls the window to the top and focuses without a second scroll", () => {
	const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {})
	const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView")
	const { rerender } = render(<Probe arrival={1} ready={false} />)
	rerender(<Probe arrival={1} ready={true} />)
	expect(screen.getByRole("heading")).toHaveFocus()
	expect(scrollTo).toHaveBeenCalledWith({ top: 0 })
	expect(scrollIntoView).not.toHaveBeenCalled()
})

test("requestFocus scrolls the heading itself into view, not the window", () => {
	const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {})
	const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView")
	let request: () => void = () => {}
	function Pager({ ready }: { ready: boolean }) {
		const { ref, requestFocus } = useArrivalFocus<HTMLHeadingElement>(0, ready)
		request = requestFocus
		return ready ? (
			<h2 ref={ref} tabIndex={-1}>
				Results
			</h2>
		) : (
			<p>loading</p>
		)
	}
	const { rerender } = render(<Pager ready={true} />)
	act(() => request())
	rerender(<Pager ready={false} />)
	rerender(<Pager ready={true} />)
	expect(scrollIntoView).toHaveBeenCalledWith({ block: "start" })
	expect(scrollTo).not.toHaveBeenCalled()
})

test("requestFocus moves focus on the next ready render", () => {
	let request: () => void = () => {}
	function Pager({ ready }: { ready: boolean }) {
		const { ref, requestFocus } = useArrivalFocus<HTMLHeadingElement>(0, ready)
		request = requestFocus
		return ready ? (
			<h2 ref={ref} tabIndex={-1}>
				Results
			</h2>
		) : (
			<p>loading</p>
		)
	}
	const { rerender } = render(<Pager ready={true} />)
	act(() => request())
	rerender(<Pager ready={false} />)
	rerender(<Pager ready={true} />)
	expect(screen.getByRole("heading")).toHaveFocus()
})

test("a request that settles without becoming ready clears pending; a later unrelated ready render does not steal focus", () => {
	let request: () => void = () => {}
	function Pager({ ready, settled }: { ready: boolean; settled: boolean }) {
		const { ref, requestFocus } = useArrivalFocus<HTMLHeadingElement>(0, ready, settled)
		request = requestFocus
		return ready ? (
			<h2 ref={ref} tabIndex={-1}>
				Results
			</h2>
		) : (
			<p>loading</p>
		)
	}
	const { rerender } = render(<Pager ready={true} settled={true} />)
	act(() => request())
	// The request the pager triggered settles into an error (or an empty result) — it never
	// becomes ready, but it does settle. The pending flag must not survive that.
	rerender(<Pager ready={false} settled={true} />)
	// A later, unrelated load starts (e.g. the user typing a new search) and becomes ready.
	rerender(<Pager ready={false} settled={false} />)
	rerender(<Pager ready={true} settled={true} />)
	expect(screen.getByRole("heading")).not.toHaveFocus()
})

test("PageHead sets and updates the title", () => {
	const { rerender } = render(
		<LanguageProvider lang="nb">
			<PageHead title="Søk – Varde" description="d" path="/sok" />
		</LanguageProvider>
	)
	expect(document.title).toBe("Søk – Varde")
	rerender(
		<LanguageProvider lang="nb">
			<PageHead title="Varde" description="d" path="/sok" />
		</LanguageProvider>
	)
	expect(document.title).toBe("Varde")
})

function ReturnProbe({
	arrival,
	ready,
	via = "traverse",
	restore = 0,
	token,
	children,
}: {
	arrival: number
	ready: boolean
	via?: "push" | "traverse"
	restore?: number
	token?: unknown
	children?: ReactNode
}) {
	return (
		<ArrivalContext.Provider value={{ via, restore }}>
			<ReturnPage arrival={arrival} ready={ready} token={token}>
				{children}
			</ReturnPage>
		</ArrivalContext.Provider>
	)
}

function ReturnPage({
	arrival,
	ready,
	token,
	children,
}: {
	arrival: number
	ready: boolean
	token?: unknown
	children?: ReactNode
}) {
	// No token given means the default (token === settled): a page with no content of its own
	// that changes on the same route.
	const { ref } = useArrivalFocus<HTMLHeadingElement>(arrival, ready, ready, token ?? ready)
	return (
		<>
			<h1 ref={ref} tabIndex={-1}>
				Treff
			</h1>
			{children}
		</>
	)
}

test("Back to another route scrolls to the saved spot and focuses the followed link", () => {
	const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {})
	window.history.replaceState({ idx: 0, scrollY: 480, href: "/resources/12" }, "", "/sok")
	render(
		<ReturnProbe arrival={1} ready={true}>
			<a href="/resources/12">NAV Hamar</a>
		</ReturnProbe>
	)
	expect(screen.getByRole("link", { name: "NAV Hamar" })).toHaveFocus()
	expect(scrollTo).toHaveBeenCalledWith({ top: 480, behavior: "instant" })
})

// The second press stays on the same route as the first lands on, so `arrival` does not move:
// the pending return must read the entry it ends on, not the one current when it was set.
test("the values are read when the page is ready, so two quick presses restore the last entry", () => {
	const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {})
	const links = (
		<>
			<a href="/resources/1">Første</a>
			<a href="/resources/2">Andre</a>
		</>
	)
	window.history.replaceState({ idx: 1, scrollY: 100, href: "/resources/1" }, "", "/sok")
	const { rerender } = render(
		<ReturnProbe arrival={2} ready={false}>
			{links}
		</ReturnProbe>
	)
	window.history.replaceState({ idx: 0, scrollY: 900, href: "/resources/2" }, "", "/sok")
	rerender(
		<ReturnProbe arrival={2} ready={true}>
			{links}
		</ReturnProbe>
	)
	expect(screen.getByRole("link", { name: "Andre" })).toHaveFocus()
	expect(scrollTo).toHaveBeenLastCalledWith({ top: 900, behavior: "instant" })
})

test("Back with no saved link, or a link inside a closed menu, arrives at the top and the heading", () => {
	const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {})
	window.history.replaceState({ idx: 0, scrollY: 480, href: "/resources/12" }, "", "/")
	render(
		<ReturnProbe arrival={1} ready={true}>
			<div hidden>
				<a href="/resources/12">I menyen</a>
			</div>
		</ReturnProbe>
	)
	expect(screen.getByRole("heading")).toHaveFocus()
	expect(scrollTo).toHaveBeenCalledWith({ top: 0 })
})

test("a new navigation (push) keeps today's arrival even when the entry has a saved link", () => {
	vi.spyOn(window, "scrollTo").mockImplementation(() => {})
	window.history.replaceState({ idx: 1, scrollY: 480, href: "/resources/12" }, "", "/sok")
	render(
		<ReturnProbe arrival={1} ready={true} via="push">
			<a href="/resources/12">NAV Hamar</a>
		</ReturnProbe>
	)
	expect(screen.getByRole("heading")).toHaveFocus()
})

test("a same-route restore on a page without its own token scrolls at once", () => {
	const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {})
	window.history.replaceState({ idx: 0, scrollY: 700 }, "", "/om")
	const { rerender } = render(<ReturnProbe arrival={0} ready={true} restore={0} />)
	expect(scrollTo).not.toHaveBeenCalled()
	rerender(<ReturnProbe arrival={0} ready={true} restore={1} />)
	expect(scrollTo).toHaveBeenCalledWith({ top: 700, behavior: "instant" })
	expect(screen.getByRole("heading")).not.toHaveFocus()
})

test("a same-route restore on a page with a token waits for that page's next answer", () => {
	const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {})
	window.history.replaceState({ idx: 0, scrollY: 700 }, "", "/sok")
	const first = { page: 1 }
	const { rerender } = render(<ReturnProbe arrival={0} ready={true} restore={0} token={first} />)
	rerender(<ReturnProbe arrival={0} ready={true} restore={1} token={first} />)
	expect(scrollTo).not.toHaveBeenCalled()
	rerender(<ReturnProbe arrival={0} ready={true} restore={1} token={{ page: 2 }} />)
	expect(scrollTo).toHaveBeenCalledWith({ top: 700, behavior: "instant" })
})

test("a page mounted after earlier restores does not replay them", () => {
	const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {})
	window.history.replaceState({ idx: 0, scrollY: 700 }, "", "/om")
	render(<ReturnProbe arrival={0} ready={true} restore={3} />)
	expect(scrollTo).not.toHaveBeenCalled()
})
