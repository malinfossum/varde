import { useEffect, useMemo } from "react"
import { useArrivalFocus } from "../hooks/useArrivalFocus.ts"
import { useCatalog } from "../hooks/useCatalog.ts"
import { useDocumentTitle } from "../hooks/useDocumentTitle.ts"
import { useResources } from "../hooks/useResources.ts"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { useNavigate } from "../navigation.ts"
import { type Suggestion, suggest } from "../services/match.ts"
import { applyPatch, buildSearch, type Filters } from "../services/urlState.ts"
import { EmptyState } from "./EmptyState.tsx"
import { ErrorState } from "./ErrorState.tsx"
import { FilterBar } from "./FilterBar.tsx"
import { HandoverBanner } from "./HandoverBanner.tsx"
import { LoadingState } from "./LoadingState.tsx"
import { Pagination } from "./Pagination.tsx"
import { ResourceCard } from "./ResourceCard.tsx"
import { useAnnounce } from "./StatusRegion.tsx"
import { Suggestions } from "./Suggestions.tsx"
import { WayfindingHint } from "./WayfindingHint.tsx"

export function ListPage({ filters, arrival }: { filters: Filters; arrival: number }) {
	const { lang } = useLanguage()
	const t = useTranslation()
	const navigate = useNavigate()
	const announce = useAnnounce()
	useDocumentTitle(t("title.search"))
	const { state: catalogState, retry: retryCatalog } = useCatalog(lang)
	const catalog = catalogState.kind === "ready" ? catalogState.catalog : null
	const { state, retry } = useResources(filters, lang)

	const retryFailed = () => {
		retryCatalog()
		if (state.kind === "error") retry()
	}

	const apply = (patch: Partial<Filters>) =>
		navigate("/sok", buildSearch(applyPatch(filters, patch), null))

	// The pager sits under the whole list. After "Neste" the new cards render above the
	// viewport and focus stays on the button — the user sees nothing change. Only the pager
	// asks for this: a search or filter change must never pull focus out of the search box.
	// `settled` covers "error" too — an error settles the request just as much as a result does,
	// and a pending flag left dangling on an errored or empty page would fire on a later,
	// unrelated load instead (say, the user typing a new search after a retry).
	const { ref: resultsHeading, requestFocus } = useArrivalFocus<HTMLHeadingElement>(
		arrival,
		state.kind === "ready" && state.data.items.length > 0,
		state.kind !== "loading"
	)
	const goToPage = (page: number) => {
		requestFocus()
		apply({ page })
	}

	// Typing in the search box fires on every keystroke; pushing a history entry per keystroke
	// would flood back/forward with useless states. Replace the current entry instead — every
	// other filter change (picker, suggestions, pager, clear, toggle) still pushes normally.
	const applySearch = (patch: Partial<Filters>) =>
		navigate("/sok", buildSearch(applyPatch(filters, patch), null), { replace: true })

	// suggest() re-scans the whole catalog on every call — memoize so it only re-runs when the
	// search text or the catalog itself actually changes, not on every ListPage render.
	const suggestions: Suggestion[] = useMemo(
		() => (catalog && filters.search ? suggest(filters.search, catalog) : []),
		[catalog, filters.search]
	)

	const onPick = (suggestion: Suggestion) =>
		suggestion.kind === "municipality"
			? apply({ municipality: suggestion.id })
			: apply({ categories: [suggestion.slug] })

	// One announcement per settled result set — count plus suggestion names. A failure is a
	// settled state too: without its own announcement the live region keeps saying "Laster …"
	// while the visible page shows the error.
	// biome-ignore lint/correctness/useExhaustiveDependencies: announce once per settled set
	useEffect(() => {
		if (state.kind === "loading") announce(t("status.loading"))
		if (state.kind === "error") announce(t("error.heading"))
		if (state.kind === "ready") {
			const names = suggestions.map((s) => s.name).join(", ")
			announce(
				`${state.data.totalCount} ${t("status.results")}${names ? `. ${t("search.suggestions")}: ${names}` : ""}`
			)
		}
	}, [state.kind])

	// Unknown municipality id in a hand-edited URL: no phantom selection (spec).
	const knownMunicipality =
		filters.municipality !== null &&
		catalog?.municipalities.some((m) => m.id === filters.municipality)

	return (
		<div className="grid gap-6 lg:grid-cols-[280px_1fr]">
			<aside aria-label={t("filter.heading")}>
				<FilterBar
					catalog={catalog}
					filters={{ ...filters, municipality: knownMunicipality ? filters.municipality : null }}
					onPatch={apply}
					onSearch={(value) => applySearch({ search: value })}
				/>
			</aside>
			<div className="grid content-start gap-4">
				<HandoverBanner />
				<Suggestions suggestions={suggestions} onPick={onPick} />
				<WayfindingHint query={filters.search} />
				{/* Both requests hit the same API, so when the catalog fails the resources almost always
				    fail with it. One error state, whose retry refetches everything that failed —
				    two identical panels stacked on top of each other help nobody.
				    A catalog failure isn't mutually exclusive with the resources state, though —
				    the requests are independent, so this can render alongside LoadingState,
				    EmptyState, or the results heading below. It only takes the h1 level when
				    nothing else is showing (state.kind === "error" too, the case the guard below
				    excludes from getting its own second ErrorState); otherwise it demotes to h2
				    so the page still has exactly one h1. */}
				{catalogState.kind === "error" && (
					<ErrorState onRetry={retryFailed} level={state.kind === "error" ? 1 : 2} />
				)}
				{state.kind === "loading" && <LoadingState />}
				{state.kind === "error" && catalogState.kind !== "error" && <ErrorState onRetry={retry} />}
				{/* Covers both the genuine zero-results case and a page past the last one (e.g. a
				    stale ?page= after filters narrowed the result set) — the API returns an empty
				    items array either way, and both deserve the same recovery UI rather than a
				    blank list. */}
				{state.kind === "ready" && state.data.items.length === 0 && (
					<EmptyState
						onClearFilters={() =>
							apply({ search: "", categories: [], municipality: null, national: false })
						}
						suggestions={suggestions}
						onPick={onPick}
					/>
				)}
				{state.kind === "ready" && state.data.items.length > 0 && (
					<>
						{/* /sok's only <h1> — it doubles as the arrival-focus target after paging. */}
						<h1 ref={resultsHeading} tabIndex={-1} className="text-lg leading-snug">
							{state.data.totalCount} {t("status.results")}
						</h1>
						<ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							{state.data.items.map((resource) => (
								<ResourceCard key={resource.id} resource={resource} />
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
	)
}
