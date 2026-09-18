import type { PagedResult, ResourceDto } from "../types/api.ts"
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
