import { existsSync, readFileSync } from "node:fs"
import { z } from "zod"
import { readPage } from "../adapters/read.ts"
import { ADAPTER_NAMES, type AdapterName } from "../adapters/types.ts"
import type { KommuneDiscovery, NationalDiscovery } from "../discover/types.ts"
import { DAY_MS, type PageCache } from "../io/pageCache.ts"
import {
	type CrawlReport,
	type Get,
	HOST_STOPS,
	type HostLine,
	SKIP_REASONS,
	type SkipReason,
	serverOf,
} from "../net/crawler.ts"

export type FetchSummary = {
	pages: number
	fetched: number
	byAdapter: Record<AdapterName, number>
	noMainText: number
	notFetched: Partial<Record<SkipReason, number>>
}

// Each kommune's pages, at most limit, in discover's order. Progress counts by these.
export function urlsByKommune(
	kommuner: readonly KommuneDiscovery[],
	limit?: number
): Map<string, string[]> {
	return new Map(
		kommuner.map((k): [string, string[]] => {
			const urls = k.pages.map((p) => p.url)
			return [k.kommune, limit === undefined ? urls : urls.slice(0, limit)]
		})
	)
}

// The pages to fetch: each kommune's, at most limit per kommune, and the national ones (Nav
// offices, catalogue findings) only when given, at most limit per source.
export function pagesToFetch(
	kommuner: readonly KommuneDiscovery[],
	national: NationalDiscovery | undefined,
	limit?: number
): string[] {
	const take = (list: readonly string[]) => (limit === undefined ? list : list.slice(0, limit))
	const urls = [...urlsByKommune(kommuner, limit).values()].flat()
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

// The URLs a resumed run still has to fetch. A page this run already stored is skipped whatever
// its age, so a run stopped in the evening and resumed the next afternoon fetches nothing twice.
// Any other page is skipped while its cached copy is under 24 hours old. A page whose file no
// longer matches its entry is fetched again.
export function resumeFilter(
	urls: readonly string[],
	cache: PageCache,
	runId: string,
	nowMs: number
): string[] {
	return urls.filter((url) => {
		const entry = cache.get(url)
		if (entry === undefined || cache.read(entry) === undefined) return true
		if (entry.runId === runId) return false
		return nowMs - Date.parse(entry.fetchedAt) >= DAY_MS
	})
}

const byHost = (a: HostLine, b: HostLine) => (a.host < b.host ? -1 : a.host > b.host ? 1 : 0)

// A resumed run's crawl report merged into the stopped run's. A resumed run asks only for what is
// missing, so its own report would lose every host the first run stopped, and verify would call
// that kommune "no pages fetched" instead of "host stopped". For each host it touched, the
// requests of both runs add up (PR 5 sizes its jobs on them) and the current run's stop and delay
// win, except that a line with no request and no stop keeps the previous run's stop. A previous notFetched line stays only for a URL the current run did not try:
// tried lists what it asked for, and its own notFetched URLs count as tried too. Hosts come out
// sorted by name, as Crawler.report() gives them.
export function mergeCrawlReports(
	previous: CrawlReport | undefined,
	current: CrawlReport,
	tried: readonly string[] = []
): CrawlReport {
	if (previous === undefined) return current
	const hosts = new Map(previous.hosts.map((h) => [h.host, h]))
	for (const h of current.hosts) {
		const before = hosts.get(h.host)
		if (before === undefined) {
			hosts.set(h.host, h)
			continue
		}
		// A line with no request and no stop of its own (a resume stopped before it asked this host
		// anything) must not erase the stop the first run recorded.
		const keepStop = h.requests === 0 && h.stopped === undefined && before.stopped !== undefined
		const { stopped: _drop, ...rest } = h
		hosts.set(h.host, {
			...rest,
			requests: before.requests + h.requests,
			...(keepStop
				? { stopped: before.stopped }
				: h.stopped === undefined
					? {}
					: { stopped: h.stopped }),
		})
	}
	const retried = new Set([...tried, ...current.notFetched.map((n) => n.url)])
	return {
		hosts: [...hosts.values()].sort(byHost),
		notFetched: [...previous.notFetched.filter((n) => !retried.has(n.url)), ...current.notFetched],
	}
}

const Count = z.number().int().nonnegative()
const CrawlReportFile = z.strictObject({
	hosts: z.array(
		z.strictObject({
			host: z.string().min(1),
			requests: Count,
			delayMs: Count,
			stopped: z.enum(HOST_STOPS).optional(),
		})
	),
	notFetched: z.array(
		z.strictObject({
			ok: z.literal(false),
			url: z.string(),
			reason: z.enum(SKIP_REASONS),
			status: z.number().int().optional(),
			contentType: z.string().optional(),
		})
	),
})

// The crawl report in pages/report.json. undefined when there is none, or it does not parse or
// fit (a report from before hosts carried their crawl delay). The file is never printed.
export function readCrawlReport(path: string): CrawlReport | undefined {
	if (!existsSync(path)) return undefined
	try {
		const parsed = CrawlReportFile.safeParse(JSON.parse(readFileSync(path, "utf8")))
		return parsed.success ? parsed.data : undefined
	} catch {
		return undefined
	}
}

// How many servers fetch asks at one time. On 17.11.2026 fetch started all 3,617 hosts of the
// pilot at once, and 2,941 hosts stopped on a timeout: each request's 30 second timer ran while
// its name lookup waited behind the others. Looking up the same names at once the day after
// took 64 seconds. With 20 in flight a lookup waits behind 19 others at most.
export const SERVERS_IN_FLIGHT = 20

// The pages of each server, in the order listed. The servers are the crawler's own (serverOf), so
// a server's subdomains wait in one line here as they do there. A URL that does not parse is its
// own server: the crawler turns it down without a request.
function byServer(urls: readonly string[]): string[][] {
	const groups = new Map<string, string[]>()
	for (const url of urls) {
		const server = URL.canParse(url) ? serverOf(new URL(url).hostname) : url
		const group = groups.get(server)
		if (group === undefined) groups.set(server, [url])
		else group.push(url)
	}
	return [...groups.values()]
}

// Fetches every page through the crawler (which paces each server, and re-checks a host's stop
// and Visit-time before each request) and stores it with the adapter that read it. At most
// SERVERS_IN_FLIGHT servers are asked at one time, each for one page at a time in the order
// listed. The adapter reads the body in hand, not the cache, so a dry run (which writes no file)
// counts the same as a real one. The page text itself never leaves the cache. onPage hears of
// each URL once, when it settles, fetched or not.
export async function fetchPages(
	get: Get,
	cache: PageCache,
	urls: readonly string[],
	onPage?: (url: string) => void
): Promise<FetchSummary> {
	const byAdapter = Object.fromEntries(ADAPTER_NAMES.map((n) => [n, 0])) as Record<
		AdapterName,
		number
	>
	const notFetched: Partial<Record<SkipReason, number>> = {}
	let fetched = 0
	let noMainText = 0
	const fetchOne = async (url: string): Promise<void> => {
		try {
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
		} finally {
			onPage?.(url)
		}
	}
	const servers = byServer(urls)
	let next = 0
	// Each worker takes the next server nobody has started and fetches its pages one by one.
	const worker = async (): Promise<void> => {
		for (let pages = servers[next++]; pages !== undefined; pages = servers[next++]) {
			for (const url of pages) await fetchOne(url)
		}
	}
	await Promise.all(Array.from({ length: Math.min(SERVERS_IN_FLIGHT, servers.length) }, worker))
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
