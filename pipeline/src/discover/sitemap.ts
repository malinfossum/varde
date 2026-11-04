import { load } from "cheerio/slim"
import type { Get } from "../net/crawler.ts"
import { siteHost } from "../text/normalise.ts"

// The sitemap protocol caps a file at 50,000 URLs; an index is followed one level down, for
// at most 50 children.
export const MAX_CHILD_SITEMAPS = 50
export const MAX_SITEMAP_URLS = 50_000

export type SitemapUrl = { loc: string; lastmod?: string }
export type SitemapDoc =
	| { kind: "urlset"; urls: SitemapUrl[] }
	| { kind: "index"; sitemaps: string[] }
	| { kind: "invalid" }
export type SiteSitemaps = {
	urls: SitemapUrl[]
	source: "robots" | "probe" | "none"
	read: number
	failed: number
	truncated: boolean
}

const isHttps = (url: string) => /^https:\/\//i.test(url)

// The XML parser leaves entities unexpanded and never reads a DOCTYPE, so an external entity
// cannot pull a file in.
export function parseSitemap(xml: string): SitemapDoc {
	const $ = load(xml, { xml: true })
	if ($("sitemapindex").length > 0) {
		const sitemaps = $("sitemapindex > sitemap > loc")
			.map((_, el) => $(el).text().trim())
			.get()
			.filter(isHttps)
		return { kind: "index", sitemaps }
	}
	if ($("urlset").length === 0) return { kind: "invalid" }
	const urls: SitemapUrl[] = []
	$("urlset > url").each((_, el) => {
		const loc = $(el).children("loc").first().text().trim()
		if (!isHttps(loc)) return
		const lastmod = $(el).children("lastmod").first().text().trim()
		urls.push(lastmod === "" ? { loc } : { loc, lastmod })
	})
	return { kind: "urlset", urls }
}

async function fetchSitemap(get: Get, url: string): Promise<SitemapDoc | undefined> {
	const res = await get(url, "xml")
	if (!res.ok) return undefined
	const doc = parseSitemap(res.body)
	return doc.kind === "invalid" ? undefined : doc
}

// The URLs a site's sitemaps list, on the site itself (www or not). The sitemaps robots.txt
// names are read first, and /sitemap.xml is always tried too: Engerdal serves 773 URLs there
// and names no sitemap. A sitemap that fails or is not a sitemap counts as failed.
export async function readSitemaps(
	get: Get,
	host: string,
	listed: readonly string[],
	maxUrls: number = MAX_SITEMAP_URLS
): Promise<SiteSitemaps> {
	const site = siteHost(`https://${host}/`)
	const sameSite = (url: string) => siteHost(url) === site
	const fromRobots = listed.filter(sameSite)
	const starts = [...new Set([...fromRobots, `https://${host}/sitemap.xml`])]
	const urls = new Map<string, SitemapUrl>()
	let source: SiteSitemaps["source"] = "none"
	let read = 0
	let failed = 0
	let children = 0
	let truncated = false
	const collect = (found: readonly SitemapUrl[]) => {
		for (const u of found) {
			if (!sameSite(u.loc) || urls.has(u.loc)) continue
			if (urls.size >= maxUrls) {
				truncated = true
				return
			}
			urls.set(u.loc, u)
		}
	}
	// Each child is read once, and never again when robots.txt or the probe named it already.
	const seen = new Set(starts)
	for (const start of starts) {
		// Once the cap is reached, no further sitemap is fetched at all.
		if (urls.size >= maxUrls) {
			truncated = true
			break
		}
		const doc = await fetchSitemap(get, start)
		if (doc === undefined || doc.kind === "invalid") {
			failed++
			continue
		}
		read++
		if (source === "none") source = fromRobots.includes(start) ? "robots" : "probe"
		if (doc.kind === "urlset") {
			collect(doc.urls)
			continue
		}
		for (const child of doc.sitemaps.filter(sameSite)) {
			if (seen.has(child)) continue
			seen.add(child)
			if (urls.size >= maxUrls) {
				truncated = true
				break
			}
			if (children >= MAX_CHILD_SITEMAPS) {
				truncated = true
				break
			}
			children++
			// A nested index is not followed: it counts as failed.
			const sub = await fetchSitemap(get, child)
			if (sub?.kind === "urlset") {
				read++
				collect(sub.urls)
			} else {
				failed++
			}
		}
	}
	return { urls: [...urls.values()], source, read, failed, truncated }
}
