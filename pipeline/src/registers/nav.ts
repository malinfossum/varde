import { load } from "cheerio/slim"
import { z } from "zod"

// Nav describes its own offices on nav.no/kontor (licence status ownPage). The office list is
// nav.no's sitemap; each office page embeds NORG2 data in __NEXT_DATA__.
export const NAV_SITEMAP = "https://www.nav.no/sitemap.xml"
const OFFICE_URL = /^https:\/\/www\.nav\.no\/kontor\/[a-z0-9-]+\/?$/

export const isNavOfficeUrl = (url: string) => OFFICE_URL.test(url)

export type NavHours = {
	day?: string
	date?: string
	from?: string
	to?: string
	closed: boolean
	appointmentOnly: boolean
	note?: string
}

export type NavOffice = {
	enhetNr: string
	name: string
	status: string
	orgNumber?: string
	visitingAddress?: string
	hours: NavHours[]
	receptions: number
}

const Flag = z.union([z.boolean(), z.string()]).transform((v) => v === true || v === "true")
const Hours = z.object({
	dag: z.string().optional(),
	dato: z.string().optional(),
	fra: z.string().optional(),
	til: z.string().optional(),
	kommentar: z.string().optional(),
	stengt: Flag.optional(),
	kunTimeavtale: Flag.optional(),
})
const Address = z.object({
	gatenavn: z.string().optional(),
	husnummer: z.string().optional(),
	husbokstav: z.string().optional(),
	postnummer: z.string().optional(),
	poststed: z.string().optional(),
})
const Reception = z.object({
	besoeksadresse: Address.optional(),
	aapningstider: z.array(Hours).optional(),
})
const Office = z.object({
	enhetNr: z.string(),
	navn: z.string(),
	status: z.string(),
	organisasjonsnummer: z.string().optional(),
	beliggenhet: z.object({ hideLocation: z.boolean().optional() }).optional(),
	brukerkontakt: z
		.object({ publikumsmottak: z.union([Reception, z.array(Reception)]).optional() })
		.optional(),
})
const NextData = z.object({
	props: z.object({
		pageProps: z.object({
			content: z.object({ data: z.object({ officeNorgData: z.object({ data: Office }) }) }),
		}),
	}),
})

function formatAddress(a: z.infer<typeof Address> | undefined): string | undefined {
	if (a?.gatenavn === undefined) return undefined
	const street = `${a.gatenavn} ${a.husnummer ?? ""}${a.husbokstav ?? ""}`.trim()
	const place = [a.postnummer, a.poststed].filter((p) => p !== undefined).join(" ")
	return place === "" ? street : `${street}, ${place}`
}

function toHours(h: z.infer<typeof Hours>): NavHours {
	const hours: NavHours = { closed: h.stengt ?? false, appointmentOnly: h.kunTimeavtale ?? false }
	if (h.dag !== undefined) hours.day = h.dag
	if (h.dato !== undefined) hours.date = h.dato
	if (h.fra !== undefined) hours.from = h.fra
	if (h.til !== undefined) hours.to = h.til
	if (h.kommentar !== undefined) hours.note = h.kommentar
	return hours
}

export function parseNavOffice(html: string): NavOffice | undefined {
	const raw = load(html)("script#__NEXT_DATA__").first().text()
	if (raw === "") return undefined
	let json: unknown
	try {
		json = JSON.parse(raw)
	} catch {
		return undefined
	}
	const parsed = NextData.safeParse(json)
	if (!parsed.success) return undefined
	const o = parsed.data.props.pageProps.content.data.officeNorgData.data
	const mottak = o.brukerkontakt?.publikumsmottak
	const receptions = mottak === undefined ? [] : Array.isArray(mottak) ? mottak : [mottak]
	const first = receptions[0]
	const office: NavOffice = {
		enhetNr: o.enhetNr,
		name: o.navn,
		status: o.status,
		hours: (first?.aapningstider ?? []).map(toHours),
		receptions: receptions.length,
	}
	if (o.organisasjonsnummer !== undefined) office.orgNumber = o.organisasjonsnummer
	// Nav hides some offices' location on purpose; Varde follows it.
	const address =
		o.beliggenhet?.hideLocation === true ? undefined : formatAddress(first?.besoeksadresse)
	if (address !== undefined) office.visitingAddress = address
	return office
}
