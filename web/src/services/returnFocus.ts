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

// Each link's href attribute is compared with the saved string. It is never built into a CSS
// selector, so a quote or bracket in a search URL cannot break the lookup. A link inside a
// closed Meny or picker is not visible and never matches.
export function findVisibleLink(
	href: string,
	root: ParentNode = document
): HTMLAnchorElement | null {
	for (const link of root.querySelectorAll<HTMLAnchorElement>("a[href]")) {
		if (link.getAttribute("href") === href && link.checkVisibility()) return link
	}
	return null
}

// Back or Forward to another route. Scroll first, then focus without a second scroll. Returns
// false when there is no saved link or no visible match, and the caller falls back to the
// ordinary arrival: top of the page, focus on the heading.
export function returnToLink(state: unknown): boolean {
	const { href, scrollY } = readEntry(state)
	if (href === undefined) return false
	const link = findVisibleLink(href)
	if (!link) return false
	window.scrollTo({ top: scrollY ?? 0, behavior: "instant" })
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
