/* ======================================================================
   src/App.tsx — APP SHELL
   Top-level layout and composition. Day-to-day work happens in
   src/components, src/hooks, and src/services.

   Layering (the React analogue of MVC):
   - services/    pure logic and data — no React, no DOM, unit-testable
   - hooks/       state + behavior (useState wrapping service functions)
   - components/  rendering + event wiring — no business logic
   ====================================================================== */

import { createContext, useContext } from "react"
import { AkuttShortcut } from "./components/AkuttShortcut.tsx"
import { LanguageToggle } from "./components/LanguageToggle.tsx"
import { QuickExit } from "./components/QuickExit.tsx"
import { AnnouncerProvider } from "./components/StatusRegion.tsx"
import { useUrlState } from "./hooks/useUrlState.ts"
import { LanguageProvider, useTranslation } from "./i18n/LanguageProvider.tsx"
import type { Filters, Route } from "./services/urlState.ts"

export const NavigationContext = createContext<(pathname: string, search: string) => void>(() => {})
export function useNavigate() {
	return useContext(NavigationContext)
}

export function App() {
	const { route, filters, langParam, navigate } = useUrlState()
	return (
		<LanguageProvider initialLang={langParam}>
			<AnnouncerProvider>
				<NavigationContext.Provider value={navigate}>
					<Shell route={route} filters={filters} />
				</NavigationContext.Provider>
			</AnnouncerProvider>
		</LanguageProvider>
	)
}

// route/filters are unused until Task 10 wires a route switch into <main> — kept typed and
// underscore-prefixed (exempt from noUnusedParameters) rather than dropped, so App.tsx's
// call site doesn't need to change again when that lands.
function Shell({ route: _route, filters: _filters }: { route: Route; filters: Filters }) {
	const t = useTranslation()
	return (
		<div id="app" className="container stack stack-lg">
			<a href="#main" className="skip-link">
				{t("app.skipToContent")}
			</a>
			<header className="app-header">
				<h1>{t("app.title")}</h1>
				<p>{t("app.tagline")}</p>
				<div className="app-header-actions">
					<LanguageToggle />
					<AkuttShortcut />
					<QuickExit />
				</div>
			</header>
			<main id="main">{/* route switch grows in Tasks 10–11 */}</main>
		</div>
	)
}
