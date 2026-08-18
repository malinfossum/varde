// Navigation context — split out of App.tsx so components that need it (Link, LanguageToggle)
// don't import App.tsx itself, which would create a circular import (App renders them, they'd
// import back from App).
import { createContext, useContext } from "react"

export const NavigationContext = createContext<
	(pathname: string, search: string, options?: { replace?: boolean }) => void
>(() => {})

export function useNavigate() {
	return useContext(NavigationContext)
}
