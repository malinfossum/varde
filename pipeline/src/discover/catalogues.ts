import { load } from "cheerio/slim"
import { getDomain } from "tldts"
import { z } from "zod"
import type { Get } from "../net/crawler.ts"
import { NOT_PROVIDER_DOMAINS } from "../sources/hosts.ts"
import { asHttpsUrl, httpsHost } from "../text/normalise.ts"

// A catalogue only points to a provider's own page: the database right (åndsverkloven § 24)
// protects the catalogue as a whole, so no field value is ever read from it. Finders read
// links only, never cell text.
export const CATALOGUE_NAMES = [
	"dinutvei",
	"konfliktraadet",
	"bymisjon",
	"frivilligsentral",
] as const
export type CatalogueName = (typeof CATALOGUE_NAMES)[number]
export type Finding = { catalogue: CatalogueName; url: string }
export type CatalogueRun = {
	name: CatalogueName
	rows: number
	findings: Finding[]
	complete: boolean
}

type WpName = Exclude<CatalogueName, "frivilligsentral">
type WpList = { base: string; fields: string; take: "link" | "content" }

// dinutvei lists help services others run: the provider's site is a link in the entry.
// Konfliktrådet and Kirkens Bymisjon list their own offices and tilbud: the entry's link is it.
const WP_LISTS: Readonly<Record<WpName, WpList>> = {
	dinutvei: {
		base: "https://dinutvei.no/wp-json/wp/v2/help",
		fields: "id,link,content",
		take: "content",
	},
	konfliktraadet: {
		base: "https://konfliktraadet.no/wp-json/wp/v2/ditt_konfliktrad",
		fields: "id,link",
		take: "link",
	},
	bymisjon: {
		base: "https://kirkensbymisjon.no/wp-json/wp/v2/tilbud",
		fields: "id,link",
		take: "link",
	},
}
const MAX_WP_PAGES = 20
const WP_PER_PAGE = 100

export const FRIVILLIGSENTRAL_REGISTER = "https://frivilligsentral.no/register"

export const wpQuery = (name: WpName, page: number) =>
	`${WP_LISTS[name].base}?per_page=${WP_PER_PAGE}&page=${page}&_fields=${WP_LISTS[name].fields}`

const WpItems = z.array(
	z.object({
		id: z.number(),
		link: z.string().optional(),
		content: z.object({ rendered: z.string() }).optional(),
	})
)

// Absolute links to a provider's own site. Relative links stay inside the catalogue; mailto
// and tel are not pages; social networks are never a provider's own site.
function providerUrls(html: string, isCatalogue: (host: string) => boolean): string[] {
	const $ = load(html)
	const urls = new Set<string>()
	$("a[href]").each((_, el) => {
		const href = ($(el).attr("href") ?? "").trim()
		if (!/^https?:\/\//i.test(href)) return
		const url = asHttpsUrl(href)
		const host = url === undefined ? undefined : httpsHost(url)
		if (url === undefined || host === undefined || isCatalogue(host)) return
		if (NOT_PROVIDER_DOMAINS.includes(getDomain(host) ?? host)) return
		const clean = new URL(url)
		clean.hash = ""
		urls.add(clean.href)
	})
	return [...urls]
}

const isDinutvei = (host: string) => ["dinutvei.no", "nkvts.no"].includes(getDomain(host) ?? host)
// Only the register itself: hamar.frivilligsentral.no is a sentral's own site.
const isFrivilligsentralRegister = (host: string) =>
	host === "frivilligsentral.no" || host === "www.frivilligsentral.no"

export function findInWpPage(
	name: WpName,
	json: unknown
): { rows: number; urls: string[] } | undefined {
	const parsed = WpItems.safeParse(json)
	if (!parsed.success) return undefined
	const urls = parsed.data.flatMap((item) => {
		if (WP_LISTS[name].take === "content")
			return providerUrls(item.content?.rendered ?? "", isDinutvei)
		return item.link !== undefined && httpsHost(item.link) !== undefined ? [item.link] : []
	})
	return { rows: parsed.data.length, urls }
}

// The register's table has a person's name, phone and email in most rows. Only links are
// read, and only those that leave the register.
export function findInFrivilligsentralRegister(html: string): { rows: number; urls: string[] } {
	const $ = load(html)
	const rows = $("table tr").filter((_, tr) => $(tr).find("td").length > 0)
	const urls = new Set<string>()
	rows.each((_, tr) => {
		for (const url of providerUrls($.html(tr), isFrivilligsentralRegister)) urls.add(url)
	})
	return { rows: rows.length, urls: [...urls] }
}

const toFindings = (name: CatalogueName, urls: readonly string[]): Finding[] =>
	[...new Set(urls)].sort().map((url) => ({ catalogue: name, url }))

// A catalogue run is complete only when every page was read and it had rows. A catalogue that
// finds nothing is a failure in the report, never a silent zero.
export async function runCatalogue(get: Get, name: CatalogueName): Promise<CatalogueRun> {
	if (name === "frivilligsentral") {
		const res = await get(FRIVILLIGSENTRAL_REGISTER, "html")
		if (!res.ok) return { name, rows: 0, findings: [], complete: false }
		const found = findInFrivilligsentralRegister(res.body)
		return {
			name,
			rows: found.rows,
			findings: toFindings(name, found.urls),
			complete: found.rows > 0,
		}
	}
	let rows = 0
	const urls: string[] = []
	const stop = (complete: boolean): CatalogueRun => ({
		name,
		rows,
		findings: toFindings(name, urls),
		complete: complete && rows > 0,
	})
	for (let page = 1; page <= MAX_WP_PAGES; page++) {
		const res = await get(wpQuery(name, page), "json")
		if (!res.ok) return stop(false)
		let json: unknown
		try {
			json = JSON.parse(res.body)
		} catch {
			return stop(false)
		}
		const found = findInWpPage(name, json)
		if (found === undefined) return stop(false)
		rows += found.rows
		urls.push(...found.urls)
		// No header: the page is the last one only if it held fewer than a full page.
		const header = res.headers["x-wp-totalpages"]
		if (header === undefined) {
			if (found.rows < WP_PER_PAGE) return stop(true)
			return stop(false)
		}
		if (!/^\d+$/.test(header)) return stop(false)
		if (page >= Number(header)) return stop(true)
	}
	return stop(false)
}
