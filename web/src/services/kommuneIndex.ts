import type { ResourceDto } from "../types/api.ts"
import type { KommuneEntry } from "./data.ts"
import { matchesMunicipality } from "./query.ts"

// What /kommune shows (spec 2026-11-06): kommuner grouped by fylke, each with its local service
// count. The count uses the same rule as the kommune page's local list (splitForKommune): own
// and served rows, never national ones. tests/kommuneIndex.test.ts pins the two together.
export type KommuneIndexEntry = { slug: string; name: string; count: number }
export type KommuneIndexGroup = { county: string; kommuner: KommuneIndexEntry[] }
export type KommuneIndex = { groups: KommuneIndexGroup[]; national: number }

const collator = new Intl.Collator("nb")

export function buildKommuneIndex(
	kommuner: readonly KommuneEntry[],
	resources: readonly ResourceDto[]
): KommuneIndex {
	const byCounty = new Map<string, KommuneIndexEntry[]>()
	for (const entry of kommuner) {
		const count = resources.filter((r) => !r.isNational && matchesMunicipality(r, entry.id)).length
		const list = byCounty.get(entry.county) ?? []
		list.push({ slug: entry.slug, name: entry.name, count })
		byCounty.set(entry.county, list)
	}
	const groups = [...byCounty.entries()]
		.sort(([a], [b]) => collator.compare(a, b))
		.map(([county, list]) => ({
			county,
			kommuner: list.sort(
				(a, b) => collator.compare(a.name, b.name) || collator.compare(a.slug, b.slug)
			),
		}))
	return { groups, national: resources.filter((r) => r.isNational).length }
}
