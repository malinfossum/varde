import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"
import type { KommuneDiscovery, NationalDiscovery } from "../src/discover/types.ts"
import {
	fetchPages,
	formatFetchSummary,
	pagesToFetch,
	SERVERS_IN_FLIGHT,
} from "../src/fetch/fetchPages.ts"
import { PageCache } from "../src/io/pageCache.ts"
import { AllowList } from "../src/net/allowList.ts"
import { Crawler, type Get } from "../src/net/crawler.ts"
import { FakeClock, fakeWeb, html, redirect } from "./netHelpers.ts"

// The real reader, except that a page under /kaster/ makes it throw.
vi.mock("../src/adapters/read.ts", async (importOriginal) => {
	const real = await importOriginal<typeof import("../src/adapters/read.ts")>()
	return {
		...real,
		readPage: (body: string, url: string) => {
			if (url.includes("/kaster/")) throw new Error("the reader broke")
			return real.readPage(body, url)
		},
	}
})

const K = "https://www.eksempel.kommune.no"
const acos = readFileSync(new URL("./fixtures/pages/acos-article.html", import.meta.url), "utf8")

const kommune = (code: string, urls: string[]): KommuneDiscovery => ({
	kommune: code,
	name: "Eksempel",
	discoveredAt: "2026-11-03T12:00:00Z",
	brregComplete: true,
	allSitemapUrls: [],
	units: [],
	pages: urls.map((url) => ({ url, from: "sitemap" })),
})

function crawlerFor(routes: Parameters<typeof fakeWeb>[0]) {
	const allowList = new AllowList([
		{ host: "www.eksempel.kommune.no", kind: "kommune", licence: "ownPage" },
	])
	const web = fakeWeb(routes)
	return new Crawler({ transport: web.transport, clock: new FakeClock(), allowList })
}

describe("pagesToFetch", () => {
	it("takes at most limit pages per kommune, and drops repeats", () => {
		const urls = pagesToFetch(
			[kommune("3405", [`${K}/a/`, `${K}/b/`, `${K}/c/`]), kommune("3407", [`${K}/a/`])],
			undefined,
			2
		)
		expect(urls).toEqual([`${K}/a/`, `${K}/b/`])
	})

	it("adds national pages only when asked, at most limit per source", () => {
		const national: NationalDiscovery = {
			discoveredAt: "2026-11-03T12:00:00Z",
			navOffices: 2,
			catalogues: [],
			pages: [
				{ url: "https://www.nav.no/kontor/nav-a", from: "nav" },
				{ url: "https://www.nav.no/kontor/nav-b", from: "nav" },
				{ url: "https://kirkensbymisjon.no/tilbud-a/", from: "catalogue", catalogue: "bymisjon" },
			],
		}
		expect(pagesToFetch([], national, 1)).toEqual([
			"https://www.nav.no/kontor/nav-a",
			"https://kirkensbymisjon.no/tilbud-a/",
		])
		expect(pagesToFetch([kommune("3405", [`${K}/a/`])], undefined)).toEqual([`${K}/a/`])
	})
})

describe("fetchPages", () => {
	it("stores each page with its adapter and counts what it skipped", async () => {
		const pdf = {
			status: 200,
			headers: { "content-type": "application/pdf" },
			body: Buffer.from("%PDF"),
		}
		const crawler = crawlerFor({
			[`${K}/helse/helsestasjon/`]: html(acos),
			[`${K}/fil.pdf`]: pdf,
			[`${K}/ut/`]: redirect("https://evil.example/"),
		})
		const cache = new PageCache(mkdtempSync(join(tmpdir(), "varde-fetch-")))
		const summary = await fetchPages(crawler.get, cache, [
			`${K}/helse/helsestasjon/`,
			`${K}/fil.pdf`,
			`${K}/ut/`,
		])
		expect(summary).toMatchObject({
			pages: 3,
			fetched: 1,
			noMainText: 0,
			notFetched: { wrongType: 1, notAllowListed: 1 },
		})
		expect(summary.byAdapter.acos).toBe(1)
		expect(cache.get(`${K}/helse/helsestasjon/`)).toMatchObject({ adapter: "acos", status: 200 })

		const printed = formatFetchSummary(summary, crawler.report())
		expect(printed).toContain("acos 1")
		for (const secret of ["Eksempel helsestasjon", "62 00 00 00", "https://"]) {
			expect(printed).not.toContain(secret)
		}
	})

	it("stores a page the reader throws on as fallback with no main text, and still saves", async () => {
		const crawler = crawlerFor({
			[`${K}/kaster/`]: html("<main>Eksempel</main>"),
			[`${K}/helse/helsestasjon/`]: html(acos),
		})
		const dir = mkdtempSync(join(tmpdir(), "varde-fetch-throw-"))
		const cache = new PageCache(dir)
		const summary = await fetchPages(crawler.get, cache, [
			`${K}/kaster/`,
			`${K}/helse/helsestasjon/`,
		])
		expect(summary).toMatchObject({ pages: 2, fetched: 2, noMainText: 1 })
		expect(summary.byAdapter).toMatchObject({ fallback: 1, acos: 1 })
		expect(cache.get(`${K}/kaster/`)).toMatchObject({ adapter: "fallback", textLength: 0 })
		cache.save()
		expect(existsSync(join(dir, "manifest.json"))).toBe(true)
	})

	it("still reads each page in a dry run, which writes no file", async () => {
		const crawler = crawlerFor({ [`${K}/helse/helsestasjon/`]: html(acos) })
		const dir = mkdtempSync(join(tmpdir(), "varde-fetch-dry-"))
		const cache = new PageCache(dir, { dryRun: true })
		const summary = await fetchPages(crawler.get, cache, [`${K}/helse/helsestasjon/`])
		cache.save()
		expect(summary.fetched).toBe(1)
		expect(summary.byAdapter.acos).toBe(1)
		expect(summary.noMainText).toBe(0)
		expect(cache.get(`${K}/helse/helsestasjon/`)).toMatchObject({ adapter: "acos" })
		expect(existsSync(join(dir, "manifest.json"))).toBe(false)
		expect(readdirSync(dir)).toEqual([])
	})
})

