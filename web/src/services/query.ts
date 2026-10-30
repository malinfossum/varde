import type { MunicipalityDto, PagedResult, ResourceDto } from "../types/api.ts"
import type { Feature, Filters as FilterState, NationalMode } from "./filters.ts"
import type { Filters } from "./urlState.ts"

// Mirrors api/Varde.Data/Repositories/ResourceRepository.cs SearchAsync exactly, so moving
// search into the browser changes no result. Keep the two in step.
export const PAGE_SIZE = 20

const collator = new Intl.Collator("nb")

export function matchesMunicipality(r: ResourceDto, id: number): boolean {
	return r.municipalityId === id || r.servedMunicipalityIds.includes(id)
}

export function matchesSearch(r: ResourceDto, term: string): boolean {
	const needle = term.trim().toLocaleLowerCase("nb")
	if (!needle) return true
	return (
		r.name.toLocaleLowerCase("nb").includes(needle) ||
		r.description.toLocaleLowerCase("nb").includes(needle)
	)
}

export function compareResources(a: ResourceDto, b: ResourceDto): number {
	if (a.isNational !== b.isNational) return a.isNational ? 1 : -1
	return collator.compare(a.name, b.name) || a.id - b.id
}

export function applyQuery(resources: ResourceDto[], filters: Filters): PagedResult<ResourceDto> {
	let rows = resources
	if (filters.national) rows = rows.filter((r) => r.isNational)
	else if (filters.municipality !== null) {
		// Located there, national, or covering it — a shared krisesenter must appear in every
		// kommune it serves, not only the one holding its address (ResourceRepository.cs).
		const id = filters.municipality
		rows = rows.filter((r) => r.isNational || matchesMunicipality(r, id))
	}
	if (filters.categories.length > 0) {
		rows = rows.filter((r) => r.categories.some((c) => filters.categories.includes(c.slug)))
	}
	if (filters.search.trim()) rows = rows.filter((r) => matchesSearch(r, filters.search))
	const sorted = [...rows].sort(compareResources)
	const start = (filters.page - 1) * PAGE_SIZE
	return {
		items: sorted.slice(start, start + PAGE_SIZE),
		page: filters.page,
		pageSize: PAGE_SIZE,
		totalCount: sorted.length,
	}
}

// The database ids a Sted pick covers: every picked kommune plus every kommune in a picked fylke.
// null means no pick, so every row passes Sted.
export function pickedIds(
	filters: FilterState,
	municipalities: readonly MunicipalityDto[]
): ReadonlySet<number> | null {
	if (filters.counties.length === 0 && filters.municipalities.length === 0) return null
	const ids = new Set<number>()
	for (const m of municipalities) {
		if (filters.municipalities.includes(m.number) || filters.counties.includes(m.countyNumber)) {
			ids.add(m.id)
		}
	}
	return ids
}

function coversPlace(r: ResourceDto, ids: ReadonlySet<number>): boolean {
	return (
		(r.municipalityId !== null && ids.has(r.municipalityId)) ||
		r.servedMunicipalityIds.some((id) => ids.has(id))
	)
}

// Sted and the national choice together (filter spec, How each group matches a row). A row
// matches a picked kommune when it is located there or serves it, so a shared krisesenter shows
// in every kommune it covers.
export function matchesWhere(
	r: ResourceDto,
	national: NationalMode,
	ids: ReadonlySet<number> | null
): boolean {
	if (national === "only") return r.isNational
	if (national === "exclude" && r.isNational) return false
	if (ids === null) return true
	return (national === "include" && r.isNational) || coversPlace(r, ids)
}

export function hasFeature(r: ResourceDto, feature: Feature): boolean {
	return feature === "lavterskel" ? r.isLowThreshold : r.isAlwaysOpen
}

// Groups AND together. Kategorier and Pris are any-of, Egenskaper all-of. A row with no stated
// cost drops out once any Pris box is ticked.
export function matchesFilters(
	r: ResourceDto,
	filters: FilterState,
	ids: ReadonlySet<number> | null
): boolean {
	return (
		matchesSearch(r, filters.search) &&
		matchesWhere(r, filters.national, ids) &&
		(filters.categories.length === 0 ||
			r.categories.some((c) => filters.categories.includes(c.slug))) &&
		filters.features.every((feature) => hasFeature(r, feature)) &&
		(filters.costs.length === 0 || (r.cost !== null && filters.costs.includes(r.cost)))
	)
}

export function applyFilters(
	resources: readonly ResourceDto[],
	filters: FilterState,
	municipalities: readonly MunicipalityDto[]
): PagedResult<ResourceDto> {
	const ids = pickedIds(filters, municipalities)
	const sorted = resources.filter((r) => matchesFilters(r, filters, ids)).sort(compareResources)
	const start = (filters.page - 1) * PAGE_SIZE
	return {
		items: sorted.slice(start, start + PAGE_SIZE),
		page: filters.page,
		pageSize: PAGE_SIZE,
		totalCount: sorted.length,
	}
}
