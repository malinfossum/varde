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

// The municipality/category/kommune trio the catalog-era hooks and components consume. Kept
// here (not in a dedicated file) now that all three come from the same index.
export type Catalog = {
	municipalities: MunicipalityDto[]
	categories: CategoryDto[]
	kommuner: KommuneEntry[]
}

const cache = new Map<Lang, Promise<Index>>()
const settled = new Map<Lang, Index>()

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
		// One combined handler, not a separate .then plus .catch: two independent chains off the
		// same rejected promise would leave the .then-only one an unhandled rejection (nothing
		// ever attaches a .catch to it) whenever every file 404s or 500s.
		pending.then(
			(index) => settled.set(lang, index),
			() => cache.delete(lang)
		)
		cache.set(lang, pending)
	}
	return pending
}

// The already-settled index for a language, or null while it's still loading (or hasn't been
// asked for yet). Lets a caller that already has data — e.g. a filter change while the index
// is cached — apply it synchronously instead of round-tripping through a loading state that
// nothing is actually loading.
export function peekIndex(lang: Lang): Index | null {
	return settled.get(lang) ?? null
}

export function prefetchIndex(lang: Lang): void {
	loadIndex(lang).catch(() => {})
}

export function clearIndexCache(): void {
	cache.clear()
	settled.clear()
}

export function readPageData(): PageData | null {
	if (typeof document === "undefined") return null
	const block = document.getElementById("varde-data")
	if (!block?.textContent) return null
	return JSON.parse(block.textContent) as PageData
}
