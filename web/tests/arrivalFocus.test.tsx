import { act, render, screen } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { PageHead } from "../src/components/PageHead.tsx"
import { useArrivalFocus } from "../src/hooks/useArrivalFocus.ts"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"

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
