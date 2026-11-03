import { describe, expect, it } from "vitest"
import { looksLikeService } from "../src/discover/pathWords.ts"
import { parseSitemap, readSitemaps } from "../src/discover/sitemap.ts"
import { fakeGet } from "./netHelpers.ts"

const S = "https://www.eksempel.kommune.no"
const NS = 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
const urlset = (...locs: string[]) =>
	`<?xml version="1.0" encoding="UTF-8"?><urlset ${NS}>${locs
		.map((l) => `<url><loc>${l}</loc><lastmod>2026-11-02</lastmod></url>`)
		.join("")}</urlset>`
const index = (...locs: string[]) =>
	`<?xml version="1.0" encoding="UTF-8"?><sitemapindex ${NS}>${locs
		.map((l) => `<sitemap><loc>${l}</loc></sitemap>`)
		.join("")}</sitemapindex>`
const xmlBody = (body: string) => ({ body, contentType: "application/xml" })

describe("parseSitemap", () => {
	it("reads a urlset, trimming each address and keeping lastmod", () => {
		expect(parseSitemap(urlset(` ${S}/helse/ `))).toEqual({
			kind: "urlset",
			urls: [{ loc: `${S}/helse/`, lastmod: "2026-11-02" }],
		})
	})

	it("reads a sitemap index", () => {
		expect(parseSitemap(index(`${S}/sitemap-1.xml`))).toEqual({
			kind: "index",
			sitemaps: [`${S}/sitemap-1.xml`],
		})
	})

	it("calls an HTML page invalid", () => {
		expect(parseSitemap("<!DOCTYPE html><html><body>Fant ikke siden</body></html>")).toEqual({
			kind: "invalid",
		})
	})

	it("never expands an external entity", () => {
		const evil = `<?xml version="1.0"?><!DOCTYPE urlset [<!ENTITY x SYSTEM "file:///etc/passwd">]><urlset ${NS}><url><loc>${S}/&x;</loc></url></urlset>`
		const result = parseSitemap(evil)
		expect(JSON.stringify(result)).not.toContain("root:")
		// Pinned from the first green run: the entity stays as literal text, nothing is read in.
		expect(result).toEqual({ kind: "urlset", urls: [{ loc: `${S}/&x;` }] })
	})
})

describe("readSitemaps", () => {
	it("probes /sitemap.xml when robots.txt names none", async () => {
		const get = fakeGet({ [`${S}/sitemap.xml`]: xmlBody(urlset(`${S}/helse/`)) })
		const result = await readSitemaps(get, "www.eksempel.kommune.no", [])
		expect(result).toMatchObject({ source: "probe", read: 1, failed: 0, truncated: false })
		expect(result.urls.map((u) => u.loc)).toEqual([`${S}/helse/`])
	})

	it("reads the sitemaps robots.txt names, then the probe, and merges what repeats", async () => {
		const get = fakeGet({
			[`${S}/kart.xml`]: xmlBody(urlset(`${S}/a/`, `${S}/b/`)),
			[`${S}/sitemap.xml`]: xmlBody(urlset(`${S}/b/`, `${S}/c/`)),
		})
		const result = await readSitemaps(get, "www.eksempel.kommune.no", [`${S}/kart.xml`])
		expect(result.source).toBe("robots")
		expect(result.urls.map((u) => u.loc)).toEqual([`${S}/a/`, `${S}/b/`, `${S}/c/`])
	})

	it("follows an index to its children on the same site, and no further", async () => {
		const get = fakeGet({
			[`${S}/sitemap.xml`]: xmlBody(
				index(`${S}/s1.xml`, "https://annen.no/s.xml", `${S}/nested.xml`)
			),
			[`${S}/s1.xml`]: xmlBody(
				urlset(`${S}/a/`, "https://annen.no/b/", "https://eksempel.kommune.no/c/")
			),
			[`${S}/nested.xml`]: xmlBody(index(`${S}/s2.xml`)),
		})
		const result = await readSitemaps(get, "www.eksempel.kommune.no", [])
		expect(result.urls.map((u) => u.loc)).toEqual([`${S}/a/`, "https://eksempel.kommune.no/c/"])
		expect(result).toMatchObject({ read: 2, failed: 1 })
	})

	it("stops after 50 child sitemaps and says so", async () => {
		const routes: Record<string, { body: string; contentType: string }> = {}
		const children = Array.from({ length: 51 }, (_, i) => `${S}/s${i}.xml`)
		routes[`${S}/sitemap.xml`] = xmlBody(index(...children))
		for (const [i, child] of children.entries()) routes[child] = xmlBody(urlset(`${S}/side-${i}/`))
		const result = await readSitemaps(fakeGet(routes), "www.eksempel.kommune.no", [])
		expect(result.urls).toHaveLength(50)
		expect(result.truncated).toBe(true)
	})

	it("reports a soft 404 at /sitemap.xml as a failure, never a silent zero", async () => {
		const get = fakeGet({
			[`${S}/sitemap.xml`]: {
				body: "<!DOCTYPE html><html>Fant ikke siden</html>",
				contentType: "text/html",
			},
		})
		expect(await readSitemaps(get, "www.eksempel.kommune.no", [])).toEqual({
			urls: [],
			source: "none",
			read: 0,
			failed: 1,
			truncated: false,
		})
	})
})

describe("looksLikeService", () => {
	it("keeps paths that name a service", () => {
		for (const path of [
			"/helse-og-omsorg/helsestasjon/",
			"/tjenester/nav-og-sosiale-tjenester/",
			"/m%C3%B8teplassen/",
			"/psykisk-helse-og-rus/",
			"/helse/legevakt/",
			"/familie-og-barn/",
		]) {
			expect(looksLikeService(`${S}${path}`), path).toBe(true)
		}
	})

	it("drops paths that do not, and files", () => {
		for (const path of [
			"/barnehage/opptak/",
			"/navn/",
			"/russ/",
			"/politikk/",
			"/dokumenter/helsestasjon.pdf",
		]) {
			expect(looksLikeService(`${S}${path}`), path).toBe(false)
		}
	})
})
