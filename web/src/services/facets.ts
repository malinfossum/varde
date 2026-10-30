import type { MunicipalityDto, ResourceCost, ResourceDto } from "../types/api.ts"
import {
	COSTS,
	FEATURES,
	type Feature,
	FILTER_CATEGORY_SLUGS,
	type Filters,
	NATIONAL_MODES,
	type NationalMode,
} from "./filters.ts"
import { hasFeature, matchesSearch, matchesWhere, pickedIds } from "./query.ts"

export type FacetCounts = {
	national: Record<NationalMode, number>
	categories: Record<string, number>
	features: Record<Feature, number>
	costs: Record<ResourceCost, number>
}

// How many rows the list would hold if each option were ticked, every other tick kept (filter
// spec, Facet counts). Any-of groups widen, Egenskaper narrow, the radio swaps, and a ticked
// option shows the list as it is. One pass: each row's group matches are worked out once.
export function facetCounts(
	rows: readonly ResourceDto[],
	filters: Filters,
	municipalities: readonly MunicipalityDto[]
): FacetCounts {
	const counts: FacetCounts = {
		national: { include: 0, exclude: 0, only: 0 },
		categories: Object.fromEntries(FILTER_CATEGORY_SLUGS.map((slug) => [slug, 0])),
		features: { lavterskel: 0, dognapent: 0 },
		costs: { free: 0, partly: 0, paid: 0 },
	}
	const ids = pickedIds(filters, municipalities)
	for (const r of rows) {
		if (!matchesSearch(r, filters.search)) continue
		const where = matchesWhere(r, filters.national, ids)
		// "any" is true when the row has one of the group's ticked values. With nothing ticked it
		// is false, so an option then counts only the rows that have it.
		const anyCategory = r.categories.some((c) => filters.categories.includes(c.slug))
		const categories = filters.categories.length === 0 || anyCategory
		const features = filters.features.every((feature) => hasFeature(r, feature))
		const anyCost = r.cost !== null && filters.costs.includes(r.cost)
		const costs = filters.costs.length === 0 || anyCost

		if (categories && features && costs) {
			for (const mode of NATIONAL_MODES) {
				// Bare nasjonale clears the Sted picks (applyPatch), so its count ignores them.
				if (matchesWhere(r, mode, mode === "only" ? null : ids)) counts.national[mode]++
			}
		}
		if (where && features && costs) {
			for (const slug of FILTER_CATEGORY_SLUGS) {
				if (anyCategory || r.categories.some((c) => c.slug === slug)) {
					counts.categories[slug] = (counts.categories[slug] ?? 0) + 1
				}
			}
		}
		if (where && categories && costs && features) {
			for (const feature of FEATURES) if (hasFeature(r, feature)) counts.features[feature]++
		}
		if (where && categories && features) {
			for (const cost of COSTS) if (anyCost || r.cost === cost) counts.costs[cost]++
		}
	}
	return counts
}
