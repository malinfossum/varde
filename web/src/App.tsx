/* ======================================================================
   src/App.tsx — APP SHELL
   Top-level layout and composition. Day-to-day work happens in
   src/components, src/hooks, and src/services.

   Layering (the React analogue of MVC):
   - services/    pure logic and data — no React, no DOM, unit-testable
   - hooks/       state + behavior (useState wrapping service functions)
   - components/  rendering + event wiring — no business logic
   ====================================================================== */

import { AcuteStrip } from "./components/AcuteStrip.tsx"
import { Footer } from "./components/Footer.tsx"
import { Header } from "./components/Header.tsx"
import { LandingPage } from "./components/LandingPage.tsx"
import { ListPage } from "./components/ListPage.tsx"
import { NotFoundState } from "./components/NotFoundState.tsx"
import { ResourceDetail } from "./components/ResourceDetail.tsx"
import { AnnouncerProvider } from "./components/StatusRegion.tsx"
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
		<div id="app" className="flex min-h-dvh flex-col">
			<a href="#main" className="skip-link">
				{t("app.skipToContent")}
			</a>
			<AcuteStrip />
			<Header />
			<main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
				{route.kind === "landing" && <LandingPage arrival={arrival} />}
				{route.kind === "list" && <ListPage filters={filters} arrival={arrival} />}
				{route.kind === "detail" && <ResourceDetail id={route.id} arrival={arrival} />}
				{route.kind === "notFound" && <NotFoundState arrival={arrival} />}
			</main>
			<Footer />
		</div>
	)
}
