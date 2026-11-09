import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
	extractionPath,
	extractPage,
	extractScope,
	extractScopes,
	formatExtractSummary,
	purgeExtractions,
} from "../src/extract/extract.ts"
import { addressCandidates } from "../src/extract/fields/address.ts"
import { emailCandidates } from "../src/extract/fields/email.ts"
import { lavterskelQuotes } from "../src/extract/fields/lavterskel.ts"
import { phoneCandidates } from "../src/extract/fields/phone.ts"
import { PageCache } from "../src/io/pageCache.ts"
import type { Fetched } from "../src/net/crawler.ts"
import { formatHours } from "../src/text/hours.ts"
import { possibleNames } from "../src/text/names.ts"
import { MAX_LINE, quoteHasPhone } from "../src/text/normalise.ts"
import { findPhones } from "../src/text/phone.ts"

const page = (name: string) =>
	readFileSync(new URL(`./fixtures/pages/${name}`, import.meta.url), "utf8")
const A = "https://www.eksempel.kommune.no/helsestasjon/"
const B = "https://www.eksempel.kommune.no/helsestasjoner/"
const ctx = { places: ["Eksempel"], kommuneHost: "eksempel.kommune.no" }
const NOW = "2026-11-06T10:00:00Z"
const fetched = (url: string, body: string): Fetched => ({
	ok: true,
	url,
	finalUrl: url,
	status: 200,
	contentType: "text/html",
	headers: {},
	body,
	fetchedAt: "2026-11-06T09:00:00Z",
})
const cacheWith = (pages: Record<string, string>) => {
	const cache = new PageCache(mkdtempSync(join(tmpdir(), "varde-extract-")))
	for (const [url, body] of Object.entries(pages))
		cache.put(fetched(url, body), { adapter: "acos" })
	return cache
}

describe("extractPage", () => {
	it("gives the page's values, each with its quote, and the Lavterskel sentences", () => {
		const cache = cacheWith({ [A]: page("kontakt-heading.html") })
		const entry = cache.get(A)
		if (entry === undefined) throw new Error("no entry")
		const p = extractPage(entry, cache.read(entry), ctx)
		expect(p.problem).toBeUndefined()
		expect(p.candidates.map((c) => [c.field, c.value])).toEqual([
			["name", "Eksempel helsestasjon"],
			["website", A],
			["phone", "62 00 00 00"],
			["email", "helsestasjon@eksempel.kommune.no"],
			["openingHours", "Mandag til fredag kl. 08:00\u201315:30"],
		])
		expect(p.lavterskelQuotes).toEqual(["Helsestasjonen er gratis, og du trenger ikke henvisning."])
	})

	it("gives a page whose cache entry no longer matches no values, with the reason", () => {
		const dir = mkdtempSync(join(tmpdir(), "varde-extract-"))
		const cache = new PageCache(dir)
		const entry = cache.put(fetched(A, page("kontakt-heading.html")), { adapter: "acos" })
		writeFileSync(join(dir, entry.file), "<main>Endret etter manifestet</main>")
		const p = extractPage(entry, cache.read(entry), ctx)
		expect(p).toMatchObject({ problem: "cacheMismatch", candidates: [], lavterskelQuotes: [] })
	})

	it("gives a page with no text the reason noText", () => {
		const cache = cacheWith({ [A]: "<html><body><main></main></body></html>" })
		const entry = cache.get(A)
		if (entry === undefined) throw new Error("no entry")
		expect(extractPage(entry, cache.read(entry), ctx).problem).toBe("noText")
	})

	it("reads one number written in a box and again in the body as one candidate", () => {
		const html = `<html><head><meta name="acos-cmscontext" content="x"></head><body><main class="main"><h1>Eksempel helsestasjon</h1><h2>Kontakt</h2><p>Telefon: 62 00 00 00</p><p>Ring oss på telefon 62 00 00 00.</p></main></body></html>`
		const cache = cacheWith({ [A]: html })
		const entry = cache.get(A)
		if (entry === undefined) throw new Error("no entry")
		const phones = extractPage(entry, cache.read(entry), ctx).candidates.filter(
			(c) => c.field === "phone"
		)
		expect(phones).toHaveLength(1)
	})
})

// The 1 MB lines prove the MAX_LINE skip. The lines just under MAX_LINE are the ones every
// pattern really runs on, so they prove the patterns themselves, and a block of 100 of them
// catches work repeated once per number instead of once per line.
const nearLimit = (unit: string) =>
	unit.repeat(Math.ceil(MAX_LINE / unit.length)).slice(0, MAX_LINE - 1)
const SHAPES: Record<string, string> = {
	"1 MB of digits and dots": "62.00.".repeat(175_000),
	"1 MB of digits and spaces": "6 2 ".repeat(262_144),
	"just under MAX_LINE, digits and dots": nearLimit("62.00."),
	"just under MAX_LINE, digits and spaces": nearLimit("6 2 "),
	"just under MAX_LINE, many numbers": nearLimit("62 00 00 00 "),
	"1 MB of digits": "6".repeat(1_048_576),
}

