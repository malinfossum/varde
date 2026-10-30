import { useTranslation } from "../i18n/LanguageProvider.tsx"
import type { Catalog } from "../services/data.ts"
import { CLEAR_ALL, type Filters, hasFilters } from "../services/filters.ts"
import { MunicipalityCombobox } from "./MunicipalityCombobox.tsx"
import { SearchBar } from "./SearchBar.tsx"

function toggle<T>(values: T[], value: T): T[] {
	return values.includes(value) ? values.filter((v) => v !== value) : [...values, value]
}

export function FilterBar({
	catalog,
	filters,
	onPatch,
	onSearch,
}: {
	catalog: Catalog | null
	filters: Filters
	onPatch: (patch: Partial<Filters>) => void
	onSearch: (value: string) => void
}) {
	const t = useTranslation()
	// Until PR 2's Sted field, this single combobox shows a pick only while it is the one place
	// picked, and never while Bare nasjonale is on.
	const single =
		filters.counties.length === 0 &&
		filters.municipalities.length === 1 &&
		filters.national !== "only"
	const selectedId = single
		? (catalog?.municipalities.find((m) => m.number === filters.municipalities[0])?.id ?? null)
		: null
	// Until PR 2's facet panel, the Lavterskeltilbud chip stands for the Lavterskel Egenskap
	// (filter spec, decision 5).
	const isActive = (slug: string) =>
		slug === "lavterskeltilbud"
			? filters.features.includes("lavterskel")
			: filters.categories.includes(slug)
	const toggleCategory = (slug: string) =>
		onPatch(
			slug === "lavterskeltilbud"
				? { features: toggle(filters.features, "lavterskel") }
				: { categories: toggle(filters.categories, slug) }
		)
	return (
		<div className="grid gap-4">
			<SearchBar value={filters.search} onChange={onSearch} />
			{catalog && (
				<MunicipalityCombobox
					municipalities={catalog.municipalities}
					selectedId={selectedId}
					onSelect={(id) => {
						const number = catalog.municipalities.find((m) => m.id === id)?.number
						// As before, choosing a kommune or "Alle" turns Bare nasjonale off.
						onPatch({
							counties: [],
							municipalities: number ? [number] : [],
							national: filters.national === "only" ? "include" : filters.national,
						})
					}}
					onNoMatchNational={() => onPatch({ national: "only" })}
				/>
			)}
			<button
				type="button"
				className="btn-secondary justify-start"
				aria-pressed={filters.national === "only"}
				onClick={() => onPatch({ national: filters.national === "only" ? "include" : "only" })}
			>
				{t("filter.national")}
			</button>
			{catalog && (
				<fieldset className="grid gap-2">
					<legend className="text-sm font-semibold">{t("filter.categories")}</legend>
					<ul
						// biome-ignore lint/a11y/noRedundantRoles: VoiceOver drops it when list-style is none
						role="list"
						className="flex flex-wrap gap-2"
					>
						{catalog.categories.map((c) => {
							const active = isActive(c.slug)
							return (
								<li key={c.slug}>
									<button
										type="button"
										className="btn-secondary rounded-full text-sm"
										aria-pressed={active}
										onClick={() => toggleCategory(c.slug)}
									>
										{active && <span aria-hidden="true">✓ </span>}
										{c.name}
									</button>
								</li>
							)
						})}
					</ul>
				</fieldset>
			)}
			{hasFilters(filters) && (
				<button
					type="button"
					className="btn-secondary justify-self-start"
					onClick={() => onPatch(CLEAR_ALL)}
				>
					{t("filter.reset")}
				</button>
			)}
		</div>
	)
}
