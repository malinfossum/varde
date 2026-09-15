import type { PageData } from "../pageData.ts"
import type { CategoryDto, MunicipalityDto, ResourceDto } from "../types/api.ts"
import type { Lang } from "./urlState.ts"

export type KommuneEntry = { id: number; slug: string; name: string; county: string }
export type Index = {
	resources: ResourceDto[]
	municipalities: MunicipalityDto[]
	categories: CategoryDto[]
	kommuner: KommuneEntry[]
}

// The municipality/category pair the catalog-era hooks and components consumed. Kept here (not
// in a dedicated file) now that both come from the same index.
export type Catalog = { municipalities: MunicipalityDto[]; categories: CategoryDto[] }

const cache = new Map<Lang, Promise<Index>>()

async function getJson<T>(path: string, fetchImpl: typeof fetch): Promise<T> {
	const response = await fetchImpl(path)
	if (!response.ok) throw new Error(`${response.status} for ${path}`)
	return (await response.json()) as T
}

// The six files scripts/export-data.mjs writes. All-or-nothing: a half index would render a
// results page that silently lacks a filter.
export function loadIndex(lang: Lang, fetchImpl: typeof fetch = fetch): Promise<Index> {
	let pending = cache.get(lang)
	if (!pending) {
		pending = Promise.all([
			getJson<ResourceDto[]>(`/data/resources.${lang}.json`, fetchImpl),
			getJson<MunicipalityDto[]>("/data/municipalities.json", fetchImpl),
			getJson<CategoryDto[]>(`/data/categories.${lang}.json`, fetchImpl),
			getJson<KommuneEntry[]>("/data/kommuner.json", fetchImpl),
		]).then(([resources, municipalities, categories, kommuner]) => ({
			resources,
			municipalities,
			categories,
			kommuner,
		}))
		pending.catch(() => cache.delete(lang))
		cache.set(lang, pending)
	}
	return pending
}

export function prefetchIndex(lang: Lang): void {
	loadIndex(lang).catch(() => {})
}

export function clearIndexCache(): void {
	cache.clear()
}

export function readPageData(): PageData | null {
	if (typeof document === "undefined") return null
	const block = document.getElementById("varde-data")
	if (!block?.textContent) return null
	return JSON.parse(block.textContent) as PageData
}
