import type { MunicipalityDto, ResourceDto } from "../types/api.ts"
import type { Catalog } from "./data.ts"
import type { Filters } from "./filters.ts"
import { fold, matchesEitherWay } from "./match.ts"

// The Sted field's options and picks (filter spec, UI, PlaceBar). A key names one option with
// its kind in front, so fylker, kommuner and town aliases share one list: "county:34",
// "municipality:3403", "alias:3411:Brumunddal". Place numbers stay strings.
export type PlaceOption = { key: string; label: string }
export type PlaceOptionGroups = { counties: PlaceOption[]; municipalities: PlaceOption[] }
type Places = Pick<Catalog, "municipalities" | "counties">

const collator = new Intl.Collator("nb")
const byLabel = (a: PlaceOption, b: PlaceOption) => collator.compare(a.label, b.label)

// The database ids of the kommuner with a row located there or served. The Sted list offers only
// places with data, and a fylke has data when one of its kommuner does.
export function kommunerWithRows(rows: readonly ResourceDto[]): ReadonlySet<number> {
	const ids = new Set<number>()
	for (const r of rows) {
		if (r.municipalityId !== null) ids.add(r.municipalityId)
		for (const id of r.servedMunicipalityIds) ids.add(id)
	}
	return ids
}

// A fylke that is one kommune of the same name (Oslo) is listed once, as the kommune.
function isOneKommune(
	county: { number: string; name: string },
	municipalities: readonly MunicipalityDto[]
): boolean {
	const inside = municipalities.filter((m) => m.countyNumber === county.number)
	return inside.length === 1 && inside[0]?.name === county.name
}

// A kommune name that two fylker share carries its fylke: "Våler (Innlandet)".
export function municipalityLabel(m: MunicipalityDto, places: Places): string {
	const shared = places.municipalities.some((o) => o.number !== m.number && o.name === m.name)
	if (!shared) return m.name
	const county = places.counties.find((c) => c.number === m.countyNumber)?.name ?? m.county
	return `${m.name} (${county})`
}

// The chip label for a picked place, or null when the catalog has no such place.
export function placeLabel(places: Places, key: string): string | null {
	const [kind, number] = key.split(":")
	if (kind === "county") return places.counties.find((c) => c.number === number)?.name ?? null
	if (kind !== "municipality") return null
	const m = places.municipalities.find((x) => x.number === number)
	return m ? municipalityLabel(m, places) : null
}

// Fylker, then kommuner, each in nb order. withRows null means the rows have not loaded yet, and
// then every catalog kommune is offered. Matching folds diacritics both ways, so "lot" finds
// Løten and "Loten" does too.
export function placeOptions(
	catalog: Pick<Catalog, "municipalities" | "counties" | "aliases">,
	withRows: ReadonlySet<number> | null,
	input: string
): PlaceOptionGroups {
	const typed = input.trim()
	const matches = (name: string) => typed === "" || matchesEitherWay(typed, name)
	const listed = catalog.municipalities.filter((m) => withRows === null || withRows.has(m.id))
	const counties = catalog.counties
		.filter((c) => listed.some((m) => m.countyNumber === c.number))
		.filter((c) => !isOneKommune(c, catalog.municipalities) && matches(c.name))
		.map((c) => ({ key: `county:${c.number}`, label: c.name }))
	const municipalities = listed
		.filter((m) => matches(m.name))
		.map((m) => ({ key: `municipality:${m.number}`, label: municipalityLabel(m, catalog) }))
	// Aliases wait for two letters, so an empty field never lists every tettsted (filter spec).
	if (fold(typed).length >= 2) {
		for (const a of catalog.aliases) {
			const m = listed.find((x) => x.number === a.number)
			if (m && matchesEitherWay(typed, a.alias)) {
				municipalities.push({
					key: `alias:${a.number}:${a.alias}`,
					label: `${municipalityLabel(m, catalog)} (${a.alias})`,
				})
			}
		}
	}
	return { counties: counties.sort(byLabel), municipalities: municipalities.sort(byLabel) }
}

export function selectedPlaceKeys(filters: Pick<Filters, "counties" | "municipalities">): string[] {
	return [
		...filters.counties.map((number) => `county:${number}`),
		...filters.municipalities.map((number) => `municipality:${number}`),
	]
}

// The Sted field's keys back to filter state. An alias key picks its kommune. applyPatch sorts
// and dedupes, so an alias for a kommune that is already picked changes nothing.
export function placePatch(keys: readonly string[]): Pick<Filters, "counties" | "municipalities"> {
	const counties: string[] = []
	const municipalities: string[] = []
	for (const key of keys) {
		const [kind, number] = key.split(":")
		if (!number) continue
		if (kind === "county") counties.push(number)
		else if (kind === "municipality" || kind === "alias") municipalities.push(number)
	}
	return { counties, municipalities }
}
