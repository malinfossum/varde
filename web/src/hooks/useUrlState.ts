import { useCallback, useEffect, useState } from "react"
import {
	type Filters,
	isLegacyListUrl,
	parseFilters,
	parseRoute,
	type Route,
} from "../services/urlState.ts"

type UrlState = { route: Route; filters: Filters; langParam: string | null; arrival: number }

function sameRoute(a: Route, b: Route): boolean {
	if (a.kind !== b.kind) return false
	return a.kind !== "detail" || b.kind !== "detail" || a.id === b.id
}

function read(): Omit<UrlState, "arrival"> {
	const params = new URLSearchParams(window.location.search)
	// Bookmarked /?search=… from before the landing existed: rewrite in place, no history entry.
	if (isLegacyListUrl(window.location.pathname, params)) {
		window.history.replaceState(window.history.state, "", `/sok${window.location.search}`)
	}
	return {
		route: parseRoute(window.location.pathname),
		filters: parseFilters(params),
		langParam: params.get("lang"),
	}
}

export function useUrlState() {
	const [state, setState] = useState<UrlState>(() => ({ ...read(), arrival: 0 }))

	// `arrival` counts route changes (not filter changes on the same route). Pages use it to
	// move focus to their heading; the first load stays 0 so the browser's own focus is kept.
	const sync = useCallback(() => {
		setState((prev) => {
			const next = read()
			return {
				...next,
				arrival: sameRoute(prev.route, next.route) ? prev.arrival : prev.arrival + 1,
			}
		})
	}, [])

	useEffect(() => {
		window.addEventListener("popstate", sync)
		return () => window.removeEventListener("popstate", sync)
	}, [sync])

	const navigate = useCallback(
		(pathname: string, search: string, options?: { replace?: boolean }) => {
			// The detail page's "back to results" needs to know it came from /sok: the site sends
			// no referrer and pushState never sets one, so the fact travels in history state.
			const leavingResults = window.location.pathname === "/sok" && pathname !== "/sok"
			const historyState = leavingResults ? { from: "sok" } : null
			if (options?.replace) window.history.replaceState(historyState, "", `${pathname}${search}`)
			else window.history.pushState(historyState, "", `${pathname}${search}`)
			sync()
		},
		[sync]
	)

	return { ...state, navigate }
}
