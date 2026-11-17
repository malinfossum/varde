import { z } from "zod"
import type { AddressHit } from "../gates/types.ts"
import type { AddressCache } from "../io/addressCache.ts"
import type { Get } from "../net/crawler.ts"
import { splitAddress, streetKey } from "../text/address.ts"

// Kartverket's address API, CC BY 4.0. PR 3 uses findAddress to build GateContext.findAddress.
export const KARTVERKET_SEARCH = "https://api.kartverket.no/adresser/v1/sok"

export function addressQuery(street: string, kommune: string): string {
	const params = new URLSearchParams({ sok: street, kommunenummer: kommune, treffPerSide: "10" })
	return `${KARTVERKET_SEARCH}?${params}`
}

// poststed comes as Kartverket writes it, in capitals ("EKSEMPELBY").
export type AddressRecord = {
	addressId: string
	kommune: string
	text: string
	postcode?: string
	poststed?: string
}

const Search = z.object({
	adresser: z.array(
		z.object({
			adresseid: z.string(),
			adressetekst: z.string(),
			kommunenummer: z.string(),
			postnummer: z.string().optional(),
			poststed: z.string().optional(),
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
		if (a.poststed !== undefined) record.poststed = a.poststed
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
	const wantedStreet = streetKey(parts.street)
	const hits = records.filter(
		(r) =>
			streetKey(r.text) === wantedStreet &&
			(parts.postcode === undefined || r.postcode === parts.postcode)
	)
	const [hit] = hits
	if (hit === undefined || new Set(hits.map((h) => h.addressId)).size !== 1) return undefined
	return {
		addressId: hit.addressId,
		kommune: hit.kommune,
		text: hit.text,
		...(hit.postcode === undefined ? {} : { postcode: hit.postcode }),
		...(hit.poststed === undefined ? {} : { poststed: hit.poststed }),
	}
}

// One timeout, network error or server error stops api.kartverket.no for the rest of the run, and
// every later request comes back hostSkipped. In verify that is no answer at all: reading it as
// "unknown address" would send every later address to review, and a resume would then skip those
// locks. The message names no search, since a search is page text.
export class AddressLookupError extends Error {
	constructor() {
		super(
			"Kartverket stopped answering in this run, so no address was checked and nothing was written: run verify --resume later"
		)
		this.name = "AddressLookupError"
	}
}

// The cache first (when given), then Kartverket, then the cache again: only an answer that parsed
// is written, so a failed request (a 503, a stopped host) or a body that is no answer is asked
// again next time. Offline, the cache throws on a miss before any request. A stopped host throws
// AddressLookupError when a cache is given (verify); review passes none and gets no hit.
export async function findAddress(
	get: Get,
	wanted: string,
	kommune: string,
	cache?: AddressCache
): Promise<AddressHit | undefined> {
	const parts = splitAddress(wanted)
	if (parts === undefined) return undefined
	const search = streetKey(parts.street)
	const cached = cache?.read(search, kommune)
	if (cached !== undefined) return pickAddress(cached, wanted)
	const res = await get(addressQuery(search, kommune), "json")
	if (!res.ok && res.reason === "hostSkipped" && cache !== undefined) throw new AddressLookupError()
	if (!res.ok) return undefined
	let body: unknown
	try {
		body = JSON.parse(res.body)
	} catch {
		return undefined
	}
	const records = parseAddressSearch(body)
	if (records === undefined) return undefined
	cache?.write(search, kommune, records)
	return pickAddress(records, wanted)
}
