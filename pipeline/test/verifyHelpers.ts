import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { DiscoveredUnit, KommuneDiscovery } from "../src/discover/types.ts"
import { extractionPath, extractScope } from "../src/extract/extract.ts"
import { writeJsonAtomic } from "../src/io/files.ts"
import { PageCache } from "../src/io/pageCache.ts"
import { AllowList } from "../src/net/allowList.ts"
import type { Fetched, Get } from "../src/net/crawler.ts"
import { addressQuery } from "../src/registers/kartverket.ts"
import type { VerifyInput } from "../src/verify/verify.ts"
import { fakeGet } from "./netHelpers.ts"

// The fictional barneverntjeneste of verify.test.ts, with its extraction file written to a temp
// cache, as extract leaves it for verify. Every value is fictional.
export const K = "https://www.eksempel.kommune.no"
export const NOW = "2026-11-06T10:00:00Z"
export const BV = `${K}/barnevern/`
export const CTX = { places: ["Lillehammer"], kommuneHost: "www.eksempel.kommune.no" }

export const html = (body: string) =>
	`<html><head><meta name="acos-cmscontext" content="x"></head><body><main class="main">${body}</main></body></html>`

export const H1 = "<h1>Eksempel barneverntjeneste</h1>"

export const UNIT_PAGE = html(
	[
		H1,
		"<p>Barneverntjenesten er gratis, og du trenger ikke henvisning.</p>",
		"<h2>Kontakt</h2>",
		"<p>Telefon: 62 00 00 00</p>",
		'<p>E-post: <a href="mailto:barnevern@eksempel.kommune.no">barnevern@eksempel.kommune.no</a></p>',
		"<p>Besøksadresse: Storgata 1, 2609 Lillehammer</p>",
		"<h2>Åpningstider</h2>",
		"<p>Mandag 08.00-15.30</p>",
	].join("")
)

export const unit = (over: Partial<DiscoveredUnit> = {}): DiscoveredUnit => ({
	orgNumber: "999999991",
	name: "EKSEMPEL KOMMUNE BARNEVERNTJENESTE",
	orgForm: "BEDR",
	naeringskode: "88.991",
	address: "Storgata 1, 2609 LILLEHAMMER",
	kommune: "3405",
	website: BV,
	register: "underenheter",
	...over,
})

export const fetched = (
	url: string,
	body: string,
	fetchedAt = "2026-11-06T09:00:00Z"
): Fetched => ({
	ok: true,
	url,
	finalUrl: url,
	status: 200,
	contentType: "text/html",
	headers: {},
	body,
	fetchedAt,
})

export const address = (
	id: string,
	text: string,
	postnummer = "2609",
	poststed: string | null = "LILLEHAMMER"
) => ({
	body: JSON.stringify({
		adresser: [
			{
				adresseid: id,
				adressetekst: text,
				kommunenummer: "3405",
				postnummer,
				...(poststed === null ? {} : { poststed }),
			},
		],
	}),
})
export const KARTVERKET = {
	[addressQuery("storgata 1", "3405")]: address("a1", "Storgata 1"),
	[addressQuery("storgata 2", "3405")]: address("a2", "Storgata 2"),
}
export const kartverket = fakeGet(KARTVERKET)

export function verifySetup(o: {
	pages: Record<string, string>
	units?: DiscoveredUnit[]
	get?: Get
}): { dir: string; cacheDir: string; dataDir: string; input: VerifyInput } {
	const dir = mkdtempSync(join(tmpdir(), "varde-resume-"))
	const cacheDir = join(dir, "cache")
	const dataDir = join(dir, "data")
	const cache = new PageCache(join(cacheDir, "pages"))
	for (const [url, body] of Object.entries(o.pages))
		cache.put(fetched(url, body), { adapter: "acos" })
	const kommune: KommuneDiscovery = {
		kommune: "3405",
		name: "Lillehammer",
		discoveredAt: NOW,
		site: {
			host: "www.eksempel.kommune.no",
			sitemap: "probe",
			sitemapUrls: 1,
			servicePages: 1,
			kept: 1,
			truncated: false,
		},
		brregComplete: true,
		allSitemapUrls: [],
		units: o.units ?? [],
		pages: Object.keys(o.pages).map((url) => ({ url, from: "sitemap" as const })),
	}
	const { file } = extractScope("3405", Object.keys(o.pages), cache, CTX, NOW)
	writeJsonAtomic(extractionPath(cacheDir, "3405"), file)
	const input: VerifyInput = {
		kommune,
		extraction: file,
		manifest: cache.entries(),
		readHtml: (e) => cache.read(e),
		allowList: AllowList.restore([
			{ host: "www.eksempel.kommune.no", kind: "kommune", licence: "ownPage" },
		]),
		validKommuner: new Set(["3405"]),
		places: CTX.places,
		get: o.get ?? kartverket,
		now: NOW,
	}
	return { dir, cacheDir, dataDir, input }
}
