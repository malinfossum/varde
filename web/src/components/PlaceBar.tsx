import { useId } from "react"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import type { Catalog } from "../services/data.ts"
import type { FacetCounts } from "../services/facets.ts"
import { type Filters, NATIONAL_MODES } from "../services/filters.ts"
import { FacetOption } from "./FacetGroup.tsx"
import { PlaceField } from "./PlaceField.tsx"
import { SearchBar } from "./SearchBar.tsx"

// The bar on top of /sok (filter spec, PlaceBar): Søk and Sted side by side from 768 px, stacked
// below, and the national choice right under them. Sted and the radio need the catalog, so on a
// catalog failure only Søk shows (filter spec, Loading and failure). The radio counts each mode
// as if it were chosen; Bare nasjonale ignores the Sted picks, because choosing it clears them.
export function PlaceBar({
	catalog,
	withRows,
	counts,
	filters,
	onPatch,
	onSearch,
}: {
	catalog: Catalog | null
	withRows: ReadonlySet<number> | null
	counts: FacetCounts | null
	filters: Filters
	onPatch: (patch: Partial<Filters>) => void
	onSearch: (value: string) => void
}) {
	const t = useTranslation()
	const name = useId()
	return (
		<div className="grid gap-4">
			<div className="place-bar">
				<SearchBar value={filters.search} onChange={onSearch} />
				{catalog && (
					<PlaceField catalog={catalog} withRows={withRows} filters={filters} onPatch={onPatch} />
				)}
			</div>
			{catalog && (
				<fieldset className="national-radio">
					<legend className="field-label">{t("filter.national")}</legend>
					<div className="national-options">
						{NATIONAL_MODES.map((mode) => (
							<FacetOption
								key={mode}
								type="radio"
								name={name}
								label={t(`filter.national.${mode}`)}
								count={counts ? counts.national[mode] : null}
								checked={filters.national === mode}
								onChange={() => onPatch({ national: mode })}
							/>
						))}
					</div>
				</fieldset>
			)}
		</div>
	)
}
