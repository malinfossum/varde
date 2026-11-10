import { z } from "zod"
import { fitsNumberPlan } from "../gates/validity.ts"
import type { Get } from "../net/crawler.ts"
import { asHttpsUrl, phoneDigits } from "../text/normalise.ts"
import { isMobileDigits } from "../text/phone.ts"
import { readJson } from "./json.ts"

export const BRREG_API = "https://data.brreg.no/enhetsregisteret/api"
const SIZE = 100
// Brreg serves at most 10,000 rows per query: (page + 1) x size.
const MAX_PAGES = 100

export type BrregRegister = "enheter" | "underenheter"

export type BrregUnit = {
	orgNumber: string
	name: string
	orgForm: string
	naeringskode?: string
	address?: string
	kommune?: string
	website?: string
	parent?: string
	switchboard?: string
	register: BrregRegister
}

// z.object drops every key it does not name, so mobil and epostadresse are never read. telefon
// is read, and kept only for the kommune's own record (KOMM): its switchboard, rank 3 of the
// phone order. A mobile-shaped value is refused, since a switchboard is never a person's phone.
const Address = z.object({
	adresse: z.array(z.string()).optional(),
	postnummer: z.string().optional(),
	poststed: z.string().optional(),
	kommunenummer: z.string().optional(),
})
const Unit = z.object({
	organisasjonsnummer: z.string().regex(/^\d{9}$/),
	navn: z.string().regex(/\S/),
	organisasjonsform: z.object({ kode: z.string() }),
	naeringskode1: z.object({ kode: z.string() }).optional(),
	beliggenhetsadresse: Address.optional(),
	forretningsadresse: Address.optional(),
	hjemmeside: z.string().optional(),
	telefon: z.string().optional(),
	overordnetEnhet: z.string().optional(),
	slettedato: z.string().optional(),
	nedleggelsesdato: z.string().optional(),
})
const Page = z.object({
	_embedded: z.record(z.string(), z.array(z.unknown())).optional(),
	page: z.object({ totalPages: z.number().int().nonnegative() }),
})

function formatAddress(a: z.infer<typeof Address> | undefined): string | undefined {
	if (a === undefined) return undefined
	const street = (a.adresse ?? []).map((line) => line.trim()).filter((line) => line !== "")
	const place = [a.postnummer, a.poststed]
		.filter((p): p is string => p !== undefined && p.trim() !== "")
		.join(" ")
	const text = [...street, place].filter((part) => part !== "").join(", ")
	return text === "" ? undefined : text
}

// Person data stops here. A sole proprietorship (ENK) is a person, so it is dropped before
// anything is stored, and only counted. Closed and malformed units are dropped the same way.
export function parseBrregPage(
	json: unknown,
	register: BrregRegister
): { units: BrregUnit[]; totalPages: number; skipped: number } | undefined {
	const page = Page.safeParse(json)
	if (!page.success) return undefined
	const units: BrregUnit[] = []
	let skipped = 0
	for (const item of page.data._embedded?.[register] ?? []) {
		const parsed = Unit.safeParse(item)
		if (
			!parsed.success ||
			parsed.data.organisasjonsform.kode === "ENK" ||
			parsed.data.slettedato !== undefined ||
			parsed.data.nedleggelsesdato !== undefined
		) {
			skipped++
			continue
		}
		const u = parsed.data
		const where = u.beliggenhetsadresse ?? u.forretningsadresse
		const unit: BrregUnit = {
			orgNumber: u.organisasjonsnummer,
			name: u.navn.trim(),
			orgForm: u.organisasjonsform.kode,
			register,
		}
		if (u.naeringskode1 !== undefined) unit.naeringskode = u.naeringskode1.kode
		const address = formatAddress(where)
		if (address !== undefined) unit.address = address
		if (where?.kommunenummer !== undefined) unit.kommune = where.kommunenummer
		const website = u.hjemmeside === undefined ? undefined : asHttpsUrl(u.hjemmeside)
		if (website !== undefined) unit.website = website
		if (u.overordnetEnhet !== undefined) unit.parent = u.overordnetEnhet
		const phone = u.telefon?.trim()
		if (u.organisasjonsform.kode === "KOMM" && phone !== undefined) {
			const digits = phoneDigits(phone)
			if (fitsNumberPlan(digits) && !isMobileDigits(digits)) unit.switchboard = phone
		}
		units.push(unit)
	}
	return { units, totalPages: page.data.page.totalPages, skipped }
}

export const kommuneSitesQuery = (page: number) =>
	`${BRREG_API}/enheter?organisasjonsform=KOMM&size=${SIZE}&page=${page}`

export const unitsQuery =
	(register: BrregRegister, kommune: string, codes: readonly string[]) => (page: number) =>
		`${BRREG_API}/${register}?kommunenummer=${kommune}&naeringskode=${codes.join(",")}&size=${SIZE}&page=${page}`

export const namedQuery = (kommune: string, name: string) => (page: number) =>
	`${BRREG_API}/underenheter?kommunenummer=${kommune}&navn=${encodeURIComponent(name)}&size=${SIZE}&page=${page}`

// Every page of one query. complete is false when a page failed, did not parse, or the
// query hit Brreg's 10,000-row cap.
export async function readBrreg(
	get: Get,
	register: BrregRegister,
	query: (page: number) => string
): Promise<{ units: BrregUnit[]; complete: boolean; skipped: number }> {
	const units: BrregUnit[] = []
	let skipped = 0
	for (let page = 0; page < MAX_PAGES; page++) {
		const json = await readJson(get, query(page))
		if (json === undefined) return { units, complete: false, skipped }
		const parsed = parseBrregPage(json, register)
		if (parsed === undefined) return { units, complete: false, skipped }
		units.push(...parsed.units)
		skipped += parsed.skipped
		if (page + 1 >= parsed.totalPages) return { units, complete: true, skipped }
	}
	return { units, complete: false, skipped }
}

// Each kommune's own site, from its KOMM unit in Brreg.
export function kommuneSites(units: readonly BrregUnit[]): Map<string, string> {
	const sites = new Map<string, string>()
	for (const u of units) {
		if (u.orgForm === "KOMM" && u.kommune !== undefined && u.website !== undefined) {
			sites.set(u.kommune, u.website)
		}
	}
	return sites
}

// Each kommune's switchboard, from its KOMM record, with the record's org number as evidence.
export function kommuneSwitchboards(
	units: readonly BrregUnit[]
): Map<string, { phone: string; orgNumber: string }> {
	const boards = new Map<string, { phone: string; orgNumber: string }>()
	for (const u of units) {
		if (u.orgForm === "KOMM" && u.kommune !== undefined && u.switchboard !== undefined) {
			boards.set(u.kommune, { phone: u.switchboard, orgNumber: u.orgNumber })
		}
	}
	return boards
}

export const brregRecordUrl = (register: BrregRegister, orgNumber: string) =>
	`${BRREG_API}/${register}/${orgNumber}`
