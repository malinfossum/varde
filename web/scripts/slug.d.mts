// Sibling declaration for slug.mjs — this project carries no allowJs/@types/node, so a plain
// .mjs import has no type on its own. tests/slug.test.ts and export-data.mjs are the consumers.
export type Municipality = { id: number; name: string; county: string }
export type KommuneEntry = { id: number; slug: string; name: string; county: string }
type ResourceCoverage = { municipalityId: number | null; servedMunicipalityIds: number[] }

export declare function slugify(name: string): string
export declare function kommunerWithPages(
	municipalities: Municipality[],
	resources: ResourceCoverage[]
): KommuneEntry[]
