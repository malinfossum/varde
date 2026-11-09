import { useEffect, useMemo } from "react"
import { useArrivalFocus } from "../hooks/useArrivalFocus.ts"
import { useCatalog } from "../hooks/useCatalog.ts"
import { useResources } from "../hooks/useResources.ts"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { useNavigate } from "../navigation.ts"
import {
	applyPatch,
	buildSearch,
	CLEAR_ALL,
	type Filters,
	resolveFilters,
	suggestionPatch,
} from "../services/filters.ts"
import { type Suggestion, suggest } from "../services/match.ts"
import { ActiveFilters } from "./ActiveFilters.tsx"
import { EmptyState } from "./EmptyState.tsx"
import { ErrorState } from "./ErrorState.tsx"
import { FacetDialog, FacetSidebar } from "./FacetPanel.tsx"
import { HandoverBanner } from "./HandoverBanner.tsx"
import { LoadingState } from "./LoadingState.tsx"
import { PageHead } from "./PageHead.tsx"
import { Pagination } from "./Pagination.tsx"
import { PlaceBar } from "./PlaceBar.tsx"
import { ResourceCard } from "./ResourceCard.tsx"
import { useAnnounce } from "./StatusRegion.tsx"
import { Suggestions } from "./Suggestions.tsx"
import { WayfindingHint } from "./WayfindingHint.tsx"

const descriptions = {
	nb: "Varde – finn riktig hjelpetjeneste der du bor. Offentlig katalog over sosiale tjenester i Norge.",
	en: "Varde – find the right help service where you live. Public directory of social services in Norway.",
}

