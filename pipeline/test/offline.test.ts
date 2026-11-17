import { existsSync, mkdtempSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { extractionPath, extractScope, extractScopes, runExtract } from "../src/extract/extract.ts"
import { AddressCache } from "../src/io/addressCache.ts"
import { writeJsonAtomic } from "../src/io/files.ts"
import { OfflineMissError, offlineGet } from "../src/io/offline.ts"
import { PageCache } from "../src/io/pageCache.ts"
import { AddressLookupError } from "../src/registers/kartverket.ts"
import type { CuratedFile } from "../src/schema/curated.ts"
import { unfinishedReason, verifyEach, verifyKommune } from "../src/verify/verify.ts"
import {
	BV,
	CTX,
	fetched,
	K,
	kartverket,
	NOW,
	UNIT_PAGE,
	unit,
	verifySetup,
} from "./verifyHelpers.ts"

const MISSING = `${K}/ikke-hentet/`
const cachedRoot = () => {
	const root = mkdtempSync(join(tmpdir(), "varde-offline-"))
	const cache = new PageCache(join(root, "pages"))
	cache.put(fetched(BV, UNIT_PAGE), { adapter: "acos" })
	return { root, cache }
}

describe("verify --offline", () => {
	it("stops a kommune on an address the Kartverket cache does not hold, and names the search", async () => {
		const s = verifySetup({ pages: { [BV]: UNIT_PAGE }, units: [unit()], get: offlineGet })
		const addressCache = new AddressCache(join(s.cacheDir, "kartverket"), { offline: true })
		const err: unknown = await verifyKommune({ ...s.input, addressCache }).catch((e: unknown) => e)
		expect(err).toBeInstanceOf(OfflineMissError)
		const miss = err as OfflineMissError
		expect(miss.message).toBe(`offline: not in the cache: ${miss.what}`)
		expect(miss.what.toLowerCase()).toContain("storgata")
		expect(addressCache.hits).toBe(0)
	})

	it("names the kommune and the miss in the run's reasons, the one reason that prints a search", async () => {
		const run = async (): Promise<undefined> => {
			throw new OfflineMissError("storgata 1")
		}
		const { unfinished } = await verifyEach([{ kommune: "3405" }], run)
		expect(unfinished).toEqual([
			{ kommune: "3405", reason: "3405: offline: not in the cache: storgata 1" },
		])
		expect(unfinishedReason("3405", new Error("Kari Nordmann"))).toBe(
			"3405: stopped on an unexpected error"
		)
		expect(unfinishedReason("3405", new AddressLookupError())).toBe(
			"3405: Kartverket stopped answering in this run, so no address was checked and nothing was written: run verify --resume later"
		)
	})
})

describe("extract --offline", () => {
	it("throws on a page the cache does not hold, naming its URL", () => {
		const { cache } = cachedRoot()
		expect(() => extractScope("3405", [BV, MISSING], cache, CTX, NOW, { offline: true })).toThrow(
			`offline: not in the cache: ${MISSING}`
		)
	})

	it("counts a page fetch recorded as not fetched, as an online run does", () => {
		const { cache } = cachedRoot()
		const offline = extractScope("3405", [BV, MISSING], cache, CTX, NOW, {
			offline: true,
			notFetched: new Set([MISSING]),
		})
		expect(offline.summary).toMatchObject({ pages: 1, notInCache: 1 })
		const online = extractScope("3405", [BV, MISSING], cache, CTX, NOW)
		expect(online.summary).toMatchObject({ pages: 1, notInCache: 1 })
	})

	it("goes on to the next scope after a miss, and keeps the miss apart from the failures", () => {
		const { cache } = cachedRoot()
		const scopes = [
			{ scope: "3405", urls: [MISSING], ctx: CTX },
			{ scope: "3407", urls: [BV], ctx: CTX },
		]
		const written: string[] = []
		const result = extractScopes(
			scopes,
			cache,
			NOW,
			(scope) => {
				written.push(scope)
			},
			{ offline: true }
		)
		expect(written).toEqual(["3407"])
		expect(result.failed).toEqual([])
		expect(result.misses).toEqual([`3405: offline: not in the cache: ${MISSING}`])
		expect(result.summaries.map((s) => s.scope)).toEqual(["3407"])
	})

	it("purges no extraction file offline, and purges an old one online", () => {
		const { root, cache } = cachedRoot()
		const old = extractionPath(root, "3407")
		writeJsonAtomic(old, { scope: "3407", extractedAt: "2026-01-01T00:00:00Z", pages: [] })
		const run = { root, scopes: [{ scope: "3405", urls: [BV], ctx: CTX }], cache, now: NOW }
		const offline = runExtract({ ...run, nowMs: Date.parse(NOW), offline: true })
		expect(offline.purged).toBeUndefined()
		expect(existsSync(old)).toBe(true)
		expect(existsSync(extractionPath(root, "3405"))).toBe(true)
		const online = runExtract({ ...run, nowMs: Date.parse(NOW) })
		expect(online.purged).toBe(1)
		expect(existsSync(old)).toBe(false)
	})

	it("writes nothing in a dry run", () => {
		const { root, cache } = cachedRoot()
		const scopes = [{ scope: "3405", urls: [BV], ctx: CTX }]
		const result = runExtract({
			root,
			scopes,
			cache,
			now: NOW,
			nowMs: Date.parse(NOW),
			dryRun: true,
		})
		expect(result.purged).toBeUndefined()
		expect(existsSync(extractionPath(root, "3405"))).toBe(false)
	})

	it("reports each scope it finishes, with a running count", () => {
		const { root, cache } = cachedRoot()
		const scopes = [
			{ scope: "3405", urls: [BV], ctx: CTX },
			{ scope: "3407", urls: [MISSING], ctx: CTX },
			{ scope: "3411", urls: [BV], ctx: CTX },
		]
		const lines: string[] = []
		runExtract({
			root,
			scopes,
			cache,
			now: NOW,
			nowMs: Date.parse(NOW),
			offline: true,
			onDone: (scope, at, of) => lines.push(`extract: ${scope} done (${at} of ${of})`),
		})
		expect(lines).toEqual(["extract: 3405 done (1 of 3)", "extract: 3411 done (3 of 3)"])
	})
})

describe("verify --offline, my edited URL", () => {
	it("finishes and settles it on my decision, since no status is asked for a URL the manifest lacks", async () => {
		const mine = `${K}/barnevern/kontakt/`
		const decisions = [
			{
				field: "website" as const,
				value: BV,
				sourceUrl: BV,
				decision: "edit" as const,
				editedValue: mine,
				decidedOn: "2026-11-06",
			},
		]
		const curated: CuratedFile = {
			kommune: "3405",
			name: "Lillehammer",
			units: [
				{
					unitId: "org:999999991",
					name: "Eksempel barneverntjeneste",
					include: true,
					sources: { orgNumber: "999999991", pages: [BV] },
					categories: ["familie-og-barn"],
					providerType: "offentlig",
					decisions,
				},
			],
		}
		const s = verifySetup({ pages: { [BV]: UNIT_PAGE }, units: [unit()], get: offlineGet })
		// Kartverket answers come from the fake, so only the URL lookup is under test here: a call for
		// my URL would reach offlineGet and reject, as the real offline run does.
		const { lock } = await verifyKommune({
			...s.input,
			curated,
			offline: true,
			get: (url, kind) => (url === mine ? offlineGet(url, kind) : kartverket(url, kind)),
		})
		const website = lock.units[0]?.fields.website
		expect(website).toMatchObject({ status: "accepted", value: mine })
		expect(website?.gates.find((g) => g.gate === "validity")).toMatchObject({
			gate: "validity",
			pass: true,
			reason: "my decision of 06.11.2026",
		})
	})
})
