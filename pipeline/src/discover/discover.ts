import { KOMMUNE_NUMBERS } from "../answerKey/freeze.ts"
import type { AllowList } from "../net/allowList.ts"
import type { Get } from "../net/crawler.ts"
import type { Robots } from "../net/robots.ts"
import {
	type BrregUnit,
	kommuneSites,
	kommuneSitesQuery,
	namedQuery,
	readBrreg,
	unitsQuery,
} from "../registers/brreg.ts"
import { readJson } from "../registers/json.ts"
import {
	changesQuery,
	codesAtQuery,
	type KlassChange,
	type KlassKommune,
	kommuneNameMismatches,
	parseChanges,
	parseCodesAt,
	renumberings,
} from "../registers/klass.ts"
import { isNavOfficeUrl } from "../registers/nav.ts"
import { NAMED_UNITS, ORGANISATION_CODES, UNIT_CODES } from "../registers/sn2025.ts"
import { httpsHost, isFrontPage, siteHost } from "../text/normalise.ts"
import { CATALOGUE_NAMES, runCatalogue } from "./catalogues.ts"
import { looksLikeService } from "./pathWords.ts"
import { readSitemaps, type SiteSitemaps } from "./sitemap.ts"
import type {
	DiscoveredPage,
	DiscoverReport,
	KommuneDiscovery,
	NationalDiscovery,
} from "./types.ts"

// Fetch spends at least 5 seconds per page per host; this keeps one kommune to 25 minutes.
export const MAX_PAGES_PER_KOMMUNE = 300

export class DiscoverError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "DiscoverError"
	}
}

export type DiscoverOptions = {
	get: Get
	robots: (host: string) => Promise<Robots | undefined>
	allowList: AllowList
	date: string
	only: readonly string[]
	now: () => string
}

export type DiscoverRun = {
	kommuner: KommuneDiscovery[]
	national: NationalDiscovery
	renumberings: KlassChange[]
	nameMismatches: string[]
	problems: string[]
}

const NO_SITEMAPS: SiteSitemaps = { urls: [], source: "none", read: 0, failed: 0, truncated: false }

function addProvider(allowList: AllowList, url: string): void {
	const host = httpsHost(url)
	if (host !== undefined) allowList.add(host, "provider", "ownPage")
}

// One copy per URL, sorted, so a re-run on the same answers writes the same file.
function sortPages(pages: readonly DiscoveredPage[]): DiscoveredPage[] {
	const byUrl = new Map<string, DiscoveredPage>()
	for (const p of pages) if (!byUrl.has(p.url)) byUrl.set(p.url, p)
	return [...byUrl.values()].sort((a, b) => (a.url < b.url ? -1 : a.url > b.url ? 1 : 0))
}

function sortUnits(units: readonly BrregUnit[]): BrregUnit[] {
	const byOrg = new Map<string, BrregUnit>()
	for (const u of units) if (!byOrg.has(u.orgNumber)) byOrg.set(u.orgNumber, u)
	return [...byOrg.values()].sort((a, b) => (a.orgNumber < b.orgNumber ? -1 : 1))
}

async function discoverKommune(
	o: DiscoverOptions,
	kommune: KlassKommune,
	site: string | undefined
): Promise<KommuneDiscovery> {
	const reads = await Promise.all([
		readBrreg(o.get, "underenheter", unitsQuery("underenheter", kommune.code, UNIT_CODES)),
		readBrreg(o.get, "enheter", unitsQuery("enheter", kommune.code, ORGANISATION_CODES)),
		...NAMED_UNITS.map((name) => readBrreg(o.get, "underenheter", namedQuery(kommune.code, name))),
	])
	const units = sortUnits(reads.flatMap((r) => r.units))
	for (const u of units) if (u.website !== undefined) addProvider(o.allowList, u.website)
	const host = site === undefined ? undefined : httpsHost(site)
	// Brreg often gives the kommune's front page as a unit's site; fetching it once per unit
	// would add nothing.
	const kommuneSite = host === undefined ? undefined : siteHost(`https://${host}/`)
	const front = new Set(kommuneSite === undefined ? [] : [kommuneSite])
	const sitemaps =
		host === undefined
			? NO_SITEMAPS
			: await readSitemaps(o.get, host, (await o.robots(host))?.sitemaps ?? [])
	const service = sitemaps.urls.filter((u) => looksLikeService(u.loc))
	const kept = service.slice(0, MAX_PAGES_PER_KOMMUNE)
	const pages = sortPages([
		...kept.map(
			(u): DiscoveredPage =>
				u.lastmod === undefined
					? { url: u.loc, from: "sitemap" }
					: { url: u.loc, from: "sitemap", lastmod: u.lastmod }
		),
		...units.flatMap((u): DiscoveredPage[] =>
			u.website !== undefined && !isFrontPage(u.website, front)
				? [{ url: u.website, from: "brreg" }]
				: []
		),
	])
	const discovery: KommuneDiscovery = {
		kommune: kommune.code,
		name: kommune.name,
		discoveredAt: o.now(),
		brregComplete: reads.every((r) => r.complete),
		allSitemapUrls: sitemaps.urls.map((u) => u.loc),
		units,
		pages,
	}
	if (host !== undefined) {
		discovery.site = {
			host,
			sitemap: sitemaps.source,
			sitemapUrls: sitemaps.urls.length,
			servicePages: service.length,
			kept: kept.length,
			truncated: sitemaps.truncated || service.length > kept.length,
		}
	}
	return discovery
}

