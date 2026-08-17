import { useCallback, useEffect, useState } from "react"
import { type Filters, parseFilters, parseRoute, type Route } from "../services/urlState.ts"

type UrlState = { route: Route; filters: Filters; langParam: string | null }

function read(): UrlState {
	const params = new URLSearchParams(window.location.search)
	return {
		route: parseRoute(window.location.pathname),
		filters: parseFilters(params),
		langParam: params.get("lang"),
	}
}

export function useUrlState() {
	const [state, setState] = useState<UrlState>(read)

	useEffect(() => {
		const onPopState = () => setState(read())
		window.addEventListener("popstate", onPopState)
		return () => window.removeEventListener("popstate", onPopState)
	}, [])

	const navigate = useCallback((pathname: string, search: string) => {
		window.history.pushState(null, "", `${pathname}${search}`)
		setState(read())
	}, [])

	return { ...state, navigate }
}
