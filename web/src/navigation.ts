// Navigation context. I split it out of App.tsx so components that need it (Link, LanguagePicker)
// don't import App.tsx itself, which would create a circular import (App renders them, they'd
// import back from App).
import { createContext, useContext } from "react"
import { createHistoryCounter, type HistoryCounter } from "./services/historyCounter.ts"
import type { Lang } from "./services/urlState.ts"

// href: the link that was followed, saved on the entry being left so Back can focus it again
// (spec: Focus and scroll). Only Link passes it.
export type NavigateOptions = { replace?: boolean; lang?: Lang; href?: string }

export const NavigationContext = createContext<
	(pathname: string, search: string, options?: NavigateOptions) => void
>(() => {})

export function useNavigate() {
	return useContext(NavigationContext)
}

// How the current page was reached, for useArrivalFocus. "traverse" is Back or Forward (the
// buttons or the browser's own); "push" is everything else. `restore` counts traversals that
// stayed on the same route, such as Back undoing a filter change on /sok.
export type ArrivalVia = "push" | "traverse"

export const ArrivalContext = createContext<{ via: ArrivalVia; restore: number }>({
	via: "push",
	restore: 0,
})

export function useArrival() {
	return useContext(ArrivalContext)
}

// pushState fires no event, so the router tells subscribers after each push and traversal and
// the history buttons never poll. `counter` is the fallback for browsers without the Navigation
// API.
export type HistoryEvents = {
	subscribe(listener: () => void): () => void
	counter: HistoryCounter
}

export const HistoryEventsContext = createContext<HistoryEvents>({
	subscribe: () => () => {},
	counter: createHistoryCounter(),
})

export function useHistoryEvents() {
	return useContext(HistoryEventsContext)
}

// The current URL, read through a context so components never touch window.location in render
// (window doesn't exist during the server render). Nothing provides UrlContext yet in the
// browser app, so useCurrentUrl falls back to the real window.location there.
export const UrlContext = createContext<{ pathname: string; search: string } | null>(null)

export function useCurrentUrl(): { pathname: string; search: string } {
	const fromContext = useContext(UrlContext)
	if (fromContext) return fromContext
	return { pathname: window.location.pathname, search: window.location.search }
}
