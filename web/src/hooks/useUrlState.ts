import { useCallback, useEffect, useState } from "react"
import { type NavigateOptions, useCurrentUrl } from "../navigation.ts"
import {
	type Filters,
	type Lang,
	parseFilters,
	parseUrl,
	pathFor,
	type Route,
} from "../services/urlState.ts"

type UrlState = { lang: Lang; route: Route; filters: Filters; arrival: number }

function sameRoute(a: Route, b: Route): boolean {
	if (a.kind !== b.kind) return false
	if (a.kind === "detail" && b.kind === "detail") return a.id === b.id
	if (a.kind === "kommune" && b.kind === "kommune") return a.slug === b.slug
	return true
}

function read(pathname: string, search: string): Omit<UrlState, "arrival"> {
	return { ...parseUrl(pathname), filters: parseFilters(new URLSearchParams(search)) }
}

export function useUrlState() {
	const initialUrl = useCurrentUrl()
	const [state, setState] = useState<UrlState>(() => ({
		...read(initialUrl.pathname, initialUrl.search),
		arrival: 0,
	}))

	// `arrival` counts route changes (not filter changes on the same route). Pages use it to
	// move focus to their heading; the first load stays 0 so the browser's own focus is kept.
	const sync = useCallback(() => {
		setState((prev) => {
			const next = read(window.location.pathname, window.location.search)
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
		(path: string, search: string, options?: NavigateOptions) => {
			const { lang: current, route: currentRoute } = parseUrl(window.location.pathname)
			const target = `${pathFor(options?.lang ?? current, path)}${search}`
			// The detail page's "back to results" needs to know it came from /sok: the site sends
			// no referrer and pushState never sets one, so the fact travels in history state.
			const leavingResults = currentRoute.kind === "list" && path !== "/sok"
			const historyState = leavingResults ? { from: "sok" } : null
			if (options?.replace) window.history.replaceState(historyState, "", target)
			else window.history.pushState(historyState, "", target)
			sync()
		},
		[sync]
	)

	return { ...state, navigate }
}
