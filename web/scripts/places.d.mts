// Sibling declaration for places.mjs. This project carries no allowJs/@types/node, so a plain
// .mjs import has no type on its own. tests/places.test.ts and export-data.mjs are the consumers.
export type Place = { id: number; number: string; countyNumber: string; name: string }
export type County = { number: string; name: string }
export type Alias = { alias: string; number: string; source: string }
type Municipality = { id: number; name: string; county: string }
export type NumberedMunicipality = Municipality & { number: string; countyNumber: string }

export declare function readPlaceFiles(dir: string): {
	places: Place[]
	counties: County[]
	aliases: Alias[]
}
export declare function checkPlaces(places: Place[], counties: County[], aliases: Alias[]): string[]
export declare function attachNumbers(
	municipalities: Municipality[],
	places: Place[]
): NumberedMunicipality[]
