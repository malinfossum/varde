import { useEffect } from "react"
import { useNavigate } from "../App.tsx"
import { useCatalog } from "../hooks/useCatalog.ts"
import { useResources } from "../hooks/useResources.ts"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { type Suggestion, suggest } from "../services/match.ts"
import { applyPatch, buildSearch, type Filters } from "../services/urlState.ts"
import { EmptyState } from "./EmptyState.tsx"
import { ErrorState } from "./ErrorState.tsx"
import { HandoverBanner } from "./HandoverBanner.tsx"
import { KommunePicker } from "./KommunePicker.tsx"
import { LoadingState } from "./LoadingState.tsx"
import { Pagination } from "./Pagination.tsx"
import { ResourceCard } from "./ResourceCard.tsx"
import { SearchBar } from "./SearchBar.tsx"
import { useAnnounce } from "./StatusRegion.tsx"
import { Suggestions } from "./Suggestions.tsx"
import { WayfindingHint } from "./WayfindingHint.tsx"

export function ListPage({ filters }: { filters: Filters }) {
	const { lang } = useLanguage()
	const t = useTranslation()
	const navigate = useNavigate()
	const announce = useAnnounce()
	const catalog = useCatalog(lang)
	const { state, retry } = useResources(filters, lang)

	const apply = (patch: Partial<Filters>) =>
		navigate("/", buildSearch(applyPatch(filters, patch), null))

	// Typing in the search box fires on every keystroke; pushing a history entry per keystroke
	// would flood back/forward with useless states. Replace the current entry instead — every
	// other filter change (picker, suggestions, pager, clear, toggle) still pushes normally.
	const applySearch = (patch: Partial<Filters>) =>
		navigate("/", buildSearch(applyPatch(filters, patch), null), { replace: true })

	const suggestions: Suggestion[] =
		catalog && filters.search ? suggest(filters.search, catalog) : []

	const onPick = (suggestion: Suggestion) =>
		suggestion.kind === "municipality"
			? apply({ municipality: suggestion.id })
			: apply({ categories: [suggestion.slug] })

	// One announcement per settled result set — count plus suggestion names.
	// biome-ignore lint/correctness/useExhaustiveDependencies: announce once per settled set
	useEffect(() => {
		if (state.kind === "loading") announce(t("status.loading"))
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
		<div className="list-page stack">
			<HandoverBanner />
			<SearchBar value={filters.search} onChange={(value) => applySearch({ search: value })} />
			<Suggestions suggestions={suggestions} onPick={onPick} />
			<WayfindingHint query={filters.search} />
			{catalog && (
				<KommunePicker
					municipalities={catalog.municipalities}
					selectedId={knownMunicipality ? filters.municipality : null}
					nationalSelected={filters.national}
					onSelect={(selection) =>
						"municipality" in selection
							? apply({ municipality: selection.municipality })
							: "national" in selection
								? apply({ national: true })
								: apply({ municipality: null, national: false })
					}
				/>
			)}
			{state.kind === "loading" && <LoadingState />}
			{state.kind === "error" && <ErrorState onRetry={retry} />}
			{state.kind === "ready" && state.data.totalCount === 0 && (
				<EmptyState
					onClearFilters={() =>
						apply({ search: "", categories: [], municipality: null, national: false })
					}
					suggestions={suggestions}
					onPick={onPick}
				/>
			)}
			{state.kind === "ready" && state.data.totalCount > 0 && (
				<>
					<ul className="resource-list stack">
						{state.data.items.map((resource) => (
							<ResourceCard key={resource.id} resource={resource} />
						))}
					</ul>
					<Pagination
						page={state.data.page}
						pageSize={state.data.pageSize}
						totalCount={state.data.totalCount}
						onPage={(page) => apply({ page })}
					/>
				</>
			)}
		</div>
	)
}
