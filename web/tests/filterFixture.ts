import { EMPTY_FILTERS, type Filters } from "../src/services/filters.ts"
import type { CategoryDto, MunicipalityDto } from "../src/types/api.ts"
import { makeResource } from "./stubData.ts"

// Five rows that cover every filter group, shared by the query and facet tests. Names sort A to
// E, so the expected order reads off the ids (local rows first, then national).
const cat = (slug: string): CategoryDto => ({
	id: 0,
	slug,
	name: slug,
	isFallbackTranslation: false,
})

export const places: MunicipalityDto[] = [
	{ id: 8, name: "Oslo", county: "Oslo", number: "0301", countyNumber: "03" },
	{ id: 1, name: "Hamar", county: "Innlandet", number: "3403", countyNumber: "34" },
	{ id: 4, name: "Ringsaker", county: "Innlandet", number: "3411", countyNumber: "34" },
]

export const hamarRus = makeResource({
	id: 1,
	name: "A",
	isNational: false,
	municipalityId: 1,
	categories: [cat("rus")],
})
export const ringsakerBolig = makeResource({
	id: 2,
	name: "B",
	isNational: false,
	municipalityId: 4,
	categories: [cat("bolig")],
})
export const osloRusLavterskel = makeResource({
	id: 3,
	name: "C",
	isNational: false,
	municipalityId: 8,
	categories: [cat("rus")],
	isLowThreshold: true,
})
// A shared krisesenter: no address kommune of its own, serves Hamar and Ringsaker.
export const sharedKrisesenter = makeResource({
	id: 4,
	name: "D",
	isNational: false,
	municipalityId: null,
	servedMunicipalityIds: [1, 4],
	categories: [cat("vold-og-overgrep")],
})
export const nationalRus = makeResource({
	id: 5,
	name: "E",
	isNational: true,
	categories: [cat("rus")],
	isAlwaysOpen: true,
	cost: "free",
})

export const rows = [hamarRus, ringsakerBolig, osloRusLavterskel, sharedKrisesenter, nationalRus]

export const f = (over: Partial<Filters> = {}): Filters => ({ ...EMPTY_FILTERS, ...over })
