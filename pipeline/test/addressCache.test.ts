import { createHash } from "node:crypto"
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { ADDRESS_MAX_AGE_DAYS, AddressCache } from "../src/io/addressCache.ts"
import { OfflineMissError, offlineGet } from "../src/io/offline.ts"
import { DAY_MS, MAX_AGE_DAYS } from "../src/io/pageCache.ts"
import type { Get } from "../src/net/crawler.ts"
import { AddressLookupError, addressQuery, findAddress } from "../src/registers/kartverket.ts"
import { resolveAddresses } from "../src/verify/context.ts"
import { fakeGet, T_NOON } from "./netHelpers.ts"

const KOMMUNE = "3405"
const VALUE = "Storgata 1, 2999 Eksempelby"
const SEARCH = "storgata 1"
const RECORD = {
	adresseid: "a1",
	adressetekst: "Storgata 1",
	kommunenummer: KOMMUNE,
	postnummer: "2999",
	poststed: "EKSEMPELBY",
}
const HIT = {
	addressId: "a1",
	kommune: KOMMUNE,
	text: "Storgata 1",
	postcode: "2999",
	poststed: "EKSEMPELBY",
}

const folder = () => join(mkdtempSync(join(tmpdir(), "varde-address-cache-")), "kartverket")
const fileFor = (search: string, kommune = KOMMUNE) =>
	`${createHash("sha256").update(`${kommune}\n${search}`).digest("hex")}.json`
const at = (ms: number) => () => ms

// A Kartverket that answers the one search and counts every request.
function kartverket(body: unknown = { adresser: [RECORD] }) {
	const asked: string[] = []
	const answer = fakeGet({ [addressQuery(SEARCH, KOMMUNE)]: { body: JSON.stringify(body) } })
	const get: Get = (url, kind) => {
		asked.push(url)
		return answer(url, kind)
	}
	return { get, asked }
}

describe("AddressCache: a fresh answer", () => {
	it("answers a second lookup from the cache, with no request", async () => {
		const dir = folder()
		const web = kartverket()
		const first = new AddressCache(dir, { now: at(T_NOON) })
		expect(await findAddress(web.get, VALUE, KOMMUNE, first)).toEqual(HIT)
		const later = new AddressCache(dir, { now: at(T_NOON + DAY_MS) })
		expect(await findAddress(web.get, VALUE, KOMMUNE, later)).toEqual(HIT)
		expect(web.asked).toHaveLength(1)
		expect({ lookups: later.lookups, hits: later.hits }).toEqual({ lookups: 1, hits: 1 })
	})

	it("writes { cachedAt, records } under the sha256 of the key", async () => {
		const dir = folder()
		await findAddress(kartverket().get, VALUE, KOMMUNE, new AddressCache(dir, { now: at(T_NOON) }))
		expect(readdirSync(dir)).toEqual([fileFor(SEARCH)])
		expect(JSON.parse(readFileSync(join(dir, fileFor(SEARCH)), "utf8"))).toEqual({
			cachedAt: "2026-11-03T12:00:00Z",
			records: [HIT],
		})
	})

	it("asks again once the answer is 30 days old, and the new answer starts its own 30 days", async () => {
		const dir = folder()
		const web = kartverket()
		await findAddress(web.get, VALUE, KOMMUNE, new AddressCache(dir, { now: at(T_NOON) }))
		const almost = T_NOON + ADDRESS_MAX_AGE_DAYS * DAY_MS - 1
		await findAddress(web.get, VALUE, KOMMUNE, new AddressCache(dir, { now: at(almost) }))
		expect(web.asked).toHaveLength(1)
		const expired = new AddressCache(dir, { now: at(almost + 1) })
		expect(await findAddress(web.get, VALUE, KOMMUNE, expired)).toEqual(HIT)
		expect(web.asked).toHaveLength(2)
		expect({ lookups: expired.lookups, hits: expired.hits }).toEqual({ lookups: 1, hits: 0 })
		expect(JSON.parse(readFileSync(join(dir, fileFor(SEARCH)), "utf8")).cachedAt).toBe(
			"2026-12-03T12:00:00Z"
		)
	})

	it("caches an answer with no hits, so the empty search is not asked again", async () => {
		const dir = folder()
		const web = kartverket({ adresser: [] })
		const cache = new AddressCache(dir, { now: at(T_NOON) })
		expect(await findAddress(web.get, VALUE, KOMMUNE, cache)).toBeUndefined()
		expect(await findAddress(web.get, VALUE, KOMMUNE, cache)).toBeUndefined()
		expect(web.asked).toHaveLength(1)
	})
})

