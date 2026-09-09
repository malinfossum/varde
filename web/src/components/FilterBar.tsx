import { useTranslation } from "../i18n/LanguageProvider.tsx"
import type { Catalog } from "../services/catalogCache.ts"
import type { Filters } from "../services/urlState.ts"
import { MunicipalityCombobox } from "./MunicipalityCombobox.tsx"
import { SearchBar } from "./SearchBar.tsx"

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
	const anySet =
		filters.search !== "" ||
		filters.categories.length > 0 ||
		filters.municipality !== null ||
		filters.national
	const toggleCategory = (slug: string) =>
		onPatch({
			categories: filters.categories.includes(slug)
				? filters.categories.filter((s) => s !== slug)
				: [...filters.categories, slug],
		})
	return (
		<div className="grid gap-4">
			<SearchBar value={filters.search} onChange={onSearch} />
			{catalog && (
				<MunicipalityCombobox
					municipalities={catalog.municipalities}
					selectedId={filters.national ? null : filters.municipality}
					onSelect={(id) => onPatch({ municipality: id, national: false })}
					onNoMatchNational={() => onPatch({ national: true })}
				/>
			)}
			<button
				type="button"
				className="btn-secondary justify-start"
				aria-pressed={filters.national}
				onClick={() => onPatch(filters.national ? { national: false } : { national: true })}
			>
				{t("filter.national")}
			</button>
			{catalog && (
				<fieldset className="grid gap-2">
					<legend className="text-sm font-semibold">{t("filter.categories")}</legend>
					<ul className="flex flex-wrap gap-2">
						{catalog.categories.map((c) => {
							const active = filters.categories.includes(c.slug)
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
			{anySet && (
				<button
					type="button"
					className="btn-secondary justify-self-start"
					onClick={() =>
						onPatch({ search: "", categories: [], municipality: null, national: false })
					}
				>
					{t("filter.reset")}
				</button>
			)}
		</div>
	)
}
