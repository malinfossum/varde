import { describe, expect, it } from "vitest"
import { AllowList } from "../src/net/allowList.ts"
import { Crawler } from "../src/net/crawler.ts"
import { FLOOR_MS, PACE_MS } from "../src/net/types.ts"
import { addressQuery } from "../src/registers/kartverket.ts"
import { FakeClock, fakeWeb, html, json, type Route, text } from "./netHelpers.ts"

const A = "https://www.eksempel.kommune.no"
const KARTVERKET_ROBOTS = "https://api.kartverket.no/robots.txt"
const BRREG = "https://data.brreg.no/enhetsregisteret/api/enheter"
const Q1 = addressQuery("storgata 1", "3405")
const Q2 = addressQuery("storgata 2", "3405")

// The fixed allow-list (registers included) plus one kommune site.
function setup(extra: Record<string, Route> = {}) {
	const clock = new FakeClock()
	const allowList = new AllowList()
	allowList.add("www.eksempel.kommune.no", "kommune", "ownPage")
	const web = fakeWeb({
		[Q1]: json({ adresser: [] }),
		[Q2]: json({ adresser: [] }),
		[`${BRREG}/999999981`]: json({}),
		[`${BRREG}/999999982`]: json({}),
		[`${A}/a/`]: html("a"),
		[`${A}/b/`]: html("b"),
		...extra,
	})
	const crawler = new Crawler({ transport: web.transport, clock, allowList })
	return { crawler, clock }
}

describe("crawler: Kartverket's own pace", () => {
	it("keys the pace by registrable domain and leaves every other server on the floor", () => {
		expect(PACE_MS).toEqual({ "kartverket.no": 1000 })
		expect(FLOOR_MS).toBe(5000)
	})

	it("asks Kartverket a second apart, while Brreg and a website still wait 5 seconds", async () => {
		const { crawler, clock } = setup()
		for (const url of [Q1, Q2, `${BRREG}/999999981`, `${BRREG}/999999982`]) {
			expect((await crawler.get(url, "json")).ok).toBe(true)
		}
		for (const url of [`${A}/a/`, `${A}/b/`]) expect((await crawler.get(url, "html")).ok).toBe(true)
		// Each server's robots.txt is its first request and waits for nothing; every gap after it
		// is that server's pace.
		expect(clock.sleeps).toEqual([1000, 1000, 5000, 5000, 5000, 5000])
	})

	it("sends one Kartverket request at a time when two are asked at once", async () => {
		const { crawler, clock } = setup()
		await Promise.all([crawler.get(Q1, "json"), crawler.get(Q2, "json")])
		expect(clock.sleeps).toEqual([1000, 1000])
	})

	it("waits Kartverket's own Crawl-delay when it is longer than a second", async () => {
		const { crawler, clock } = setup({
			[KARTVERKET_ROBOTS]: text("User-agent: *\nCrawl-delay: 3"),
		})
		await crawler.get(Q1, "json")
		await crawler.get(Q2, "json")
		expect(clock.sleeps).toEqual([3000, 3000])
	})

	it("reports each host's delay", async () => {
		const { crawler } = setup()
		await crawler.get(Q1, "json")
		await crawler.get(`${A}/a/`, "html")
		expect(crawler.report().hosts).toEqual([
			{ host: "api.kartverket.no", requests: 2, delayMs: 1000 },
			{ host: "www.eksempel.kommune.no", requests: 2, delayMs: 5000 },
		])
	})
})
