import type { CategoryDto, MunicipalityDto } from "../types/api.ts"
import { fetchCategories, fetchMunicipalities } from "./api.ts"

export type Catalog = { municipalities: MunicipalityDto[]; categories: CategoryDto[] }

// One in-flight-or-settled promise per language. The landing prefetches on focus; the results
// page reads the same promise, so the two pages share one pair of requests. A rejected load
// is evicted so a retry really retries.
const cache = new Map<string, Promise<Catalog>>()

export function loadCatalog(lang: string): Promise<Catalog> {
	const cached = cache.get(lang)
	if (cached) return cached
	const controller = new AbortController()
	const promise = Promise.all([
		fetchMunicipalities(controller.signal),
		fetchCategories(lang, controller.signal),
	]).then(([municipalities, categories]) => ({ municipalities, categories }))
	promise.catch(() => cache.delete(lang))
	cache.set(lang, promise)
	return promise
}

export function prefetchCatalog(lang: string): void {
	loadCatalog(lang).catch(() => {
		// Prefetch is best effort; the page that needs the catalog reports its own error.
	})
}

export function clearCatalogCache(): void {
	cache.clear()
}
