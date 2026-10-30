import { AnswerKey } from "./schema.ts"

// KLASS classification 131, codes valid on 2026-10-28, copied from
// https://data.ssb.no/api/klass/v1/classifications/131/codesAt?date=2026-10-28
export const KOMMUNE_NUMBERS: Readonly<Record<string, string>> = {
	Hamar: "3403",
	Lillehammer: "3405",
	Gjøvik: "3407",
	Ringsaker: "3411",
	Løten: "3412",
	Stange: "3413",
	Elverum: "3420",
	Oslo: "0301",
}

export const KEY_SOURCE = "https://varde.pages.dev/data/resources.nb.json"

// The fields of the site's resources.{nb,en}.json this key reads.
export type LiveRow = {
	id: number
	name: string
	municipalityId: number | null
	municipalityName: string | null
	isNational: boolean
	isAlwaysOpen: boolean
	isLowThreshold: boolean
	cost: "free" | "paid" | "partly" | null
	costNote: string | null
	address: string | null
	phone: string | null
	email: string | null
	website: string | null
	chatUrl: string | null
	openingHours: string | null
	categories: { slug: string }[]
	servedMunicipalityIds: number[]
	parentId: number | null
}
export type LiveMunicipality = { id: number; name: string }

function klass(name: string): string {
	const code = KOMMUNE_NUMBERS[name]
	if (code === undefined) throw new Error(`no KLASS number for kommune ${name}`)
	return code
}

export function freezeKey(
	nb: LiveRow[],
	en: LiveRow[],
	municipalities: LiveMunicipality[],
	frozenOn: string
): AnswerKey {
	const enById = new Map(en.map((r) => [r.id, r]))
	const nameById = new Map(municipalities.map((m) => [m.id, m.name]))
	const rows = [...nb]
		.sort((a, b) => a.id - b.id)
		.map((r) => {
			const twin = enById.get(r.id)
			if (twin === undefined) throw new Error(`row ${r.id} has no English twin`)
			return {
				id: r.id,
				kommune: r.municipalityName === null ? null : klass(r.municipalityName),
				national: r.isNational,
				servedKommuner: r.servedMunicipalityIds.map((id) => {
					const name = nameById.get(id)
					if (name === undefined) throw new Error(`row ${r.id} serves unknown municipality ${id}`)
					return klass(name)
				}),
				parentId: r.parentId,
				name: r.name,
				nameEn: twin.name,
				categories: r.categories.map((c) => c.slug),
				fields: {
					phone: r.phone,
					address: r.address,
					email: r.email,
					website: r.website,
					chatUrl: r.chatUrl,
					openingHours: r.openingHours,
					cost: r.cost,
					costNote: r.costNote,
					alwaysOpen: r.isAlwaysOpen,
					lowThreshold: r.isLowThreshold,
				},
			}
		})
	return AnswerKey.parse({ frozenOn, source: KEY_SOURCE, rows })
}
