import type { CategoryDto, MunicipalityDto, PagedResult, ResourceDto } from "../types/api.ts"

const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5005"

export type ResourceQuery = {
	search?: string
	categories?: string[]
	municipality?: number
	national?: boolean
	lang: string
	page?: number
}

export function buildResourcesUrl(query: ResourceQuery): string {
	const params = new URLSearchParams()
	if (query.search) params.set("search", query.search)
	for (const slug of query.categories ?? []) params.append("category", slug)
	// Exclusivity is structural: national wins, municipality is dropped, matching the spec's
	// rule that the frontend can never construct the API's 400.
	if (query.national) params.set("national", "true")
	else if (query.municipality !== undefined) params.set("municipality", String(query.municipality))
	params.set("lang", query.lang)
	if (query.page !== undefined && query.page > 1) params.set("page", String(query.page))
	return `/api/resources?${params.toString()}`
}

async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
	const response = await fetch(`${BASE}${path}`, { signal })
	if (!response.ok) throw new Error(`API ${response.status} for ${path}`)
	return (await response.json()) as T
}

export function fetchResources(query: ResourceQuery, signal: AbortSignal) {
	return getJson<PagedResult<ResourceDto>>(buildResourcesUrl(query), signal)
}

export async function fetchResource(
	id: number,
	lang: string,
	signal: AbortSignal
): Promise<ResourceDto | null> {
	const response = await fetch(`${BASE}/api/resources/${id}?lang=${lang}`, { signal })
	if (response.status === 404) return null
	if (!response.ok) throw new Error(`API ${response.status} for /api/resources/${id}`)
	return (await response.json()) as ResourceDto
}

export function fetchMunicipalities(signal: AbortSignal) {
	return getJson<MunicipalityDto[]>("/api/municipalities", signal)
}

export function fetchCategories(lang: string, signal: AbortSignal) {
	return getJson<CategoryDto[]>(`/api/categories?lang=${lang}`, signal)
}
