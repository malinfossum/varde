import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { FRIVILLIGSENTRAL_REGISTER, wpQuery } from "../src/discover/catalogues.ts"
import { DiscoverError, discover, formatDiscoverSummary } from "../src/discover/discover.ts"
import { readDiscovery, writeDiscovery } from "../src/discover/files.ts"
import type { DiscoverReport } from "../src/discover/types.ts"
import { AllowList } from "../src/net/allowList.ts"
import { Crawler } from "../src/net/crawler.ts"
import { kommuneSitesQuery, namedQuery, unitsQuery } from "../src/registers/brreg.ts"
import { changesQuery, codesAtQuery } from "../src/registers/klass.ts"
import { NAV_SITEMAP } from "../src/registers/nav.ts"
import { NAMED_UNITS, ORGANISATION_CODES, UNIT_CODES } from "../src/registers/sn2025.ts"
import { FakeClock, fakeWeb, html, json, type Route, redirect, text, xml } from "./netHelpers.ts"

const fixture = (path: string): unknown =>
	JSON.parse(readFileSync(new URL(`./fixtures/${path}`, import.meta.url), "utf8"))
const urlset = (...locs: string[]) =>
	`<?xml version="1.0"?><urlset>${locs.map((l) => `<url><loc>${l}</loc><lastmod>2026-11-02</lastmod></url>`).join("")}</urlset>`
const EMPTY = json({ page: { totalPages: 0 } })
const L = "https://lillehammer.kommune.no"

function web(): Record<string, Route> {
	return {
		[codesAtQuery("2026-11-03")]: json(fixture("klass/codes-at-2026-11-03.json")),
		[changesQuery("2025-01-01", "2026-11-03")]: json({
			codeChanges: [
				{
					oldCode: "0301",
					oldName: "Oslo",
					newCode: "0301",
					newName: "Oslo - Oslove",
					changeOccurred: "2026-01-01",
				},
			],
		}),
		[kommuneSitesQuery(0)]: json(fixture("brreg/komm.json")),
		[unitsQuery("underenheter", "3405", UNIT_CODES)(0)]: json(fixture("brreg/units.json")),
		[unitsQuery("enheter", "3405", ORGANISATION_CODES)(0)]: EMPTY,
		...Object.fromEntries(NAMED_UNITS.map((n) => [namedQuery("3405", n)(0), EMPTY])),
		[wpQuery("dinutvei", 1)]: json(
			[
				{
					id: 1,
					content: { rendered: '<a href="https://www.krisesenter-eksempel.no/">Nettside</a>' },
				},
			],
			{ "x-wp-totalpages": "1" }
		),
		[wpQuery("konfliktraadet", 1)]: json([
			{ id: 1, link: "https://konfliktraadet.no/ditt_konfliktrad/eksempel/" },
		]),
		[wpQuery("bymisjon", 1)]: json([
			{ id: 1, link: "https://kirkensbymisjon.no/tilbud-eksempel/" },
		]),
		"https://frivilligsentral.no/robots.txt": text(
			"User-agent: *\nDisallow:\nVisit-time: 0200-0500 UTC+1"
		),
		[FRIVILLIGSENTRAL_REGISTER]: html("<table><tr><td>Eksempel</td></tr></table>"),
		[NAV_SITEMAP]: xml(
			urlset(
				"https://www.nav.no/kontor/nav-eksempel",
				"https://www.nav.no/kontor/nav-annet",
				"https://www.nav.no/no/person"
			)
		),
		"https://www.lillehammer.kommune.no/sitemap.xml": redirect(`${L}/sitemap.xml`),
		[`${L}/sitemap.xml`]: xml(
			urlset(`${L}/helse/helsestasjonen/`, `${L}/barnehage/opptak/`, `${L}/dokumenter/skjema.pdf`)
		),
	}
}

async function run(routes = web()) {
	const allowList = new AllowList()
	const crawler = new Crawler({
		transport: fakeWeb(routes).transport,
		clock: new FakeClock(),
		allowList,
	})
	const result = await discover({
		get: crawler.get,
		robots: (host) => crawler.robots(host),
		allowList,
		date: "2026-11-03",
		only: ["3405"],
		now: () => "2026-11-03T12:00:00Z",
	})
	const crawl = crawler.report()
	const report: DiscoverReport = {
		ranAt: "2026-11-03T12:30:00Z",
		date: "2026-11-03",
		only: ["3405"],
		kommuner: result.kommuner.map((k) => k.kommune),
		renumberings: result.renumberings,
		nameMismatches: result.nameMismatches,
		problems: result.problems,
		hosts: crawl.hosts,
		notFetched: crawl.notFetched,
	}
	return { result, report, allowList }
}

