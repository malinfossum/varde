import { render, screen } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import {
	findVisibleLink,
	notePress,
	restoreSameRoute,
	returnToLink,
	takePressed,
} from "../src/services/returnFocus.ts"

afterEach(() => {
	vi.restoreAllMocks()
	takePressed()
})

const scrollSpy = () => vi.spyOn(window, "scrollTo").mockImplementation(() => {})

test("a saved href with a quote and a bracket is matched without an error", () => {
	const href = '/sok?search=a"b]c'
	render(<a href={href}>Treff</a>)
	expect(findVisibleLink(href)).toBe(screen.getByRole("link", { name: "Treff" }))
})

test("a hidden link never matches; the first visible one with the same href does", () => {
	render(
		<>
			<div hidden>
				<a href="/resources/12">I menyen</a>
			</div>
			<a href="/resources/12">I listen</a>
		</>
	)
	expect(findVisibleLink("/resources/12")?.textContent).toBe("I listen")
	expect(findVisibleLink("/resources/99")).toBeNull()
})

test("returnToLink scrolls to the saved spot, then focuses the link without a second scroll", () => {
	const scrollTo = scrollSpy()
	render(<a href="/resources/12">NAV Hamar</a>)
	const link = screen.getByRole("link")
	const focus = vi.spyOn(link, "focus")
	expect(returnToLink({ idx: 0, scrollY: 480, href: "/resources/12" })).toBe(true)
	expect(scrollTo).toHaveBeenCalledWith({ top: 480, behavior: "instant" })
	expect(focus).toHaveBeenCalledWith({ preventScroll: true })
	expect(link).toHaveFocus()
})

test("returnToLink does nothing without a saved href or a visible match", () => {
	const scrollTo = scrollSpy()
	render(
		<div hidden>
			<a href="/resources/12">I menyen</a>
		</div>
	)
	expect(returnToLink({ idx: 0, scrollY: 480 })).toBe(false)
	expect(returnToLink({ idx: 0, scrollY: 480, href: "/resources/12" })).toBe(false)
	expect(scrollTo).not.toHaveBeenCalled()
})

test("a same-route restore scrolls to the saved spot and leaves focus where it is", () => {
	const scrollTo = scrollSpy()
	render(
		<>
			<h1 tabIndex={-1}>Treff</h1>
			<input aria-label="Søk" />
		</>
	)
	screen.getByRole("textbox").focus()
	restoreSameRoute({ idx: 1, scrollY: 900 }, screen.getByRole("heading"), null)
	expect(scrollTo).toHaveBeenCalledWith({ top: 900, behavior: "instant" })
	expect(screen.getByRole("textbox")).toHaveFocus()
})

test("a same-route restore without a saved spot does not scroll", () => {
	const scrollTo = scrollSpy()
	restoreSameRoute({ idx: 1 }, null, null)
	expect(scrollTo).not.toHaveBeenCalled()
})

test("focus on a history button that is now disabled moves to the heading without scrolling", () => {
	scrollSpy()
	render(
		<>
			<h1 tabIndex={-1}>Treff</h1>
			<button type="button">Tilbake</button>
		</>
	)
	const button = screen.getByRole("button") as HTMLButtonElement
	button.focus()
	notePress(button)
	button.disabled = true
	const heading = screen.getByRole("heading")
	const focus = vi.spyOn(heading, "focus")
	restoreSameRoute({ idx: 0 }, heading, takePressed())
	expect(focus).toHaveBeenCalledWith({ preventScroll: true })
})

test("Chromium has already moved focus to <body>: the heading still gets it", () => {
	scrollSpy()
	render(
		<>
			<h1 tabIndex={-1}>Treff</h1>
			<button type="button">Tilbake</button>
		</>
	)
	const button = screen.getByRole("button") as HTMLButtonElement
	notePress(button)
	button.disabled = true
	restoreSameRoute({ idx: 0 }, screen.getByRole("heading"), takePressed())
	expect(screen.getByRole("heading")).toHaveFocus()
})

test("a pressed button that is still enabled keeps its focus", () => {
	scrollSpy()
	render(
		<>
			<h1 tabIndex={-1}>Treff</h1>
			<button type="button">Fremover</button>
		</>
	)
	const button = screen.getByRole("button") as HTMLButtonElement
	button.focus()
	notePress(button)
	restoreSameRoute({ idx: 1 }, screen.getByRole("heading"), takePressed())
	expect(button).toHaveFocus()
})

test("without checkVisibility (Safari before 17.4) a link with no layout box is skipped", () => {
	const original = Element.prototype.checkVisibility
	// @ts-expect-error: the property is removed on purpose and put back below
	Element.prototype.checkVisibility = undefined
	try {
		render(
			<>
				<a href="/resources/12">I menyen</a>
				<a href="/resources/12">I listen</a>
			</>
		)
		const hidden = screen.getByRole("link", { name: "I menyen" })
		const shown = screen.getByRole("link", { name: "I listen" })
		// jsdom has no layout: give each link the rects a browser would.
		hidden.getClientRects = () => [] as unknown as DOMRectList
		shown.getClientRects = () => [new DOMRect(0, 0, 10, 10)] as unknown as DOMRectList
		expect(findVisibleLink("/resources/12")).toBe(shown)
	} finally {
		Element.prototype.checkVisibility = original
	}
})
