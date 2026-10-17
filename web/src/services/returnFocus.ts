import { readEntry } from "./historyEntry.ts"

// The history button pressed last. A same-route Back or Forward can disable the very button
// that has focus; Chromium then moves focus to <body> a moment later (probed 2026-10-16). Only
// in that case does focus move to the heading (spec: Focus and scroll).
let pressed: HTMLButtonElement | null = null

export function notePress(button: HTMLButtonElement): void {
	pressed = button
}

export function takePressed(): HTMLButtonElement | null {
	const button = pressed
	pressed = null
	return button
}

// Safari before 17.4 has no checkVisibility. A link with no layout box (inside a closed <details>
// or a display: none menu) has no client rects, which is the same answer.
function isVisible(element: Element): boolean {
	return element.checkVisibility?.() ?? element.getClientRects().length > 0
}

// Each link's href attribute is compared with the saved string. It is never built into a CSS
// selector, so a quote or bracket in a search URL cannot break the lookup. A link inside a
// closed Meny or picker is not visible and never matches.
export function findVisibleLink(
	href: string,
	root: ParentNode = document,
	accept: (link: HTMLAnchorElement) => boolean = () => true
): HTMLAnchorElement | null {
	for (const link of root.querySelectorAll<HTMLAnchorElement>("a[href]")) {
		if (link.getAttribute("href") === href && isVisible(link) && accept(link)) return link
	}
	return null
}

// Edges count as inside, so a link that just touches the viewport still qualifies.
function inViewport(element: Element): boolean {
	const box = element.getBoundingClientRect()
	return (
		box.bottom >= 0 &&
		box.top <= window.innerHeight &&
		box.right >= 0 &&
		box.left <= window.innerWidth
	)
}

// Back or Forward to another route. Scroll first, then focus without a second scroll. Only a
// match inside the viewport after the scroll counts: the same href can also sit in the footer,
// far below the restored spot, and focus there would leave a screen reader somewhere else.
// Returns false when there is no saved link or no such match, and the caller falls back to the
// ordinary arrival: top of the page, focus on the heading.
export function returnToLink(state: unknown): boolean {
	const { href, scrollY } = readEntry(state)
	if (href === undefined || !findVisibleLink(href)) return false
	window.scrollTo({ top: scrollY ?? 0, behavior: "instant" })
	const link = findVisibleLink(href, document, inViewport)
	if (!link) return false
	link.focus({ preventScroll: true })
	return true
}

// Back or Forward on the same route (a filter change on /sok). The scroll comes back; focus
// stays, unless it was on a history button that has just become disabled.
export function restoreSameRoute(
	state: unknown,
	heading: HTMLElement | null,
	pressedButton: HTMLButtonElement | null
): void {
	const { scrollY } = readEntry(state)
	if (scrollY !== undefined) window.scrollTo({ top: scrollY, behavior: "instant" })
	if (!pressedButton?.disabled || !heading) return
	const active = document.activeElement
	if (active === pressedButton || active === document.body || active === null) {
		heading.focus({ preventScroll: true })
	}
}