describe("discover", () => {
	it("lists a kommune's units and service pages from Brreg and its sitemap", async () => {
		const { result } = await run()
		expect(result.kommuner).toHaveLength(1)
		const k = result.kommuner[0]
		expect(k).toMatchObject({ kommune: "3405", name: "Lillehammer", brregComplete: true })
		expect(k?.units.map((u) => u.orgNumber)).toEqual(["999999991"])
		expect(k?.pages).toEqual([
			{ url: `${L}/helse/helsestasjonen/`, from: "sitemap", lastmod: "2026-11-02" },
			{ url: "https://www.lillehammer.kommune.no/helsestasjon/", from: "brreg" },
		])
		expect(k?.site).toEqual({
			host: "www.lillehammer.kommune.no",
			sitemap: "probe",
			sitemapUrls: 3,
			servicePages: 1,
			kept: 1,
			truncated: false,
		})
		expect(k?.allSitemapUrls).toHaveLength(3)
	})

	it("lists Nav offices and catalogue findings nationally, and allow-lists their hosts", async () => {
		const { result, allowList } = await run()
		expect(result.national.navOffices).toBe(2)
		expect(result.national.pages.map((p) => p.url)).toEqual([
			"https://kirkensbymisjon.no/tilbud-eksempel/",
			"https://konfliktraadet.no/ditt_konfliktrad/eksempel/",
			"https://www.krisesenter-eksempel.no/",
			"https://www.nav.no/kontor/nav-annet",
			"https://www.nav.no/kontor/nav-eksempel",
		])
		expect(allowList.get("www.krisesenter-eksempel.no")).toMatchObject({
			kind: "provider",
			licence: "ownPage",
		})
		expect(allowList.get("lillehammer.kommune.no")).toMatchObject({ kind: "kommune" })
	})

	it("skips frivilligsentral.no outside its visiting hours and says so", async () => {
		const { result, report } = await run()
		expect(result.national.catalogues.find((c) => c.name === "frivilligsentral")).toEqual({
			name: "frivilligsentral",
			rows: 0,
			findings: 0,
			complete: false,
		})
		expect(result.problems).toContain("catalogue frivilligsentral: 0 rows, not complete")
		expect(report.hosts.find((h) => h.host === "frivilligsentral.no")?.stopped).toBe("visitTime")
	})

	it("checks the kommune names against KLASS, and keeps a rename out of the review list", async () => {
		const { result } = await run()
		expect(result.nameMismatches).toEqual([])
		expect(result.renumberings).toEqual([])
	})

	it("prints counts and hosts, never a unit name, org number, phone number or URL", async () => {
		const { result, report } = await run()
		const summary = formatDiscoverSummary(result, report)
		expect(summary).toContain("3405 Lillehammer")
		expect(summary).toContain("frivilligsentral.no (visitTime)")
		for (const secret of ["HELSESTASJON", "999999991", "62 00 00 00", "Kari", "https://"]) {
			expect(summary).not.toContain(secret)
		}
	})

	it("stops and writes nothing when the KLASS kommune list cannot be read", async () => {
		const routes = web()
		routes[codesAtQuery("2026-11-03")] = html("", 500)
		await expect(run(routes)).rejects.toBeInstanceOf(DiscoverError)
	})
})

describe("discover files", () => {
	it("round-trips through the cache folder", async () => {
		const { result, report, allowList } = await run()
		const dir = mkdtempSync(join(tmpdir(), "varde-discover-"))
		writeDiscovery(dir, result, report, allowList.entries())
		const back = readDiscovery(dir)
		expect(back.kommuner).toEqual(result.kommuner)
		expect(back.national).toEqual(result.national)
		expect(back.report).toEqual(report)
		expect(back.hosts).toEqual(allowList.entries())
	})

	it("says what is missing without quoting any file", () => {
		const dir = mkdtempSync(join(tmpdir(), "varde-discover-"))
		expect(() => readDiscovery(dir)).toThrow("report.json is missing: run discover first")
	})

	it("leaves no report behind when a write stops halfway", async () => {
		const { result, report, allowList } = await run()
		const dir = mkdtempSync(join(tmpdir(), "varde-discover-"))
		writeDiscovery(dir, result, report, allowList.entries())
		// A file where the kommuner folder should be makes the next write fail at its first file.
		rmSync(join(dir, "kommuner"), { recursive: true })
		writeFileSync(join(dir, "kommuner"), "")
		expect(() => writeDiscovery(dir, result, report, allowList.entries())).toThrow()
		expect(() => readDiscovery(dir)).toThrow("report.json is missing: run discover first")
	})
})
