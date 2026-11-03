import { readPage } from "../adapters/read.ts"
import { ADAPTER_NAMES, type AdapterName } from "../adapters/types.ts"
import type { KommuneDiscovery, NationalDiscovery } from "../discover/types.ts"
import type { PageCache } from "../io/pageCache.ts"
import type { CrawlReport, Get, SkipReason } from "../net/crawler.ts"

export type FetchSummary = {
	pages: number
	fetched: number
	byAdapter: Record<AdapterName, number>
	noMainText: number
	notFetched: Partial<Record<SkipReason, number>>
}

// The pages to fetch: each kommune's, at most limit per kommune, and the national ones (Nav
// offices, catalogue findings) only when given, at most limit per source.
export function pagesToFetch(
	kommuner: readonly KommuneDiscovery[],
	national: NationalDiscovery | undefined,
	limit?: number
): string[] {
	const take = (list: readonly string[]) => (limit === undefined ? list : list.slice(0, limit))
	const urls = kommuner.flatMap((k) => take(k.pages.map((p) => p.url)))
	if (national !== undefined) {
		const bySource = new Map<string, string[]>()
		for (const p of national.pages) {
			const source = p.catalogue ?? p.from
			bySource.set(source, [...(bySource.get(source) ?? []), p.url])
		}
		for (const list of bySource.values()) urls.push(...take(list))
	}
	return [...new Set(urls)]
}

// Fetches every page through the crawler (which keeps one request at a time per host, and
// re-checks a host's stop and Visit-time when a queued request's turn comes) and stores it
// with the adapter that read it. The adapter reads the body in hand, not the cache, so a dry
// run (which writes no file) counts the same as a real one. The page text itself never leaves
// the cache.
export async function fetchPages(
	get: Get,
	cache: PageCache,
	urls: readonly string[]
): Promise<FetchSummary> {
	const byAdapter = Object.fromEntries(ADAPTER_NAMES.map((n) => [n, 0])) as Record<
		AdapterName,
		number
	>
	const notFetched: Partial<Record<SkipReason, number>> = {}
	let fetched = 0
	let noMainText = 0
	await Promise.all(
		urls.map(async (url) => {
			const res = await get(url, "html")
			if (!res.ok) {
				notFetched[res.reason] = (notFetched[res.reason] ?? 0) + 1
				return
			}
			// One page that breaks the reader must not cost the run its manifest: it is stored as
			// a fallback page with no main text, and save() still runs.
			let page: { adapter: AdapterName; text: string }
			try {
				page = readPage(res.body, res.finalUrl)
			} catch {
				page = { adapter: "fallback", text: "" }
			}
			cache.put(res, { adapter: page.adapter, textLength: page.text.length })
			fetched++
			byAdapter[page.adapter]++
			if (page.text === "") noMainText++
		})
	)
	return { pages: urls.length, fetched, byAdapter, noMainText, notFetched }
}

// What the command prints: counts and hosts only. URLs go to pages/report.json in the cache.
export function formatFetchSummary(summary: FetchSummary, crawl: CrawlReport): string {
	const skipped = Object.entries(summary.notFetched).map(([reason, n]) => `${reason} ${n}`)
	const stopped = crawl.hosts
		.filter((h) => h.stopped !== undefined)
		.map((h) => `${h.host} (${h.stopped})`)
	return [
		`Fetch: ${summary.fetched} of ${summary.pages} pages fetched`,
		`By adapter: ${ADAPTER_NAMES.map((n) => `${n} ${summary.byAdapter[n]}`).join(", ")}`,
		`No main text: ${summary.noMainText}`,
		`Not fetched: ${skipped.length === 0 ? "none" : skipped.join(", ")}`,
		`Hosts stopped: ${stopped.length === 0 ? "none" : stopped.join(", ")}`,
	].join("\n")
}
