import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import type { KommuneDiscovery } from "../src/discover/types.ts"
import {
	fetchPages,
	mergeCrawlReports,
	pagesToFetch,
	readCrawlReport,
	resumeFilter,
	urlsByKommune,
} from "../src/fetch/fetchPages.ts"
import { writeJsonAtomic } from "../src/io/files.ts"
import { DAY_MS, PageCache } from "../src/io/pageCache.ts"
import type { CrawlReport, Get } from "../src/net/crawler.ts"
import { fakeGet } from "./netHelpers.ts"

const K = "https://www.eksempel.kommune.no"
const A = `${K}/a/`
const B = `${K}/b/`
const C = `${K}/c/`
const RUN = "run-0001-eksempel"
// fakeGet stamps every page with this fetch time.
const FETCHED = Date.parse("2026-11-03T12:00:00Z")
const body = { body: "<main>Eksempel helsestasjon</main>", contentType: "text/html" }
const tmp = () => mkdtempSync(join(tmpdir(), "varde-resume-"))

// fakeGet's answers, with every URL asked for recorded.
function recording(routes: Parameters<typeof fakeGet>[0]): { get: Get; asked: string[] } {
	const inner = fakeGet(routes)
	const asked: string[] = []
	const get: Get = async (url, kind) => {
		asked.push(url)
		return inner(url, kind)
	}
	return { get, asked }
}

describe("fetch --resume", () => {
	it("fetches only the pages a stopped run is missing", async () => {
		const dir = tmp()
		// Run 1 stores A and B, C fails, and the run stops before save().
		const first = recording({ [A]: body, [B]: body })
		await fetchPages(first.get, new PageCache(dir, { runId: RUN }), [A, B, C])
		expect([...first.asked].sort()).toEqual([A, B, C])
		// The resumed run is a new process: a new cache over the same folder, the same run id,
		// two days later. A and B are this run's, so their age does not matter.
		const cache = new PageCache(dir, { runId: RUN })
		const todo = resumeFilter([A, B, C], cache, RUN, FETCHED + 2 * DAY_MS)
		expect(todo).toEqual([C])
		const second = recording({ [A]: body, [B]: body, [C]: body })
		const summary = await fetchPages(second.get, cache, todo)
		expect(second.asked).toEqual([C])
		expect(summary).toMatchObject({ pages: 1, fetched: 1 })
		expect(cache.entries().map((e) => e.url)).toEqual([A, B, C])
	})

	it("skips another run's page under 24 hours old, and fetches it again from 24 hours on", async () => {
		const dir = tmp()
		await fetchPages(fakeGet({ [A]: body }), new PageCache(dir, { runId: "run-0000-tidligere" }), [
			A,
		])
		const cache = new PageCache(dir, { runId: RUN })
		expect(resumeFilter([A], cache, RUN, FETCHED + DAY_MS - 1)).toEqual([])
		expect(resumeFilter([A], cache, RUN, FETCHED + DAY_MS)).toEqual([A])
	})

	it("fetches again a page whose file no longer matches its entry", async () => {
		const dir = tmp()
		const cache = new PageCache(dir, { runId: RUN })
		await fetchPages(fakeGet({ [A]: body }), cache, [A])
		const entry = cache.get(A)
		if (entry === undefined) throw new Error("the page was not stored")
		writeFileSync(join(dir, entry.file), "<main>Endret</main>")
		expect(resumeFilter([A], new PageCache(dir, { runId: RUN }), RUN, FETCHED)).toEqual([A])
	})
})

describe("fetchPages onPage", () => {
	it("is called once per URL, fetched or not", async () => {
		const seen: string[] = []
		const cache = new PageCache(tmp(), { dryRun: true })
		await fetchPages(fakeGet({ [A]: body }), cache, [A, B], (url) => seen.push(url))
		expect(seen.sort()).toEqual([A, B])
	})
})