// A get that answers on a later tick and counts what it is asked at one time. A server is the
// last two labels of the host name, which holds for every name used below.
function slowGet() {
	const open = new Map<string, number>()
	const asked: string[] = []
	let mostServers = 0
	let mostOnOneServer = 0
	const get: Get = async (url) => {
		const server = new URL(url).hostname.split(".").slice(-2).join(".")
		const now = (open.get(server) ?? 0) + 1
		open.set(server, now)
		asked.push(url)
		mostServers = Math.max(mostServers, open.size)
		mostOnOneServer = Math.max(mostOnOneServer, now)
		await new Promise((resolve) => setImmediate(resolve))
		const left = (open.get(server) ?? 1) - 1
		if (left === 0) open.delete(server)
		else open.set(server, left)
		return { ok: false, url, reason: "httpStatus", status: 404 }
	}
	return { get, asked, seen: () => ({ mostServers, mostOnOneServer }) }
}

describe("fetchPages, servers in flight", () => {
	it("asks at most SERVERS_IN_FLIGHT servers at one time, and still settles every page", async () => {
		const urls = Array.from({ length: SERVERS_IN_FLIGHT * 5 }, (_, i) => `https://lag${i}.no/`)
		const web = slowGet()
		const settled: string[] = []
		const cache = new PageCache(mkdtempSync(join(tmpdir(), "varde-fetch-cap-")), { dryRun: true })
		const summary = await fetchPages(web.get, cache, urls, (url) => settled.push(url))
		expect(web.seen().mostServers).toBe(SERVERS_IN_FLIGHT)
		expect(summary).toMatchObject({ pages: urls.length, fetched: 0 })
		expect(summary.notFetched).toEqual({ httpStatus: urls.length })
		expect([...settled].sort()).toEqual([...urls].sort())
	})

	it("asks one server for one page at a time, in the order listed, its subdomains included", async () => {
		const urls = [
			"https://nord.lag.no/a",
			"https://annet.no/a",
			"https://sor.lag.no/a",
			"https://nord.lag.no/b",
			"https://annet.no/b",
		]
		const web = slowGet()
		const cache = new PageCache(mkdtempSync(join(tmpdir(), "varde-fetch-cap-")), { dryRun: true })
		await fetchPages(web.get, cache, urls)
		expect(web.seen()).toEqual({ mostServers: 2, mostOnOneServer: 1 })
		const of = (server: string) => web.asked.filter((url) => new URL(url).hostname.endsWith(server))
		expect(of("lag.no")).toEqual([
			"https://nord.lag.no/a",
			"https://sor.lag.no/a",
			"https://nord.lag.no/b",
		])
		expect(of("annet.no")).toEqual(["https://annet.no/a", "https://annet.no/b"])
	})

	it("counts a URL that does not parse as not fetched, and fetches the rest", async () => {
		const crawler = crawlerFor({ [`${K}/helse/helsestasjon/`]: html(acos) })
		const cache = new PageCache(mkdtempSync(join(tmpdir(), "varde-fetch-cap-")), { dryRun: true })
		const summary = await fetchPages(crawler.get, cache, [
			"ikke en adresse",
			`${K}/helse/helsestasjon/`,
		])
		expect(summary).toMatchObject({ pages: 2, fetched: 1, notFetched: { notHttps: 1 } })
	})
})
