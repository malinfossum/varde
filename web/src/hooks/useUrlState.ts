import { useCallback, useEffect, useState } from "react"
import {
	type ArrivalVia,
	type HistoryEvents,
	type NavigateOptions,
	useCurrentUrl,
} from "../navigation.ts"
import { createHistoryCounter } from "../services/historyCounter.ts"
import { mergeEntry, readEntry } from "../services/historyEntry.ts"
import {
	type Filters,
	type Lang,
	parseFilters,
	parseUrl,
	pathFor,
	type Route,
} from "../services/urlState.ts"

type UrlState = {
	lang: Lang
	route: Route
	filters: Filters
	arrival: number
	via: ArrivalVia
	restore: number
}

function sameRoute(a: Route, b: Route): boolean {
	if (a.kind !== b.kind) return false
	if (a.kind === "detail" && b.kind === "detail") return a.id === b.id
	if (a.kind === "kommune" && b.kind === "kommune") return a.slug === b.slug
	return true
}

function read(pathname: string, search: string): Omit<UrlState, "arrival" | "via" | "restore"> {
	return { ...parseUrl(pathname), filters: parseFilters(new URLSearchParams(search)) }
}

export function useUrlState() {
	const initialUrl = useCurrentUrl()
	const [state, setState] = useState<UrlState>(() => ({
		...read(initialUrl.pathname, initialUrl.search),
		arrival: 0,
		via: "push",
		restore: 0,
	}))

	// One per app. The history buttons subscribe here, because pushState fires no event.
	const [historyEvents] = useState(() => {
		const listeners = new Set<() => void>()
		const events: HistoryEvents & { notify(): void } = {
			counter: createHistoryCounter(),
			subscribe(listener) {
				listeners.add(listener)
				return () => {
					listeners.delete(listener)
				}
			},
			notify() {
				for (const listener of listeners) listener()
			},
		}
		return events
	})

	// `arrival` counts route changes (not filter changes on the same route). Pages use it to
	// move focus to their heading; the first load stays 0 so the browser's own focus is kept.
	// `via` says whether the change was a push or Back/Forward, and `restore` counts Back/Forward
	// that stayed on the same route (spec: Focus and scroll).
	const sync = useCallback((via: ArrivalVia) => {
		setState((prev) => {
			const next = read(window.location.pathname, window.location.search)
			const same = sameRoute(prev.route, next.route)
			return {
				...next,
				via,
				arrival: same ? prev.arrival : prev.arrival + 1,
				restore: same && via === "traverse" ? prev.restore + 1 : prev.restore,
			}
		})
	}, [])

	useEffect(() => {
		// useArrivalFocus restores the scroll when the page is ready; the browser's own restore
		// would land earlier, on a page that is still loading.
		// That holds only while the page runs. A reload or a return from another document is the
		// browser's again, so a browser tab keeps its place as it did before.
		const toManual = () => {
			window.history.scrollRestoration = "manual"
		}
		const toAuto = () => {
			window.history.scrollRestoration = "auto"
		}
		toManual()
		// A same-page fragment link (the skip link, "Meld feil" on /om) makes a new entry without
		// the router. Saving the spot on the entry it leaves lets Back scroll there again.
		const onClick = (event: MouseEvent) => {
			const link = event.target instanceof Element ? event.target.closest("a[href]") : null
			if (!(link instanceof HTMLAnchorElement)) return
			const url = new URL(link.href)
			const here = window.location
			if (url.hash === "" || url.origin !== here.origin) return
			if (url.pathname !== here.pathname || url.search !== here.search) return
			window.history.replaceState(mergeEntry(window.history.state, { scrollY: window.scrollY }), "")
		}
		const { counter } = historyEvents
		// A page load without router state counts as the first entry (spec: Knowing what is behind
		// and ahead). The merge keeps a `from` an older Varde wrote.
		const loaded = readEntry(window.history.state)
		if (loaded.idx === undefined) {
			window.history.replaceState(mergeEntry(window.history.state, { idx: 0 }), "")
		}
		counter.arrive(loaded.idx ?? 0)
		// React runs a child's effects before this one, so the buttons have already read the
		// counter before it knew this entry. After a reload at idx 2, Back must not stay off.
		historyEvents.notify()

		// A fragment link (the skip link, /om#meld-feil) makes a new entry with no state. It gets
		// the next idx, as a push would; an entry the router wrote is simply arrived at.
		const adopt = () => {
			const { idx } = readEntry(window.history.state)
			if (idx === undefined) {
				window.history.replaceState(mergeEntry(window.history.state, { idx: counter.push() }), "")
			} else counter.arrive(idx)
		}
		const onPopState = () => {
			adopt()
			sync("traverse")
			historyEvents.notify()
		}
		const onHashChange = () => {
			adopt()
			historyEvents.notify()
		}
		window.addEventListener("popstate", onPopState)
		window.addEventListener("hashchange", onHashChange)
		window.addEventListener("pagehide", toAuto)
		window.addEventListener("pageshow", toManual)
		document.addEventListener("click", onClick, true)
		return () => {
			window.removeEventListener("popstate", onPopState)
			window.removeEventListener("hashchange", onHashChange)
			window.removeEventListener("pagehide", toAuto)
			window.removeEventListener("pageshow", toManual)
			document.removeEventListener("click", onClick, true)
		}
	}, [sync, historyEvents])

	const navigate = useCallback(
		(path: string, search: string, options?: NavigateOptions) => {
			const { lang: current, route: currentRoute } = parseUrl(window.location.pathname)
			const target = `${pathFor(options?.lang ?? current, path)}${search}`
			// The detail page's "back to results" needs to know it came from /sok: the site sends
			// no referrer and pushState never sets one, so the fact travels in history state.
			const leavingResults = currentRoute.kind === "list" && path !== "/sok"
			const from = leavingResults ? "sok" : undefined
			if (options?.replace) {
				window.history.replaceState(mergeEntry(window.history.state, { from }), "", target)
			} else {
				// Where you were and the link you followed, saved on the entry you leave, so Back can
				// bring you to the same spot (spec: Focus and scroll).
				window.history.replaceState(
					mergeEntry(window.history.state, { scrollY: window.scrollY, href: options?.href }),
					""
				)
				window.history.pushState(
					mergeEntry(null, { from, idx: historyEvents.counter.push() }),
					"",
					target
				)
			}
			sync("push")
			historyEvents.notify()
		},
		[sync, historyEvents]
	)

	return { ...state, navigate, historyEvents }
}