describe("AddressCache: what is never cached", () => {
	it("never caches a 503, a stopped host or a body that is not an answer", async () => {
		const dir = folder()
		const cache = new AddressCache(dir, { now: at(T_NOON) })
		const unavailable: Get = async (url) => ({ ok: false, url, reason: "httpStatus", status: 503 })
		// A timeout stops the host, so every later request comes back hostSkipped.
		const stopped: Get = async (url) => ({ ok: false, url, reason: "hostSkipped" })
		const notJson = fakeGet({
			[addressQuery(SEARCH, KOMMUNE)]: { body: "<html></html>", contentType: "text/html" },
		})
		const notAnAnswer = kartverket({ feil: "x" }).get
		for (const get of [unavailable, notJson, notAnAnswer]) {
			expect(await findAddress(get, VALUE, KOMMUNE, cache)).toBeUndefined()
		}
		// With a cache (verify), a stopped host is no answer at all: the kommune stops unfinished
		// instead of sending every later address to review as unknown.
		await expect(findAddress(stopped, VALUE, KOMMUNE, cache)).rejects.toThrow(AddressLookupError)
		// review has no cache and keeps today's answer: no hit.
		expect(await findAddress(stopped, VALUE, KOMMUNE)).toBeUndefined()
		expect(existsSync(dir)).toBe(false)
	})

	it("reads a file that does not parse as a miss", () => {
		const dir = folder()
		const cache = new AddressCache(dir, { now: at(T_NOON) })
		cache.write(SEARCH, KOMMUNE, [])
		writeFileSync(join(dir, fileFor(SEARCH)), "{ not json")
		expect(cache.read(SEARCH, KOMMUNE)).toBeUndefined()
		writeFileSync(join(dir, fileFor(SEARCH)), JSON.stringify({ cachedAt: "i går", records: [] }))
		expect(cache.read(SEARCH, KOMMUNE)).toBeUndefined()
		expect({ lookups: cache.lookups, hits: cache.hits }).toEqual({ lookups: 2, hits: 0 })
	})

	it("reads but never writes in a dry run", async () => {
		const dir = folder()
		const web = kartverket()
		const dry = new AddressCache(dir, { dryRun: true, now: at(T_NOON) })
		expect(await findAddress(web.get, VALUE, KOMMUNE, dry)).toEqual(HIT)
		expect(existsSync(dir)).toBe(false)
		new AddressCache(dir, { now: at(T_NOON) }).write(SEARCH, KOMMUNE, [HIT])
		expect(await findAddress(web.get, VALUE, KOMMUNE, dry)).toEqual(HIT)
		expect(web.asked).toHaveLength(1)
	})
})

describe("AddressCache: file names", () => {
	it("names each answer by the sha256 of its normalised key, never by the key", () => {
		const dir = folder()
		const cache = new AddressCache(dir, { now: at(T_NOON) })
		cache.write("storgata 1: æøå", KOMMUNE, [])
		const [name] = readdirSync(dir)
		expect(name).toMatch(/^[0-9a-f]{64}\.json$/)
		expect(name).toBe(fileFor("storgata 1: æøå"))
		// The same search in other capitals and spacing is the same answer; another kommune is not.
		expect(cache.read("Storgata  1: ÆØÅ", KOMMUNE)).toEqual([])
		cache.write("storgata 1: æøå", "3407", [])
		expect(readdirSync(dir)).toHaveLength(2)
	})
})

describe("AddressCache: purge", () => {
	it("removes answers over 90 days old, .tmp leftovers and files that do not parse", () => {
		const dir = folder()
		new AddressCache(dir, { now: at(T_NOON) }).write("storgata 1", KOMMUNE, [])
		new AddressCache(dir, { now: at(T_NOON + 10 * DAY_MS) }).write("storgata 2", KOMMUNE, [])
		writeFileSync(join(dir, `${fileFor("storgata 3")}.4242.tmp`), "{}")
		writeFileSync(join(dir, fileFor("storgata 4")), "{ not json")
		const removed = new AddressCache(dir).purge(T_NOON + (MAX_AGE_DAYS + 1) * DAY_MS)
		expect(removed).toBe(3)
		expect(readdirSync(dir)).toEqual([fileFor("storgata 2")])
	})

	it("purges nothing in a dry run, or when there is no folder", () => {
		const dir = folder()
		expect(new AddressCache(dir).purge(T_NOON)).toBe(0)
		new AddressCache(dir, { now: at(T_NOON) }).write("storgata 1", KOMMUNE, [])
		expect(new AddressCache(dir, { dryRun: true }).purge(T_NOON + 365 * DAY_MS)).toBe(0)
		expect(readdirSync(dir)).toHaveLength(1)
	})
})

describe("AddressCache: offline", () => {
	it("uses an answer of any age and sends no request", async () => {
		const dir = folder()
		await findAddress(kartverket().get, VALUE, KOMMUNE, new AddressCache(dir, { now: at(T_NOON) }))
		const offline = new AddressCache(dir, { offline: true, now: at(T_NOON + 80 * DAY_MS) })
		expect(await findAddress(offlineGet, VALUE, KOMMUNE, offline)).toEqual(HIT)
		expect({ lookups: offline.lookups, hits: offline.hits }).toEqual({ lookups: 1, hits: 1 })
	})

	it("fails on a miss and names the search and the kommune", async () => {
		const offline = new AddressCache(folder(), { offline: true, now: at(T_NOON) })
		expect(() => offline.read("storgata 9", KOMMUNE)).toThrow(OfflineMissError)
		await expect(
			findAddress(offlineGet, "Storgata 9, 2999 Eksempelby", KOMMUNE, offline)
		).rejects.toThrow('offline: not in the cache: address search "storgata 9" in kommune 3405')
	})

	it("lets no request through: offlineGet fails and names the URL", async () => {
		const url = "https://www.eksempel.kommune.no/a/"
		await expect(offlineGet(url, "html")).rejects.toThrow(OfflineMissError)
		await expect(offlineGet(url, "html")).rejects.toThrow(`offline: not in the cache: ${url}`)
	})
})

describe("resolveAddresses with the cache", () => {
	it("asks once for two spellings of one search: the second is a cache hit", async () => {
		const web = kartverket()
		const cache = new AddressCache(folder(), { now: at(T_NOON) })
		const map = await resolveAddresses(
			web.get,
			[VALUE, "Storgata 1, 2999 EKSEMPELBY"],
			KOMMUNE,
			cache
		)
		expect(web.asked).toHaveLength(1)
		expect(map.get("Storgata 1, 2999 EKSEMPELBY")).toEqual(HIT)
		expect({ lookups: cache.lookups, hits: cache.hits }).toEqual({ lookups: 2, hits: 1 })
	})
})
