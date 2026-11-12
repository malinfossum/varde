import { mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it, vi } from "vitest"
import { extractScope } from "../src/extract/extract.ts"
import { PageCache } from "../src/io/pageCache.ts"
import type { Fetched } from "../src/net/crawler.ts"

// Its own file: the mock covers the whole file.
vi.mock("../src/extract/fields/phone.ts", async (importOriginal) => {
	const real = await importOriginal<typeof import("../src/extract/fields/phone.ts")>()
	return {
		...real,
		phoneCandidates: (...args: Parameters<typeof real.phoneCandidates>) => {
			if (args[0].some((b) => b.lines.includes("Telefon: 62 00 00 99")))
				throw new Error("a rule broke")
			return real.phoneCandidates(...args)
		},
	}
})

const A = "https://www.eksempel.kommune.no/helsestasjon/"
const B = "https://www.eksempel.kommune.no/skolehelsetjeneste/"
const ctx = { places: ["Eksempel"], kommuneHost: "eksempel.kommune.no" }
const html = (title: string, phone: string) =>
	`<html><head><meta name="acos-cmscontext" content="x"></head><body><main class="main"><h1>${title}</h1><h2>Kontakt</h2><p>Telefon: ${phone}</p></main></body></html>`
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

describe("a page that throws", () => {
	it("gives that page the reason unreadable and leaves the rest of its scope alone", () => {
		const cache = new PageCache(mkdtempSync(join(tmpdir(), "varde-errors-")))
		cache.put(fetched(A, html("Eksempel helsestasjon", "62 00 00 99")), { adapter: "acos" })
		cache.put(fetched(B, html("Eksempel skolehelsetjeneste", "62 00 00 00")), { adapter: "acos" })
		const { file, summary } = extractScope("3405", [A, B], cache, ctx, "2026-11-06T10:00:00Z")
		expect(file.pages.map((p) => p.url)).toEqual([A, B])
		expect(file.pages[0]).toMatchObject({ problem: "unreadable", candidates: [] })
		expect(file.pages[1]?.problem).toBeUndefined()
		expect(file.pages[1]?.candidates.some((c) => c.field === "phone")).toBe(true)
		expect(summary.problems).toEqual({ unreadable: 1 })
	})
})
