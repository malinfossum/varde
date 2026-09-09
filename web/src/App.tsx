/* ======================================================================
   src/App.tsx — APP SHELL
   Top-level layout and composition. Day-to-day work happens in
   src/components, src/hooks, and src/services.

   Layering (the React analogue of MVC):
   - services/    pure logic and data — no React, no DOM, unit-testable
   - hooks/       state + behavior (useState wrapping service functions)
   - components/  rendering + event wiring — no business logic
   ====================================================================== */

import { AkuttShortcut } from "./components/AkuttShortcut.tsx"
import { LanguageToggle } from "./components/LanguageToggle.tsx"
import { Link } from "./components/Link.tsx"
import { ListPage } from "./components/ListPage.tsx"
import { NotFoundState } from "./components/NotFoundState.tsx"
import { QuickExit } from "./components/QuickExit.tsx"
import { ResourceDetail } from "./components/ResourceDetail.tsx"
import { AnnouncerProvider } from "./components/StatusRegion.tsx"
import { useArrivalFocus } from "./hooks/useArrivalFocus.ts"
import { useDocumentTitle } from "./hooks/useDocumentTitle.ts"
import { useUrlState } from "./hooks/useUrlState.ts"
import { LanguageProvider, useTranslation } from "./i18n/LanguageProvider.tsx"
import { NavigationContext } from "./navigation.ts"
import type { Filters, Route } from "./services/urlState.ts"

export function App() {
	const { route, filters, langParam, arrival, navigate } = useUrlState()
	return (
		<LanguageProvider initialLang={langParam}>
			<AnnouncerProvider>
				<NavigationContext.Provider value={navigate}>
					<Shell route={route} filters={filters} arrival={arrival} />
				</NavigationContext.Provider>
			</AnnouncerProvider>
		</LanguageProvider>
	)
}

function Shell({ route, filters, arrival }: { route: Route; filters: Filters; arrival: number }) {
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
				{route.kind === "landing" && <LandingPlaceholder arrival={arrival} />}
				{route.kind === "list" && <ListPage filters={filters} arrival={arrival} />}
				{route.kind === "detail" && <ResourceDetail id={route.id} arrival={arrival} />}
				{route.kind === "notFound" && <NotFoundState arrival={arrival} />}
			</main>
		</div>
	)
}

// Temporary stand-in for the real landing page — Task 8 replaces this with the search-first
// design. Just enough to route to /sok and to give arrival-focus a heading to land on.
function LandingPlaceholder({ arrival }: { arrival: number }) {
	const t = useTranslation()
	useDocumentTitle(t("title.app"))
	const { ref } = useArrivalFocus<HTMLHeadingElement>(arrival, true)
	return (
		<div className="landing-placeholder stack">
			<h1 ref={ref} tabIndex={-1}>
				{t("app.title")}
			</h1>
			<Link to="/sok">{t("landing.toSearch")}</Link>
		</div>
	)
}
