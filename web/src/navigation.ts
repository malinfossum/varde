// Navigation context — split out of App.tsx so components that need it (Link, LanguageToggle)
// don't import App.tsx itself, which would create a circular import (App renders them, they'd
// import back from App).
import { createContext, useContext } from "react"
import type { Lang } from "./services/urlState.ts"

export type NavigateOptions = { replace?: boolean; lang?: Lang }

export const NavigationContext = createContext<
	(pathname: string, search: string, options?: NavigateOptions) => void
>(() => {})

export function useNavigate() {
	return useContext(NavigationContext)
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