export function ListPage({ filters, arrival }: { filters: Filters; arrival: number }) {
	const { lang } = useLanguage()
	const t = useTranslation()
	const navigate = useNavigate()
	const announce = useAnnounce()
	const { state: catalogState, retry: retryCatalog } = useCatalog(lang)
	const catalog = catalogState.kind === "ready" ? catalogState.catalog : null
	const failed = catalogState.kind === "error"
	const { state, retry } = useResources(filters, lang)
	// Counts and the kommuner with rows exist only once rows have loaded (filter spec, Loading
	// and failure).
	const ready = state.kind === "ready" ? state : null
	// Old ids and places without data resolve against the catalog; until it loads, the parsed
	// filters stand (filter spec, Old links).
	const resolved = useMemo(
		() => (catalog ? resolveFilters(filters, catalog.municipalities, catalog.counties) : filters),
		[catalog, filters]
	)

	// A URL the catalog reads differently (an old id, a place without data, a stray value, other
	// encoding) is rewritten to its one canonical form once the catalog has loaded (filter spec,
	// Old links). Passing the entry's own state keeps its scroll key for Back. This skips
	// navigate on purpose: navigate would re-read the URL and mark the change as a push, which
	// can flip a Back restore half-way, and the resolved filters already are what the new URL
	// says. With the catalog down nothing is rewritten, so a retry can still resolve it.
	useEffect(() => {
		if (!catalog) return
		const canonical = buildSearch(resolved)
		const { pathname, search, hash } = window.location
		if (canonical !== search) {
			window.history.replaceState(window.history.state, "", `${pathname}${canonical}${hash}`)
		}
	}, [catalog, resolved])

	const retryFailed = () => {
		retryCatalog()
		if (state.kind === "error") retry()
	}

	const apply = (patch: Partial<Filters>) =>
		navigate("/sok", buildSearch(applyPatch(resolved, patch)))

	// The pager sits under the whole list. After "Neste" the new cards render above the
	// viewport and focus stays on the button. The user sees nothing change. Only the pager
	// asks for this: a search or filter change must never pull focus out of the search box.
	// `settled` covers "error" too. An error settles the request just as much as a result does,
	// and a pending flag left dangling on an errored or empty page would fire on a later,
	// unrelated load instead (say, the user typing a new search after a retry). `state` as the
	// token: a page change answered from the already-cached index never flips ready/settled at
	// all (see useResources), so the pager's requestFocus() needs the freshly computed state
	// object itself to know a new answer has actually arrived.
	// An empty answer is ready too: the empty state's heading takes the ref then, so Back or
	// Forward onto it lands focus on that heading and never leaves it on <body>.
	const { ref: resultsHeading, requestFocus } = useArrivalFocus<HTMLHeadingElement>(
		arrival,
		state.kind === "ready",
		state.kind !== "loading",
		state
	)
	const goToPage = (page: number) => {
		requestFocus()
		apply({ page })
	}

	// Typing in the search box fires on every keystroke; pushing a history entry per keystroke
	// would flood back/forward with useless states. Replace the current entry instead. Every
	// other filter change (picker, suggestions, pager, clear, toggle) still pushes normally.
	const applySearch = (patch: Partial<Filters>) =>
		navigate("/sok", buildSearch(applyPatch(resolved, patch)), { replace: true })

	// suggest() re-scans the whole catalog on every call. Memoize so it only re-runs when the
	// search text or the catalog itself actually changes, not on every ListPage render.
	const suggestions: Suggestion[] = useMemo(
		() => (catalog && filters.search ? suggest(filters.search, catalog) : []),
		[catalog, filters.search]
	)

	const onPick = (suggestion: Suggestion) => apply(suggestionPatch(resolved, suggestion))

	// A failure is a settled state too: without its own announcement the live region keeps
	// saying "Laster …" while the visible page shows the error. Loading only reaches here for a
	// genuine fetch now (useResources answers a cached filter change synchronously), so this
	// never fires on a keystroke that loaded nothing.
	// biome-ignore lint/correctness/useExhaustiveDependencies: announce once per settled set
	useEffect(() => {
		if (state.kind === "loading") announce(t("status.loading"))
		if (state.kind === "error") announce(t("error.heading"))
	}, [state.kind])

	// The result count, debounced: typing narrows the result set on every keystroke, and
	// announcing each intermediate count would read out a stream of numbers the user never
	// stopped on. Keyed on the actual values that change the message (not state.kind, which
	// stays "ready" across a synchronous filter change) so the count still gets announced once
	// typing settles.
	const totalCount = state.kind === "ready" ? state.data.totalCount : null
	// Every filter key, the new ones included, in one string (the URL without its page).
	const filterKey = buildSearch({ ...resolved, page: 1 })
	// biome-ignore lint/correctness/useExhaustiveDependencies: filterKey stands in for every filter value
	useEffect(() => {
		if (totalCount === null) return
		const names = suggestions.map((s) => s.name).join(", ")
		const message = `${totalCount} ${t("status.results")}${names ? `. ${t("search.suggestions")}: ${names}` : ""}`
		const timer = setTimeout(() => announce(message), 300)
		return () => clearTimeout(timer)
	}, [totalCount, filterKey, filters.page, suggestions])

	return (
		<div className="sok-page grid gap-6">
			<PageHead title={t("list.pageTitle")} description={descriptions[lang]} path="/sok" />
			{/* .sok-top reserves the loaded height of everything above the results that waits for
			    the catalog: Sted, the national choice and, outside the sidebar layout, the "Flere
			    filtre" button. Before the catalog arrives only Søk is there, and that growth would
			    push the results down once data lands: a layout shift, and a moved target for the
			    scroll position Back restores. Since filter PR 2 the whole bar sits above the
			    results at every width, so the floor holds from 1024 px too (the old side column
			    needed none there). The values live in main.css under .sok-top: each is the loaded
			    height measured on 09.11.2026 with e2e/measure-reserve.spec.ts (375x812, 768, 1024
			    and 1280 px, 100 % text), rounded up to the next 0.25rem. They are in rem, so they
			    grow with a larger text size, and the sidebar step uses the same media and container
			    query as the sidebar itself, so the floor always matches the layout on screen.
			    It is lifted on a catalog failure. Then only Søk renders, and a floor would leave a
			    screenful of nothing above "Noe gikk galt" during exactly the outage that panel
			    exists for (measured with the old filter at 375x812: the Legevakt number fell below
			    the fold). It stays on once the catalog has loaded: lifting it then costs its own
			    small shift and buys nothing, because the loaded bar fills it anyway. */}
			<div className={failed ? "grid gap-4" : "sok-top grid gap-4"}>
				<PlaceBar
					catalog={catalog}
					withRows={ready?.withRows ?? null}
					counts={ready?.counts ?? null}
					filters={resolved}
					onPatch={apply}
					onSearch={(value) => applySearch({ search: value })}
				/>
				{catalog && (
					<FacetDialog
						filters={resolved}
						counts={ready?.counts ?? null}
						totalCount={totalCount}
						onPatch={apply}
					/>
				)}
			</div>
			<div className={failed ? "grid gap-4" : "sok-layout"}>
				{!failed && (
					<FacetSidebar
						loaded={catalog !== null}
						filters={resolved}
						counts={ready?.counts ?? null}
						onPatch={apply}
					/>
				)}
				{/* minmax(0, 1fr): an auto column would take the widest chip's or card's
				    min-content and push the chips row past a 375 px screen at 200 % text. */}
				<div className="grid grid-cols-[minmax(0,1fr)] content-start gap-4">
					<HandoverBanner />
					<Suggestions suggestions={suggestions} onPick={onPick} />
					<WayfindingHint query={filters.search} />
					{catalog && (
						<ActiveFilters
							filters={resolved}
							catalog={catalog}
							onPatch={apply}
							headingRef={resultsHeading}
						/>
					)}
					{/* useCatalog and useResources both resolve from the one shared loadIndex(lang)
					    promise in services/data.ts, so a catalog error and a resources error always
					    coincide: there's no state where one fails without the other. One ErrorState
					    at the default level 1 covers both; retryFailed refetches everything that
					    failed. */}
					{failed && <ErrorState onRetry={retryFailed} />}
					{state.kind === "loading" && <LoadingState />}
					{/* Covers both the genuine zero-results case and a page past the last one (e.g. a
					    stale ?page= after filters narrowed the result set). The API returns an empty
					    items array either way, and both deserve the same recovery UI rather than a
					    blank list. */}
					{state.kind === "ready" && state.data.items.length === 0 && (
						<EmptyState
							onClearFilters={() => apply(CLEAR_ALL)}
							suggestions={suggestions}
							onPick={onPick}
							headingRef={resultsHeading}
						/>
					)}
					{state.kind === "ready" && state.data.items.length > 0 && (
						<>
							{/* /sok's only <h1>. It doubles as the arrival-focus target after paging. */}
							<h1 ref={resultsHeading} tabIndex={-1} className="text-lg leading-snug">
								{state.data.totalCount} {t("status.results")}
							</h1>
							<ul
								// biome-ignore lint/a11y/noRedundantRoles: VoiceOver drops it when list-style is none
								role="list"
								className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
							>
								{state.data.items.map((resource) => (
									<ResourceCard
										key={resource.id}
										resource={resource}
										kommuneSlug={
											catalog?.kommuner.find((k) => k.id === resource.municipalityId)?.slug
										}
									/>
								))}
							</ul>
							<Pagination
								page={state.data.page}
								pageSize={state.data.pageSize}
								totalCount={state.data.totalCount}
								onPage={goToPage}
							/>
						</>
					)}
				</div>
			</div>
		</div>
	)
}
