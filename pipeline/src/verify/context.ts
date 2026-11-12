import { readUnitPage } from "../extract/page.ts"
import type { AddressHit, Candidate, GateContext, UnitFacts } from "../gates/types.ts"
import type { ManifestEntry } from "../io/pageCache.ts"
import type { AllowList } from "../net/allowList.ts"
import type { Get } from "../net/crawler.ts"
import { findAddress } from "../registers/kartverket.ts"
import { REGISTER_SOURCES } from "../sources/registers.ts"
import { normaliseUrl } from "../text/normalise.ts"

export type Lookups = Omit<GateContext, "unit" | "peers">

// Registers whose host also serves page evidence. Nav's host serves the office pages the crawler
// fetches, so a Nav URL passes robots only when the manifest holds it.
const PAGE_REGISTERS: ReadonlySet<string> = new Set(["nav"])
const REGISTER_HOSTS: ReadonlySet<string> = new Set(
	Object.entries(REGISTER_SOURCES)
		.filter(([name]) => !PAGE_REGISTERS.has(name))
		.map(([, r]) => r.host)
)

const hostOf = (url: string) => {
	try {
		return new URL(url).hostname.toLowerCase()
	} catch {
		return undefined
	}
}

// Every lookup the gates need that does not depend on the unit. Built once per kommune from the
// cache: robots.txt was checked when the crawler fetched each page, so a URL the manifest holds
// passed it; the host of a register that serves no pages is a documented open API. Anything else
// is refused. A URL I typed in review gets the status verify asked the crawler for (checkedUrls).
export function buildLookups(input: {
	manifest: readonly ManifestEntry[]
	readHtml: (entry: ManifestEntry) => string | undefined
	allowList: AllowList
	validKommuner: ReadonlySet<string>
	addresses: ReadonlyMap<string, AddressHit | undefined>
	checkedUrls?: ReadonlyMap<string, number | undefined>
}): Lookups {
	const byUrl = new Map<string, ManifestEntry>()
	const byNormalised = new Map<string, ManifestEntry>()
	for (const e of input.manifest) {
		byUrl.set(e.url, e)
		byUrl.set(e.finalUrl, e)
		byNormalised.set(normaliseUrl(e.url), e)
		byNormalised.set(normaliseUrl(e.finalUrl), e)
	}
	const texts = new Map<string, string | undefined>()
	const pageText = (url: string): string | undefined => {
		const e = byUrl.get(url)
		if (e === undefined) return undefined
		if (!texts.has(e.url)) {
			const html = input.readHtml(e)
			let text: string | undefined
			try {
				text = html === undefined ? undefined : readUnitPage(html, e.finalUrl).text
			} catch {
				text = undefined
			}
			texts.set(e.url, text)
		}
		return texts.get(e.url)
	}
	return {
		allowedHosts: new Set(input.allowList.entries().map((h) => h.host)),
		robotsAllows: (url) => byUrl.has(url) || REGISTER_HOSTS.has(hostOf(url) ?? ""),
		licence: (host) => input.allowList.licence(host),
		pageText,
		urlStatus: (url) =>
			byNormalised.get(normaliseUrl(url))?.status ?? input.checkedUrls?.get(normaliseUrl(url)),
		findAddress: (address) => input.addresses.get(address),
		validKommuner: input.validKommuner,
	}
}

export function contextFor(
	lookups: Lookups,
	unit: UnitFacts,
	peers: readonly Candidate[]
): GateContext {
	return { ...lookups, unit, peers }
}

// Each distinct address once, through Kartverket, before any gate runs: the gates are
// synchronous, the address API is not.
export async function resolveAddresses(
	get: Get,
	addresses: Iterable<string>,
	kommune: string
): Promise<Map<string, AddressHit | undefined>> {
	const distinct = [...new Set(addresses)]
	const hits = await Promise.all(distinct.map((a) => findAddress(get, a, kommune)))
	return new Map(distinct.map((a, i) => [a, hits[i]]))
}

// The status of each website or chat URL I typed in review, asked once through the crawler, so
// its allow-list, robots and pace apply. A URL the crawler refuses has no 200, so the validity gate
// sends it to review, and my decision settles that review. Review showed me the reason first.
export async function resolveUrls(
	get: Get,
	urls: Iterable<string>
): Promise<Map<string, number | undefined>> {
	const byKey = new Map<string, string>()
	for (const url of urls) if (!byKey.has(normaliseUrl(url))) byKey.set(normaliseUrl(url), url)
	const keys = [...byKey.keys()]
	const answers = await Promise.all(keys.map((k) => get(byKey.get(k) ?? k, "html")))
	return new Map(keys.map((k, i) => [k, answers[i]?.status]))
}

// The value verify stores: Kartverket's own street text, then the page's postcode and place.
export function kartverketForm(value: string, hit: AddressHit): string {
	if (hit.text === undefined) return value
	const comma = value.indexOf(",")
	return comma < 0 ? hit.text : `${hit.text}${value.slice(comma)}`
}
