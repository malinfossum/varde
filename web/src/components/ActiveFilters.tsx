import { useEffect, useRef } from "react"
import { Label, TagGroup, TagList } from "react-aria-components"
import { useChipFocus } from "../hooks/useChipFocus.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { activeFilters } from "../services/activeFilters.ts"
import type { Catalog } from "../services/data.ts"
import { CLEAR_ALL, type Filters, hasFilters } from "../services/filters.ts"
import { FilterChip } from "./FilterChip.tsx"

// The chips above the results (filter spec, ActiveFilters): one per active value, so every
// filter, wherever it was set, can be seen and undone in one place. "Nullstill alt" clears every
// filter and the search text, and shows whenever anything is set. When the last chip goes, or
// Nullstill alt takes the whole row, focusResults asks for focus on the results heading once the
// new answer is on screen (the empty state's heading when nothing matches). Never to <body>.
export function ActiveFilters({
	filters,
	catalog,
	onPatch,
	focusResults,
}: {
	filters: Filters
	catalog: Pick<Catalog, "municipalities" | "counties">
	onPatch: (patch: Partial<Filters>) => void
	focusResults: () => void
}) {
	const t = useTranslation()
	const chips = activeFilters(filters, catalog, t)
	const { listRef, removing } = useChipFocus(chips.length, focusResults)
	const active = hasFilters(filters)
	const clearing = useRef(false)
	// biome-ignore lint/correctness/useExhaustiveDependencies: active is the trigger; the refs are read
	useEffect(() => {
		if (!active && clearing.current) focusResults()
		clearing.current = false
	}, [active])

	if (!active) return null
	return (
		<div className="active-filters">
			{chips.length > 0 && (
				<TagGroup
					className="grid gap-1"
					onRemove={(keys) => {
						const index = chips.findIndex((chip) => keys.has(chip.id))
						const chip = chips[index]
						if (!chip) return
						removing(index)
						onPatch(chip.remove)
					}}
				>
					<Label className="field-label">{t("filter.selected")}</Label>
					<TagList ref={listRef} className="flex flex-wrap gap-2">
						{chips.map((chip) => (
							<FilterChip key={chip.id} id={chip.id} label={chip.label} />
						))}
					</TagList>
				</TagGroup>
			)}
			<button
				type="button"
				className="btn-secondary"
				onClick={() => {
					clearing.current = true
					onPatch(CLEAR_ALL)
				}}
			>
				{t("filter.reset")}
			</button>
		</div>
	)
}
