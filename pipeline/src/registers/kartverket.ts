import { z } from "zod"
import type { AddressHit } from "../gates/types.ts"
import type { Get } from "../net/crawler.ts"
import { splitAddress } from "../text/address.ts"
import { normaliseText } from "../text/normalise.ts"
import { readJson } from "./json.ts"

// Kartverket's address API, CC BY 4.0. PR 3 uses findAddress to build GateContext.findAddress.
export const KARTVERKET_SEARCH = "https://api.kartverket.no/adresser/v1/sok"

export function addressQuery(street: string, kommune: string): string {
	const params = new URLSearchParams({ sok: street, kommunenummer: kommune, treffPerSide: "10" })
	return `${KARTVERKET_SEARCH}?${params}`
}

export type AddressRecord = { addressId: string; kommune: string; text: string; postcode?: string }

const Search = z.object({
	adresser: z.array(
		z.object({
			adresseid: z.string(),
			adressetekst: z.string(),
			kommunenummer: z.string(),
			postnummer: z.string().optional(),
		})
	),
})

export function parseAddressSearch(json: unknown): AddressRecord[] | undefined {
	const parsed = Search.safeParse(json)
	if (!parsed.success) return undefined
	return parsed.data.adresser.map((a) => {
		const record: AddressRecord = {
			addressId: a.adresseid,
			kommune: a.kommunenummer,
			text: a.adressetekst,
		}
		if (a.postnummer !== undefined) record.postcode = a.postnummer
		return record
	})
}

// One address or none: a search that finds two different addresses for the same text proves
// nothing, and a postcode that differs is a different place.
export function pickAddress(
	records: readonly AddressRecord[],
	wanted: string
): AddressHit | undefined {
	const parts = splitAddress(wanted)
	if (parts === undefined) return undefined
	const hits = records.filter(
		(r) =>
			normaliseText(r.text) === parts.street &&
			(parts.postcode === undefined || r.postcode === parts.postcode)
	)
	const [hit] = hits
	if (hit === undefined || new Set(hits.map((h) => h.addressId)).size !== 1) return undefined
	return { addressId: hit.addressId, kommune: hit.kommune }
}

export async function findAddress(
	get: Get,
	wanted: string,
	kommune: string
): Promise<AddressHit | undefined> {
	const parts = splitAddress(wanted)
	if (parts === undefined) return undefined
	const records = parseAddressSearch(await readJson(get, addressQuery(parts.street, kommune)))
	return records === undefined ? undefined : pickAddress(records, wanted)
}