describe("every rule on long lines of digits", () => {
	for (const [name, line] of Object.entries(SHAPES)) {
		it(`finishes within a second on ${name}`, () => {
			const block = [{ source: "heading" as const, lines: [line] }]
			const many = [
				{
					source: "heading" as const,
					lines: Array.from({ length: 100 }, (_, i) => (i % 2 === 0 ? "Telefon:" : line)),
				},
			]
			const started = performance.now()
			findPhones(line)
			quoteHasPhone(line, "62 00 00 00")
			formatHours(line)
			possibleNames(line, ctx)
			phoneCandidates(block, { ...ctx, onKommuneSite: true })
			phoneCandidates(many, { ...ctx, onKommuneSite: true })
			emailCandidates(block, [line])
			addressCandidates(block)
			lavterskelQuotes([line])
			const cache = cacheWith({
				[A]: `<html><body><main><h1>X</h1><h2>Kontakt</h2><p>${line}</p></main></body></html>`,
			})
			const entry = cache.get(A)
			if (entry === undefined) throw new Error("no entry")
			extractPage(entry, cache.read(entry), ctx)
			expect(performance.now() - started).toBeLessThan(1000)
		})
	}
})

describe("extractScope", () => {
	it("extracts every cached page of the scope, counts the rest, and says so in counts only", () => {
		const cache = cacheWith({ [A]: page("kontakt-heading.html"), [B]: page("shared-page.html") })
		const { file, summary } = extractScope(
			"3405",
			[A, B, "https://www.eksempel.kommune.no/ikke-hentet/"],
			cache,
			ctx,
			NOW
		)
		expect(file.scope).toBe("3405")
		expect(file.pages.map((p) => p.url)).toEqual([A, B])
		expect(summary).toMatchObject({ pages: 2, notInCache: 1, withValues: 2 })
		const text = formatExtractSummary([{ ...summary, name: "Lillehammer" }])
		expect(text).toContain("3405 Lillehammer: 2 pages")
		for (const secret of [
			"62 00 00 00",
			"helsestasjon@",
			"eksempel.kommune.no",
			"Eksempel helsestasjon",
		]) {
			expect(text).not.toContain(secret)
		}
	})
})

describe("lostToName", () => {
	it("counts a number lost to a possible name, as a count only", () => {
		const html = `<html><head><meta name="acos-cmscontext" content="x"></head><body><main class="main"><h1>Eksempel helsestasjon</h1><h2>Kontakt</h2><p>Ring Kari p\u00e5 62 00 00 00</p></main></body></html>`
		const cache = cacheWith({ [A]: html })
		const { summary } = extractScope("3405", [A], cache, ctx, NOW)
		expect(summary.lostToName).toBe(1)
		const text = formatExtractSummary([summary])
		expect(text).toContain("phone lines lost to a possible name: 1")
		expect(text).not.toContain("Kari")
	})

	it("counts nothing on a page with an ordinary number", () => {
		const cache = cacheWith({ [A]: page("kontakt-heading.html") })
		expect(extractScope("3405", [A], cache, ctx, NOW).summary.lostToName).toBe(0)
	})
})

describe("extractScopes", () => {
	it("writes the next scope when one stops, counts the failure, and keeps the summaries of the rest", () => {
		const cache = cacheWith({ [A]: page("kontakt-heading.html") })
		const scopes = [
			{ scope: "3405", name: "Lillehammer", urls: [A], ctx },
			{ scope: "3407", name: "Gjovik", urls: [A], ctx },
		]
		const written: string[] = []
		const { summaries, failed } = extractScopes(scopes, cache, NOW, (scope) => {
			if (scope === "3405") throw new Error("disk full")
			written.push(scope)
		})
		expect(written).toEqual(["3407"])
		expect(summaries.map((s) => s.scope)).toEqual(["3407"])
		expect(failed).toBe(1)
	})
})

describe("purgeExtractions", () => {
	const DAY = 86_400_000
	const NOWMS = Date.parse(NOW)
	const stamp = (daysAgo: number) =>
		new Date(NOWMS - daysAgo * DAY).toISOString().replace(/\.\d{3}Z$/, "Z")
	const put = (dir: string, scope: string, extractedAt: string) => {
		mkdirSync(join(dir, "extract"), { recursive: true })
		writeFileSync(extractionPath(dir, scope), JSON.stringify({ scope, extractedAt, pages: [] }))
	}

	it("deletes an extraction file older than the page age limit and keeps a fresh one", () => {
		const dir = mkdtempSync(join(tmpdir(), "varde-purge-"))
		put(dir, "3405", stamp(91))
		put(dir, "3407", stamp(0))
		expect(purgeExtractions(dir, NOWMS)).toBe(1)
		expect(existsSync(extractionPath(dir, "3405"))).toBe(false)
		expect(existsSync(extractionPath(dir, "3407"))).toBe(true)
	})

	it("is zero when there is no extract folder", () => {
		expect(purgeExtractions(mkdtempSync(join(tmpdir(), "varde-purge-")), NOWMS)).toBe(0)
	})
})
