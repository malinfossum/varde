import { type RefObject, useEffect, useRef } from "react"

// Moves focus to a page's heading after a route change (arrival > 0) once the page is ready,
// and on demand (requestFocus) for the pager. Scroll first, then focus without a second
// scroll: focus() alone centres the element in Chromium.
export function useArrivalFocus<T extends HTMLElement>(
	arrival: number,
	ready: boolean
): { ref: RefObject<T | null>; requestFocus: () => void } {
	const ref = useRef<T>(null)
	const pending = useRef(false)

	useEffect(() => {
		if (arrival > 0) pending.current = true
	}, [arrival])

	// arrival isn't read in the body, but a page that's ready from its very first render (the
	// landing placeholder, NotFoundState) never toggles `ready` — without arrival as a trigger
	// too, a later arrival on such a page would set `pending` and nothing would ever consume it.
	// biome-ignore lint/correctness/useExhaustiveDependencies: arrival is a deliberate trigger
	useEffect(() => {
		if (!pending.current || !ready || !ref.current) return
		pending.current = false
		ref.current.scrollIntoView({ block: "start" })
		ref.current.focus({ preventScroll: true })
	}, [ready, arrival])

	return {
		ref,
		requestFocus: () => {
			pending.current = true
		},
	}
}