// Discover: which units and pages exist for the kommuner asked for. No page text, no model,
// nothing written here. Without the KLASS kommune list nothing can be placed, so the run stops
// and the CLI writes nothing.
export async function discover(o: DiscoverOptions): Promise<DiscoverRun> {
	const problems: string[] = []
	const all = parseCodesAt(await readJson(o.get, codesAtQuery(o.date)))
	if (all === undefined) {
		throw new DiscoverError("the KLASS kommune list could not be read: nothing was written")
	}
	const wanted = (code: string) => o.only.some((prefix) => code.startsWith(prefix))
	const kommuner = all.filter((k) => wanted(k.code))
	const from = `${Number(o.date.slice(0, 4)) - 1}-01-01`
	const changes = parseChanges(await readJson(o.get, changesQuery(from, o.date)))
	if (changes === undefined) problems.push("the KLASS change list could not be read")

	const komm = await readBrreg(o.get, "enheter", kommuneSitesQuery)
	if (!komm.complete) problems.push("the Brreg list of kommune sites is incomplete")
	const sites = kommuneSites(komm.units)
	for (const k of kommuner) {
		const site = sites.get(k.code)
		const host = site === undefined ? undefined : httpsHost(site)
		if (host === undefined) problems.push(`${k.code} has no kommune site in Brreg`)
		else o.allowList.add(host, "kommune", "ownPage")
	}

	const [catalogues, nav] = await Promise.all([
		Promise.all(CATALOGUE_NAMES.map((name) => runCatalogue(o.get, name))),
		readSitemaps(o.get, "www.nav.no", []),
	])
	for (const c of catalogues) {
		if (!c.complete) problems.push(`catalogue ${c.name}: ${c.rows} rows, not complete`)
		for (const f of c.findings) addProvider(o.allowList, f.url)
	}
	const navOffices = [...new Set(nav.urls.map((u) => u.loc).filter(isNavOfficeUrl))]
	if (navOffices.length === 0) problems.push("nav.no's sitemap listed no office pages")

	const results = await Promise.all(kommuner.map((k) => discoverKommune(o, k, sites.get(k.code))))
	for (const r of results) {
		if (!r.brregComplete) problems.push(`${r.kommune}: a Brreg read was incomplete`)
	}

	return {
		kommuner: results,
		national: {
			discoveredAt: o.now(),
			pages: sortPages([
				...navOffices.map((url): DiscoveredPage => ({ url, from: "nav" })),
				...catalogues.flatMap((c) =>
					c.findings.map(
						(f): DiscoveredPage => ({ url: f.url, from: "catalogue", catalogue: f.catalogue })
					)
				),
			]),
			catalogues: catalogues.map((c) => ({
				name: c.name,
				rows: c.rows,
				findings: c.findings.length,
				complete: c.complete,
			})),
			navOffices: navOffices.length,
		},
		renumberings: renumberings(changes ?? []).filter((c) => wanted(c.oldCode) || wanted(c.newCode)),
		nameMismatches: kommuneNameMismatches(KOMMUNE_NUMBERS, all),
		problems,
	}
}

const count = <T extends string>(items: readonly T[]) => {
	const counts = new Map<T, number>()
	for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1)
	return [...counts.entries()].map(([k, n]) => `${k} ${n}`).join(", ")
}

// What the command prints. Actions logs are public: counts, kommune numbers and names, hosts
// and reasons only. Never a unit name, an org number, a phone number or a URL.
export function formatDiscoverSummary(run: DiscoverRun, report: DiscoverReport): string {
	const lines = [`Discover on ${report.date}: ${run.kommuner.length} kommuner`]
	for (const k of run.kommuner) {
		const site = k.site
			? `sitemap ${k.site.sitemap} (${k.site.sitemapUrls} paths, ${k.site.servicePages} service, ${k.site.kept} kept${k.site.truncated ? ", cut" : ""})`
			: "no kommune site"
		lines.push(`${k.kommune} ${k.name}: ${k.units.length} units, ${k.pages.length} pages, ${site}`)
	}
	lines.push(
		`Catalogues: ${run.national.catalogues
			.map(
				(c) =>
					`${c.name} ${c.rows} rows, ${c.findings} provider pages${c.complete ? "" : " (not complete)"}`
			)
			.join("; ")}`
	)
	lines.push(`Nav offices: ${run.national.navOffices}`)
	const stopped = report.hosts.filter((h) => h.stopped !== undefined)
	lines.push(
		`Hosts stopped: ${stopped.length === 0 ? "none" : stopped.map((h) => `${h.host} (${h.stopped})`).join(", ")}`
	)
	lines.push(
		`Not fetched: ${report.notFetched.length === 0 ? "none" : count(report.notFetched.map((n) => n.reason))}`
	)
	lines.push(
		`KLASS renumberings: ${run.renumberings.length === 0 ? "none" : run.renumberings.map((c) => `${c.oldCode} to ${c.newCode}`).join(", ")}`
	)
	lines.push(
		`Kommune names against KLASS: ${run.nameMismatches.length === 0 ? "all match" : run.nameMismatches.join("; ")}`
	)
	lines.push(`Problems: ${run.problems.length === 0 ? "none" : run.problems.join("; ")}`)
	return lines.join("\n")
}
