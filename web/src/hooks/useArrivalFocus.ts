import { type RefObject, useEffect, useRef } from "react"

// Moves focus to a page's heading after a route change (arrival > 0) once the page is ready,
// and on demand (requestFocus) for the pager. Scroll first, then focus without a second
// scroll: focus() alone centres the element in Chromium.
//
// `settled` (defaults to `ready`) must go true whenever the consumer's request finishes, ready
// or not. Without that distinction a `pending` flag set by an arrival or a requestFocus() call
// would survive an error or an empty result forever, waiting for the next `ready` render to
// consume it — and that next `ready` render can be a later, unrelated load (say, the user
// typing a new search after a retry), which would then steal focus out from under them.
//
// `token` (defaults to `settled`) is what the second effect actually keys its re-run on. A
// request answered from an already-settled cache (services/data.ts's peekIndex) can leave
// `ready`/`settled` at the exact same value across the whole request — a page-2 click never
// passes through "loading" when the index is already in memory — so requestFocus() would have
// nothing left to re-trigger the effect with. Passing the freshly computed result object as
// `token` gives every distinct answer its own identity even when its ready/settled booleans
// don't change; a caller that never has this problem can leave it out.
export function useArrivalFocus<T extends HTMLElement>(
	arrival: number,
	ready: boolean,
	settled: boolean = ready,
	token: unknown = settled
): { ref: RefObject<T | null>; requestFocus: () => void } {
	const ref = useRef<T>(null)
	const pending = useRef(false)

	useEffect(() => {
		if (arrival > 0) pending.current = true
	}, [arrival])

	// arrival isn't read in the body, but a page that's ready from its very first render (the
	// landing placeholder, NotFoundState) never toggles `ready` — without arrival as a trigger
	// too, a later arrival on such a page would set `pending` and nothing would ever consume it.
	// biome-ignore lint/correctness/useExhaustiveDependencies: arrival and token are deliberate triggers
	useEffect(() => {
		if (!pending.current || !settled) return
		pending.current = false
		if (!ready || !ref.current) return
		ref.current.scrollIntoView({ block: "start" })
		ref.current.focus({ preventScroll: true })
	}, [ready, settled, arrival, token])

	return {
		ref,
		requestFocus: () => {
			pending.current = true
		},
	}
}
