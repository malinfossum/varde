import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { PageCache } from "../src/io/pageCache.ts"
import type { Fetched } from "../src/net/crawler.ts"

const A = "https://www.eksempel.kommune.no/a/"
const B = "https://www.eksempel.kommune.no/b/"
const NOW = Date.parse("2026-11-03T12:00:00Z")

const page = (
	url: string,
	fetchedAt = "2026-11-03T12:00:00Z",
	body = "<main>Eksempel helsestasjon</main>"
): Fetched => ({
	ok: true,
	url,
	finalUrl: url,
	status: 200,
	contentType: "text/html",
	headers: {},
	body,
	fetchedAt,
})
const tmp = () => mkdtempSync(join(tmpdir(), "varde-pages-"))

describe("PageCache", () => {
	it("stores the page under a hashed name, with URL, status, final URL, fetch time and hash", () => {
		const dir = tmp()
		const cache = new PageCache(dir)
		const entry = cache.put(page(A), { adapter: "acos", textLength: 26 })
		expect(entry).toMatchObject({
			url: A,
			finalUrl: A,
			status: 200,
			fetchedAt: "2026-11-03T12:00:00Z",
			adapter: "acos",
			textLength: 26,
		})
		expect(entry.contentHash).toMatch(/^sha256:[0-9a-f]{64}$/)
		expect(entry.file).toMatch(/^[0-9a-f]{32}\.html$/)
		expect(cache.read(entry)).toBe("<main>Eksempel helsestasjon</main>")
		cache.save()
		expect(new PageCache(dir).get(A)).toEqual(entry)
	})

	it("keeps one entry per URL", () => {
		const cache = new PageCache(tmp())
		const first = cache.put(page(A))
		const second = cache.put(page(A, "2026-11-04T12:00:00Z", "<main>Ny tekst</main>"))
		expect(cache.entries()).toEqual([second])
		expect(second.contentHash).not.toBe(first.contentHash)
	})

	it("keeps page text out of the manifest", () => {
		const dir = tmp()
		const cache = new PageCache(dir)
		cache.put(page(A))
		cache.save()
		expect(readFileSync(join(dir, "manifest.json"), "utf8")).not.toContain("Eksempel helsestasjon")
	})

	it("writes nothing in a dry run", () => {
		const dir = join(tmp(), "pages")
		const cache = new PageCache(dir, { dryRun: true })
		cache.put(page(A))
		cache.save()
		expect(cache.purge(NOW)).toBe(0)
		expect(existsSync(dir)).toBe(false)
	})

	it("purges pages older than 90 days, and page files the manifest does not know", () => {
		const dir = tmp()
		const cache = new PageCache(dir)
		const old = cache.put(page(A, "2026-07-01T12:00:00Z"))
		const fresh = cache.put(page(B))
		writeFileSync(join(dir, `${"0".repeat(32)}.html`), "<main>gammel</main>")
		expect(cache.purge(NOW)).toBe(2)
		expect(cache.entries()).toEqual([fresh])
		expect(readdirSync(dir)).toEqual([fresh.file])
		expect(cache.read(old)).toBeUndefined()
	})

	it("refuses a page that no longer matches its manifest entry", () => {
		const dir = tmp()
		const cache = new PageCache(dir)
		const entry = cache.put(page(A))
		writeFileSync(join(dir, entry.file), "<main>Endret etter manifestet</main>")
		expect(cache.read(entry)).toBeUndefined()
	})

	it("starts over when the manifest does not parse", () => {
		const dir = tmp()
		writeFileSync(join(dir, "manifest.json"), "{ ikke json")
		expect(new PageCache(dir).entries()).toEqual([])
	})
})
