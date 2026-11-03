import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import type { KommuneDiscovery, NationalDiscovery } from "../src/discover/types.ts"
import { fetchPages, formatFetchSummary, pagesToFetch } from "../src/fetch/fetchPages.ts"
import { PageCache } from "../src/io/pageCache.ts"
import { AllowList } from "../src/net/allowList.ts"
import { Crawler } from "../src/net/crawler.ts"
import { FakeClock, fakeWeb, html, redirect } from "./netHelpers.ts"

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
