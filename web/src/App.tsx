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
import { ListPage } from "./components/ListPage.tsx"
import { NotFoundState } from "./components/NotFoundState.tsx"
import { QuickExit } from "./components/QuickExit.tsx"
import { ResourceDetail } from "./components/ResourceDetail.tsx"
import { AnnouncerProvider } from "./components/StatusRegion.tsx"
import { useUrlState } from "./hooks/useUrlState.ts"
import { LanguageProvider, useTranslation } from "./i18n/LanguageProvider.tsx"
import type { Filters, Route } from "./services/urlState.ts"

export const NavigationContext = createContext<
	(pathname: string, search: string, options?: { replace?: boolean }) => void
>(() => {})
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

function Shell({ route, filters }: { route: Route; filters: Filters }) {
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
			<main id="main">
				{route.kind === "list" && <ListPage filters={filters} />}
				{route.kind === "detail" && <ResourceDetail id={route.id} />}
				{route.kind === "notFound" && <NotFoundState />}
			</main>
		</div>
	)
}
