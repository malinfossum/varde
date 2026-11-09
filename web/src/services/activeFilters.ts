import type { ResourceCost } from "../types/api.ts"
import type { Catalog } from "./data.ts"
import type { Feature, Filters } from "./filters.ts"
import { placeLabel } from "./placeOptions.ts"

// A facet and a card badge never use two words for one thing (filter spec, Copy), so the
// Egenskaper and Pris options and chips read the badge strings.
export const FEATURE_LABEL_KEYS: Record<Feature, string> = {
	lavterskel: "badge.lowThreshold",
	dognapent: "badge.alwaysOpen",
}
export const costLabelKey = (cost: ResourceCost) => `badge.cost.${cost}`
export const categoryLabelKey = (slug: string) => `category.${slug}`

export type ActiveChip = { id: string; label: string; remove: Partial<Filters> }

function without<T>(values: readonly T[], value: T): T[] {
	return values.filter((v) => v !== value)
}

// One chip per active value, in URL param order (filter spec, ActiveFilters). Ta med is the
// default and has no chip, and the search text has none either, because its own field shows it.
// A place the catalog lacks gets no chip; resolveFilters has already dropped it from the list.
export function activeFilters(
	filters: Filters,
	places: Pick<Catalog, "municipalities" | "counties">,
	t: (key: string) => string
): ActiveChip[] {
	const chips: ActiveChip[] = []
	for (const number of filters.counties) {
		const id = `county:${number}`
		const label = placeLabel(places, id)
		if (label) chips.push({ id, label, remove: { counties: without(filters.counties, number) } })
	}
	for (const number of filters.municipalities) {
		const id = `municipality:${number}`
		const label = placeLabel(places, id)
		if (label) {
			chips.push({ id, label, remove: { municipalities: without(filters.municipalities, number) } })
		}
	}
	if (filters.national !== "include") {
		chips.push({
			id: "national",
			label: t(
				filters.national === "only" ? "filter.chip.nationalOnly" : "filter.chip.nationalExclude"
			),
			remove: { national: "include" },
		})
	}
	for (const slug of filters.categories) {
		chips.push({
			id: `category:${slug}`,
			label: t(categoryLabelKey(slug)),
			remove: { categories: without(filters.categories, slug) },
		})
	}
	for (const feature of filters.features) {
		chips.push({
			id: `feature:${feature}`,
			label: t(FEATURE_LABEL_KEYS[feature]),
			remove: { features: without(filters.features, feature) },
		})
	}
	for (const cost of filters.costs) {
		chips.push({
			id: `cost:${cost}`,
			label: t(costLabelKey(cost)),
			remove: { costs: without(filters.costs, cost) },
		})
	}
	return chips
}
