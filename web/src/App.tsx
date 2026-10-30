/* ======================================================================
   src/App.tsx — APP SHELL
   Top-level layout and composition. Day-to-day work happens in
   src/components, src/hooks, and src/services.

   Layering (the React analogue of MVC):
   - services/    pure logic and data — no React, no DOM, unit-testable
   - hooks/       state + behavior (useState wrapping service functions)
   - components/  rendering + event wiring — no business logic
   ====================================================================== */

import { lazy, memo, Suspense, useMemo } from "react"
import { AcuteStrip } from "./components/AcuteStrip.tsx"
import { Footer } from "./components/Footer.tsx"
import { Header } from "./components/Header.tsx"
import { HistoryButtons } from "./components/HistoryButtons.tsx"
import { LandingPage } from "./components/LandingPage.tsx"
import { LoadingState } from "./components/LoadingState.tsx"
import { NotFoundState } from "./components/NotFoundState.tsx"
import { AnnouncerProvider } from "./components/StatusRegion.tsx"
import { useShiftExit } from "./hooks/useShiftExit.ts"
import { useThemeChoice } from "./hooks/useThemeChoice.ts"
import { useUrlState } from "./hooks/useUrlState.ts"
import { LanguageProvider, useLanguage, useTranslation } from "./i18n/LanguageProvider.tsx"
import { ArrivalContext, HistoryEventsContext, NavigationContext } from "./navigation.ts"
import type { Filters } from "./services/filters.ts"
import type { Route } from "./services/urlState.ts"

// ListPage and ResourceDetail pull in react-aria-components (the municipality combobox)
// and the card/detail layout, none of which the landing page needs to paint its first frame.
// Splitting them into their own chunks keeps "/" small; the Suspense fallback below only
// shows while that chunk is still downloading, which in practice is a route change, not the
// first paint.
const ListPage = lazy(() =>
	import("./components/ListPage.tsx").then((m) => ({ default: m.ListPage }))
)
const ResourceDetail = lazy(() =>
	import("./components/ResourceDetail.tsx").then((m) => ({ default: m.ResourceDetail }))
)
const KommunePage = lazy(() =>
	import("./components/KommunePage.tsx").then((m) => ({ default: m.KommunePage }))
)
const AboutPage = lazy(() =>
	import("./components/AboutPage.tsx").then((m) => ({ default: m.AboutPage }))
)

export function App() {
	const { lang, route, filters, arrival, via, restore, navigate, historyEvents } = useUrlState()
	// A new object only when one of the two changes, so pages don't re-render for nothing.
	const arrivalContext = useMemo(() => ({ via, restore }), [via, restore])
	return (
		<LanguageProvider lang={lang}>
			<AnnouncerProvider>
				<NavigationContext.Provider value={navigate}>
					<HistoryEventsContext.Provider value={historyEvents}>
						<ArrivalContext.Provider value={arrivalContext}>
							<Shell route={route} filters={filters} arrival={arrival} />
						</ArrivalContext.Provider>
					</HistoryEventsContext.Provider>
				</NavigationContext.Provider>
			</AnnouncerProvider>
		</LanguageProvider>
	)
}

function Shell({ route, filters, arrival }: { route: Route; filters: Filters; arrival: number }) {
	useShiftExit()
	const t = useTranslation()
	// One theme state for the Meny's theme rows and the footer pill, so a choice in one shows in
	// the other at once (a storage event only reaches other tabs).
	const theme = useThemeChoice()
	return (
		<div id="app" className="flex min-h-dvh flex-col">
			<a href="#main" className="skip-link">
				{t("app.skipToContent")}
			</a>
			<AcuteStrip />
			<Header theme={theme} atLanding={route.kind === "landing"} />
			<main
				id="main"
				className={`mx-auto w-full max-w-6xl flex-1 px-4 py-6 ${route.kind === "landing" ? "lg:py-3" : ""}`}
			>
				<Page route={route} filters={filters} arrival={arrival} />
			</main>
			<Footer theme={theme} />
			{/* After the footer, so Tab reaches the bar last, in the order it is seen. */}
			<HistoryButtons layout="bar" atLanding={route.kind === "landing"} />
		</div>
	)
}

// Memoised so the shell's own state (the theme, set in an effect right after hydration) does not
// re-render the Suspense boundary. A dehydrated boundary that gets new children while its lazy
// chunk is still loading is thrown away and client-rendered, so a directly loaded page flashed
// "Laster …" over its prerendered HTML.
const Page = memo(function Page({
	route,
	filters,
	arrival,
}: {
	route: Route
	filters: Filters
	arrival: number
}) {
	const { lang } = useLanguage()
	return (
		<Suspense fallback={<LoadingState />}>
			{route.kind === "landing" && <LandingPage arrival={arrival} />}
			{route.kind === "list" && <ListPage filters={filters} arrival={arrival} />}
			{route.kind === "about" && <AboutPage arrival={arrival} />}
			{/* Keyed by language and id: a detail page owns its resource, so another id or the
			    other language is a new page. Without the id, Back from a parent to a directly
			    loaded child kept showing the parent; without the language, a switch back to the
			    loaded language kept the other language's rows (issue #79). */}
			{route.kind === "detail" && (
				<ResourceDetail key={`${lang}-${route.id}`} id={route.id} arrival={arrival} />
			)}
			{route.kind === "kommune" && (
				<KommunePage key={`${lang}-${route.slug}`} slug={route.slug} arrival={arrival} />
			)}
			{route.kind === "notFound" && <NotFoundState arrival={arrival} />}
		</Suspense>
	)
})