describe("mergeCrawlReports", () => {
	const W = "www.eksempel.kommune.no"
	const BOOKING = "booking.eksempel.kommune.no"
	const BOOKING_PAGE = `https://${BOOKING}/time/`
	const previous: CrawlReport = {
		hosts: [
			{ host: BOOKING, requests: 3, delayMs: 5_000, stopped: "timeout" },
			{ host: W, requests: 40, delayMs: 5_000, stopped: "network" },
		],
		notFetched: [
			{ ok: false, url: BOOKING_PAGE, reason: "hostSkipped" },
			{ ok: false, url: A, reason: "hostSkipped" },
			{ ok: false, url: B, reason: "robots" },
		],
	}

	it("keeps the stop of a host the resumed run never touched", () => {
		const current: CrawlReport = {
			hosts: [{ host: W, requests: 2, delayMs: 5_000 }],
			notFetched: [],
		}
		const merged = mergeCrawlReports(previous, current, [A])
		// Requests add up over both runs; the resumed run's line (no stop) wins otherwise.
		expect(merged.hosts).toEqual([
			{ host: BOOKING, requests: 3, delayMs: 5_000, stopped: "timeout" },
			{ host: W, requests: 42, delayMs: 5_000 },
		])
		expect(merged.notFetched.map((n) => n.url)).toEqual([BOOKING_PAGE, B])
	})

	it("keeps a transient stop when the resumed run made no request to the host", () => {
		const current: CrawlReport = {
			hosts: [{ host: BOOKING, requests: 0, delayMs: 5_000 }],
			notFetched: [],
		}
		expect(mergeCrawlReports(previous, current).hosts).toContainEqual({
			host: BOOKING,
			requests: 3,
			delayMs: 5_000,
			stopped: "timeout",
		})
	})

	it("lets a line with requests and no stop replace the previous stop", () => {
		const current: CrawlReport = {
			hosts: [{ host: BOOKING, requests: 2, delayMs: 5_000 }],
			notFetched: [],
		}
		expect(mergeCrawlReports(previous, current).hosts).toContainEqual({
			host: BOOKING,
			requests: 5,
			delayMs: 5_000,
		})
	})

	it("lets a stop of the current run's own win over the previous one", () => {
		const current: CrawlReport = {
			hosts: [{ host: BOOKING, requests: 0, delayMs: 5_000, stopped: "network" }],
			notFetched: [],
		}
		expect(mergeCrawlReports(previous, current).hosts).toContainEqual({
			host: BOOKING,
			requests: 3,
			delayMs: 5_000,
			stopped: "network",
		})
	})

	it("lets the current run's line win for a URL it tried again", () => {
		const current: CrawlReport = {
			hosts: [{ host: W, requests: 1, delayMs: 5_000 }],
			notFetched: [{ ok: false, url: B, reason: "httpStatus", status: 404 }],
		}
		for (const merged of [
			mergeCrawlReports(previous, current, [B]),
			mergeCrawlReports(previous, current),
		]) {
			expect(merged.notFetched.filter((n) => n.url === B)).toEqual([
				{ ok: false, url: B, reason: "httpStatus", status: 404 },
			])
		}
	})

	it("sorts hosts by name as report() does, and gives the current report alone with no previous one", () => {
		const current: CrawlReport = {
			hosts: [{ host: "aaa.eksempel.kommune.no", requests: 1, delayMs: 5_000 }],
			notFetched: [],
		}
		expect(mergeCrawlReports(previous, current).hosts.map((h) => h.host)).toEqual([
			"aaa.eksempel.kommune.no",
			BOOKING,
			W,
		])
		expect(mergeCrawlReports(undefined, current)).toEqual(current)
	})
})

describe("readCrawlReport", () => {
	it("reads the report fetch wrote, and nothing from a missing, broken or older file", () => {
		const path = join(tmp(), "report.json")
		expect(readCrawlReport(path)).toBeUndefined()
		const report: CrawlReport = {
			hosts: [{ host: "www.eksempel.kommune.no", requests: 2, delayMs: 5_000, stopped: "timeout" }],
			notFetched: [{ ok: false, url: A, reason: "hostSkipped" }],
		}
		writeJsonAtomic(path, report)
		expect(readCrawlReport(path)).toEqual(report)
		writeFileSync(path, "{ ikke json")
		expect(readCrawlReport(path)).toBeUndefined()
		// A report written before hosts carried their crawl delay.
		writeJsonAtomic(path, {
			hosts: [{ host: "www.eksempel.kommune.no", requests: 1 }],
			notFetched: [],
		})
		expect(readCrawlReport(path)).toBeUndefined()
	})
})

describe("urlsByKommune", () => {
	const kommune = (code: string, urls: string[]): KommuneDiscovery => ({
		kommune: code,
		name: "Eksempelby",
		discoveredAt: "2026-11-13T09:00:00Z",
		brregComplete: true,
		allSitemapUrls: [],
		units: [],
		pages: urls.map((url) => ({ url, from: "sitemap" })),
	})

	it("gives each kommune's pages, at most limit, as pagesToFetch takes them", () => {
		const kommuner = [kommune("3405", [A, B, C]), kommune("3407", [A])]
		expect(urlsByKommune(kommuner, 2)).toEqual(
			new Map([
				["3405", [A, B]],
				["3407", [A]],
			])
		)
		expect([...urlsByKommune(kommuner).values()].flat()).toEqual([A, B, C, A])
		expect(pagesToFetch(kommuner, undefined, 2)).toEqual([A, B])
	})
})
