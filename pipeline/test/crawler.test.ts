import { describe, expect, it } from "vitest"
import { AllowList } from "../src/net/allowList.ts"
import { Crawler, retryAfterMs } from "../src/net/crawler.ts"
import { NetError } from "../src/net/types.ts"
import { FakeClock, fakeWeb, html, type Route, redirect, text } from "./netHelpers.ts"

const A = "https://www.eksempel.kommune.no"
const B = "https://www.annen.kommune.no"

function setup(routes: Record<string, Route>, clock = new FakeClock()) {
	const allowList = new AllowList([
		{ host: "www.eksempel.kommune.no", kind: "kommune", licence: "ownPage" },
		{ host: "www.annen.kommune.no", kind: "kommune", licence: "ownPage" },
	])
	const web = fakeWeb(routes)
	const crawler = new Crawler({ transport: web.transport, clock, allowList })
	return { crawler, clock, calls: web.calls }
}

const robotsTxt = (...lines: string[]) => text(lines.join("\n"))

describe("crawler: pace", () => {
	it("waits 5 seconds between two requests to one host, robots.txt included", async () => {
		const { crawler, clock, calls } = setup({ [`${A}/a/`]: html("a"), [`${A}/b/`]: html("b") })
		expect((await crawler.get(`${A}/a/`, "html")).ok).toBe(true)
		expect((await crawler.get(`${A}/b/`, "html")).ok).toBe(true)
		expect(calls).toEqual([`${A}/robots.txt`, `${A}/a/`, `${A}/b/`])
		expect(clock.sleeps).toEqual([5000, 5000])
	})

	it("waits the host's Crawl-delay when it is longer, the floor when it is shorter", async () => {
		const slow = setup({
			[`${A}/robots.txt`]: robotsTxt("User-agent: *", "Crawl-delay: 7"),
			[`${A}/a/`]: html("a"),
			[`${A}/b/`]: html("b"),
		})
		await slow.crawler.get(`${A}/a/`, "html")
		await slow.crawler.get(`${A}/b/`, "html")
		expect(slow.clock.sleeps).toEqual([7000, 7000])
		const quick = setup({
			[`${A}/robots.txt`]: robotsTxt("User-agent: *", "Crawl-delay: 1"),
			[`${A}/a/`]: html("a"),
		})
		await quick.crawler.get(`${A}/a/`, "html")
		expect(quick.clock.sleeps).toEqual([5000])
	})

	it("honours a Crawl-delay written only in another bot's group", async () => {
		const { crawler, clock } = setup({
			[`${A}/robots.txt`]: robotsTxt(
				"User-agent: *",
				"Disallow:",
				"User-agent: Bingbot",
				"Crawl-delay: 30"
			),
			[`${A}/a/`]: html("a"),
		})
		await crawler.get(`${A}/a/`, "html")
		expect(clock.sleeps).toEqual([30_000])
	})

	it("skips a host whose Crawl-delay is over a minute", async () => {
		const { crawler, calls } = setup({
			[`${A}/robots.txt`]: robotsTxt("User-agent: *", "Crawl-delay: 3600"),
		})
		expect(await crawler.get(`${A}/a/`, "html")).toMatchObject({ ok: false, reason: "hostSkipped" })
		expect(calls).toEqual([`${A}/robots.txt`])
		expect(crawler.report().hosts).toEqual([
			{ host: "www.eksempel.kommune.no", requests: 1, stopped: "crawlDelayTooLong" },
		])
	})

	it("sends one request at a time to a host", async () => {
		const { crawler, clock } = setup({ [`${A}/a/`]: html("a"), [`${A}/b/`]: html("b") })
		await Promise.all([crawler.get(`${A}/a/`, "html"), crawler.get(`${A}/b/`, "html")])
		expect(clock.sleeps).toEqual([5000, 5000])
	})

	it("does not hold one host up while another waits", async () => {
		const { crawler, clock } = setup({ [`${A}/a/`]: html("a"), [`${B}/a/`]: html("b") })
		await crawler.get(`${A}/a/`, "html")
		await crawler.get(`${B}/a/`, "html")
		// One wait per host before its page. One shared queue would also wait before B's robots.txt.
		expect(clock.sleeps).toEqual([5000, 5000])
	})

	it("paces www and the bare domain of one site as one server", async () => {
		const { crawler, clock } = setup({
			[`${A}/a/`]: html("a"),
			"https://eksempel.kommune.no/b/": html("b"),
		})
		await crawler.get(`${A}/a/`, "html")
		await crawler.get("https://eksempel.kommune.no/b/", "html")
		// www robots.txt, www page, bare robots.txt, bare page: every gap is the floor.
		expect(clock.sleeps).toEqual([5000, 5000, 5000])
	})
})

describe("crawler: 429 and 503", () => {
	it("waits as long as Retry-After says, then tries again", async () => {
		const route: Route = (call) =>
			call === 1 ? html("", 429, { "retry-after": "120" }) : html("a")
		const { crawler, clock } = setup({ [`${A}/a/`]: route })
		expect((await crawler.get(`${A}/a/`, "html")).ok).toBe(true)
		expect(clock.sleeps).toEqual([5000, 120_000])
	})

	it("reads Retry-After as a date too, and never waits less than the floor", async () => {
		const clock = new FakeClock()
		const route: Route = (call) =>
			call === 1
				? html("", 503, { "retry-after": new Date(clock.t + 90_000).toUTCString() })
				: html("a")
		const { crawler } = setup({ [`${A}/a/`]: route }, clock)
		await crawler.get(`${A}/a/`, "html")
		expect(clock.sleeps).toEqual([5000, 90_000])
		const short: Route = (call) => (call === 1 ? html("", 429, { "retry-after": "2" }) : html("a"))
		const quick = setup({ [`${A}/a/`]: short })
		await quick.crawler.get(`${A}/a/`, "html")
		expect(quick.clock.sleeps).toEqual([5000, 5000])
		expect(retryAfterMs("snart", 0)).toBeUndefined()
	})

	it("stops a host for the run at the second 429", async () => {
		const { crawler, calls } = setup({
			[`${A}/a/`]: html("", 429, { "retry-after": "10" }),
			[`${A}/b/`]: html("b"),
		})
		expect(await crawler.get(`${A}/a/`, "html")).toMatchObject({ ok: false, reason: "hostSkipped" })
		expect(await crawler.get(`${A}/b/`, "html")).toMatchObject({ ok: false, reason: "hostSkipped" })
		expect(calls).toEqual([`${A}/robots.txt`, `${A}/a/`, `${A}/a/`])
		expect(crawler.report().hosts[0]?.stopped).toBe("secondTooMany")
	})

	it("sends nothing more from the queue after the second 429, and keeps the server's queue going", async () => {
		const tooMany = html("", 429, { "retry-after": "10" })
		const bare = "https://eksempel.kommune.no/x/"
		const { crawler, calls } = setup({
			[`${A}/a/`]: tooMany,
			[`${A}/b/`]: tooMany,
			[`${A}/c/`]: tooMany,
			[`${A}/d/`]: tooMany,
			[bare]: html("x"),
		})
		const results = await Promise.all(
			[`${A}/a/`, `${A}/b/`, `${A}/c/`, `${A}/d/`, bare].map((url) => crawler.get(url, "html"))
		)
		expect(calls.filter((c) => new URL(c).host === new URL(A).host)).toEqual([
			`${A}/robots.txt`,
			`${A}/a/`,
			`${A}/b/`,
		])
		expect(results.slice(0, 4).map((r) => !r.ok && r.reason)).toEqual(Array(4).fill("hostSkipped"))
		// The bare domain shares the server's queue with www and is not held up by its stop.
		expect(results[4]?.ok).toBe(true)
		expect(crawler.report().hosts).toContainEqual({
			host: "www.eksempel.kommune.no",
			requests: 3,
			stopped: "secondTooMany",
		})
	})

	it("stops a host whose Retry-After is longer than ten minutes", async () => {
		const { crawler } = setup({ [`${A}/a/`]: html("", 429, { "retry-after": "86400" }) })
		await crawler.get(`${A}/a/`, "html")
		expect(crawler.report().hosts[0]?.stopped).toBe("retryAfterTooLong")
	})
})

describe("crawler: answers to robots.txt itself", () => {
	it("waits out a 429 on robots.txt, then reads the rules it gets", async () => {
		const route: Route = (call) =>
			call === 1
				? html("", 429, { "retry-after": "30" })
				: robotsTxt("User-agent: *", "Disallow: /privat/")
		const { crawler, clock, calls } = setup({ [`${A}/robots.txt`]: route, [`${A}/a/`]: html("a") })
		expect((await crawler.get(`${A}/a/`, "html")).ok).toBe(true)
		expect(await crawler.get(`${A}/privat/`, "html")).toMatchObject({ ok: false, reason: "robots" })
		expect(calls).toEqual([`${A}/robots.txt`, `${A}/robots.txt`, `${A}/a/`])
		expect(clock.sleeps).toEqual([30_000, 5000])
	})

	it("stops a host at a second 503 on robots.txt", async () => {
		const { crawler, clock, calls } = setup({
			[`${A}/robots.txt`]: html("", 503),
			[`${A}/a/`]: html("a"),
		})
		expect(await crawler.get(`${A}/a/`, "html")).toMatchObject({ ok: false, reason: "hostSkipped" })
		expect(calls).toEqual([`${A}/robots.txt`, `${A}/robots.txt`])
		// No Retry-After: the default minute.
		expect(clock.sleeps).toEqual([60_000])
		expect(crawler.report().hosts[0]?.stopped).toBe("secondTooMany")
	})

	it("follows a robots.txt redirect to an allowed host and reads the rules there", async () => {
		const { crawler, calls } = setup({
			[`${A}/robots.txt`]: redirect("https://eksempel.kommune.no/robots.txt"),
			"https://eksempel.kommune.no/robots.txt": robotsTxt("User-agent: *", "Disallow: /privat/"),
		})
		expect(await crawler.get(`${A}/privat/`, "html")).toMatchObject({ ok: false, reason: "robots" })
		expect(calls).toEqual([`${A}/robots.txt`, "https://eksempel.kommune.no/robots.txt"])
	})

	it("keeps a host out when robots.txt redirects off the allow-list or names no target", async () => {
		const away = setup({ [`${A}/robots.txt`]: redirect("https://evil.example/robots.txt") })
		expect(await away.crawler.get(`${A}/a/`, "html")).toMatchObject({
			ok: false,
			reason: "hostSkipped",
		})
		expect(away.calls).toEqual([`${A}/robots.txt`])
		expect(away.crawler.report().hosts[0]?.stopped).toBe("robotsUnreachable")
		const nowhere = setup({
			[`${A}/robots.txt`]: { status: 302, headers: {}, body: Buffer.alloc(0) },
		})
		expect(await nowhere.crawler.get(`${A}/a/`, "html")).toMatchObject({
			ok: false,
			reason: "hostSkipped",
		})
		expect(nowhere.crawler.report().hosts[0]?.stopped).toBe("robotsUnreachable")
	})
})

describe("crawler: a robots.txt that cannot be read", () => {
	const R = "https://data.register-a.no"
	const R2 = "https://data.register-b.no"
	const P = "https://www.leverandor.no"

	function withRegisters(routes: Record<string, Route>) {
		const allowList = new AllowList([
			{ host: "data.register-a.no", kind: "register", licence: "nlod" },
			{ host: "data.register-b.no", kind: "register", licence: "ccBy" },
			{ host: "www.leverandor.no", kind: "provider", licence: "ownPage" },
			{ host: "www.eksempel.kommune.no", kind: "kommune", licence: "ownPage" },
		])
		const web = fakeWeb(routes)
		const clock = new FakeClock()
		const crawler = new Crawler({ transport: web.transport, clock, allowList })
		return { crawler, clock, calls: web.calls }
	}

	async function readsTwice(
		robots: Route,
		extra: Record<string, Route> = {},
		sleeps: number[] = [5000, 5000]
	) {
		const { crawler, clock, calls } = withRegisters({
			[`${R}/robots.txt`]: robots,
			[`${R}/api/a`]: html("a"),
			[`${R}/api/b`]: html("b"),
			...extra,
		})
		expect((await crawler.get(`${R}/api/a`, "html")).ok).toBe(true)
		expect((await crawler.get(`${R}/api/b`, "html")).ok).toBe(true)
		expect(crawler.report().hosts.filter((h) => h.stopped !== undefined)).toEqual([])
		expect(crawler.report().notFetched).toEqual([])
		// Every wait the register asked for is kept; the pages are never closer than the floor.
		expect(clock.sleeps).toEqual(sleeps)
		return calls
	}

	it("reads a register whose robots.txt fails with a network error, still 5 seconds apart", async () => {
		const calls = await readsTwice(new NetError("network"))
		expect(calls).toEqual([`${R}/robots.txt`, `${R}/api/a`, `${R}/api/b`])
	})

	it("reads a register whose robots.txt redirects off the allow-list", async () => {
		const calls = await readsTwice(redirect("https://www.ssb-eksempel.example/robots.txt"))
		expect(calls).toEqual([`${R}/robots.txt`, `${R}/api/a`, `${R}/api/b`])
	})

	it("reads a register whose robots.txt answers 503, after waiting out each Retry-After", async () => {
		const calls = await readsTwice(
			html("", 503, { "retry-after": "10" }),
			{},
			[10_000, 10_000, 5000]
		)
		expect(calls).toEqual([`${R}/robots.txt`, `${R}/robots.txt`, `${R}/api/a`, `${R}/api/b`])
	})

	it("reads a register whose robots.txt redirects forever", async () => {
		const loop: Record<string, Route> = {
			[`${R2}/robots.txt`]: redirect(`${R}/robots.txt`),
		}
		await readsTwice(redirect(`${R2}/robots.txt`), loop, [5000, 5000, 5000, 5000])
	})

	it("reads a register whose robots.txt redirects off HTTPS", async () => {
		const calls = await readsTwice(redirect("http://data.register-a.no/robots.txt"))
		expect(calls).toEqual([`${R}/robots.txt`, `${R}/api/a`, `${R}/api/b`])
	})

	it("stops a register whose robots.txt asks for a Retry-After over the cap", async () => {
		const { crawler, calls } = withRegisters({
			[`${R}/robots.txt`]: html("", 503, { "retry-after": "3600" }),
			[`${R}/api/a`]: html("a"),
		})
		expect(await crawler.get(`${R}/api/a`, "html")).toMatchObject({
			ok: false,
			reason: "hostSkipped",
		})
		expect(calls).toEqual([`${R}/robots.txt`])
		expect(crawler.report().hosts).toEqual([
			{ host: "data.register-a.no", requests: 1, stopped: "retryAfterTooLong" },
		])
	})

	it("stops a register as retryAfterTooLong when its robots.txt redirects to an over-cap wait", async () => {
		const { crawler, calls } = withRegisters({
			[`${R}/robots.txt`]: redirect(`${R2}/robots.txt`),
			[`${R2}/robots.txt`]: html("", 503, { "retry-after": "3600" }),
			[`${R}/api/a`]: html("a"),
		})
		expect(await crawler.get(`${R}/api/a`, "html")).toMatchObject({
			ok: false,
			reason: "hostSkipped",
		})
		expect(calls).toEqual([`${R}/robots.txt`, `${R2}/robots.txt`])
		expect(crawler.report().hosts).toEqual([
			{ host: "data.register-a.no", requests: 1, stopped: "retryAfterTooLong" },
			{ host: "data.register-b.no", requests: 1, stopped: "retryAfterTooLong" },
		])
	})

	it("takes the kind from the host asked for, not from where robots.txt redirects", async () => {
		const calls = await readsTwice(
			redirect(`${P}/robots.txt`),
			{
				[`${P}/robots.txt`]: new NetError("network"),
			},
			[5000, 5000]
		)
		expect(calls).toEqual([`${R}/robots.txt`, `${P}/robots.txt`, `${R}/api/a`, `${R}/api/b`])
	})

	it("still honours a readable robots.txt from a register, Disallow included", async () => {
		const { crawler } = withRegisters({
			[`${R}/robots.txt`]: robotsTxt("User-agent: *", "Disallow: /x/"),
			[`${R}/x/a`]: html("x"),
			[`${R}/api/a`]: html("a"),
		})
		expect(await crawler.get(`${R}/x/a`, "html")).toMatchObject({ ok: false, reason: "robots" })
		expect((await crawler.get(`${R}/api/a`, "html")).ok).toBe(true)
	})

	it("reads the rules of another register when robots.txt redirects there", async () => {
		const { crawler, calls } = withRegisters({
			[`${R}/robots.txt`]: redirect(`${R2}/robots.txt`),
			[`${R2}/robots.txt`]: robotsTxt("User-agent: *", "Disallow: /x/"),
			[`${R}/api/a`]: html("a"),
		})
		expect(await crawler.get(`${R}/x/a`, "html")).toMatchObject({ ok: false, reason: "robots" })
		expect((await crawler.get(`${R}/api/a`, "html")).ok).toBe(true)
		expect(calls).toEqual([`${R}/robots.txt`, `${R2}/robots.txt`, `${R}/api/a`])
	})

	it("still stops a kommune or a provider whose robots.txt fails with a network error", async () => {
		const { crawler } = withRegisters({
			[`${A}/robots.txt`]: new NetError("network"),
			[`${P}/robots.txt`]: new NetError("network"),
			[`${A}/a/`]: html("a"),
			[`${P}/a/`]: html("a"),
		})
		expect(await crawler.get(`${A}/a/`, "html")).toMatchObject({ ok: false, reason: "hostSkipped" })
		expect(await crawler.get(`${P}/a/`, "html")).toMatchObject({ ok: false, reason: "hostSkipped" })
		expect(crawler.report().hosts).toEqual([
			{ host: "www.eksempel.kommune.no", requests: 1, stopped: "network" },
			{ host: "www.leverandor.no", requests: 1, stopped: "network" },
		])
	})

	it("still stops a provider whose robots.txt answers 503 twice", async () => {
		const { crawler } = withRegisters({
			[`${P}/robots.txt`]: html("", 503, { "retry-after": "10" }),
			[`${P}/a/`]: html("a"),
		})
		expect(await crawler.get(`${P}/a/`, "html")).toMatchObject({ ok: false, reason: "hostSkipped" })
		expect(crawler.report().hosts[0]?.stopped).toBe("secondTooMany")
	})
})

describe("crawler: Visit-time", () => {
	const robots = robotsTxt("User-agent: *", "Disallow:", "Visit-time: 0200-0500 UTC+1")

	it("skips a host outside its visiting hours, and names it", async () => {
		const { crawler, calls } = setup({ [`${A}/robots.txt`]: robots, [`${A}/a/`]: html("a") })
		expect(await crawler.get(`${A}/a/`, "html")).toMatchObject({ ok: false, reason: "hostSkipped" })
		expect(calls).toEqual([`${A}/robots.txt`])
		expect(crawler.report().hosts[0]?.stopped).toBe("visitTime")
	})

	it("sends nothing from the queue once the window has closed", async () => {
		// The window ends at 04:00 UTC: robots.txt at 03:59:50, the first page at 03:59:55.
		const late = new FakeClock(Date.parse("2026-11-03T03:59:50Z"))
		const pages = ["a", "b", "c", "d"].map((p) => `${A}/${p}/`)
		const routes: Record<string, Route> = { [`${A}/robots.txt`]: robots }
		for (const page of pages) routes[page] = html("side")
		const { crawler, calls, clock } = setup(routes, late)
		const results = await Promise.all(pages.map((page) => crawler.get(page, "html")))
		expect(calls).toEqual([`${A}/robots.txt`, `${A}/a/`])
		expect(results.map((r) => r.ok || r.reason)).toEqual([
			true,
			"hostSkipped",
			"hostSkipped",
			"hostSkipped",
		])
		// The turn after the window waits once and sends nothing; the ones after it do not wait.
		expect(clock.sleeps).toEqual([5000, 5000])
		expect(crawler.report().hosts).toEqual([
			{ host: "www.eksempel.kommune.no", requests: 2, stopped: "visitTime" },
		])
	})

	it("fetches inside them", async () => {
		const night = new FakeClock(Date.parse("2026-11-03T02:00:00Z"))
		const { crawler } = setup({ [`${A}/robots.txt`]: robots, [`${A}/a/`]: html("a") }, night)
		expect((await crawler.get(`${A}/a/`, "html")).ok).toBe(true)
	})
})

describe("crawler: redirects", () => {
	it("follows a redirect from www to the bare domain when both are allowed", async () => {
		const { crawler } = setup({
			[`${A}/a/`]: redirect("https://eksempel.kommune.no/a/"),
			"https://eksempel.kommune.no/a/": html("a"),
		})
		expect(await crawler.get(`${A}/a/`, "html")).toMatchObject({
			ok: true,
			url: `${A}/a/`,
			finalUrl: "https://eksempel.kommune.no/a/",
		})
	})

	it("refuses a redirect to a host off the allow-list", async () => {
		const { crawler, calls } = setup({ [`${A}/a/`]: redirect("https://evil.example/") })
		expect(await crawler.get(`${A}/a/`, "html")).toMatchObject({
			ok: false,
			reason: "notAllowListed",
		})
		expect(calls).not.toContain("https://evil.example/")
	})

	it("checks robots.txt again on the host a redirect leads to", async () => {
		const { crawler, calls } = setup({
			[`${A}/a/`]: redirect(`${B}/privat/`),
			[`${B}/robots.txt`]: robotsTxt("User-agent: *", "Disallow: /privat/"),
		})
		expect(await crawler.get(`${A}/a/`, "html")).toMatchObject({ ok: false, reason: "robots" })
		expect(calls).not.toContain(`${B}/privat/`)
	})

	it("refuses a redirect to plain http, and stops after five hops", async () => {
		const http = setup({ [`${A}/a/`]: redirect("http://www.eksempel.kommune.no/a/") })
		expect(await http.crawler.get(`${A}/a/`, "html")).toMatchObject({
			ok: false,
			reason: "notHttps",
		})
		const loop: Record<string, Route> = {}
		for (let i = 0; i < 7; i++) loop[`${A}/${i}/`] = redirect(`${A}/${i + 1}/`)
		const many = setup(loop)
		expect(await many.crawler.get(`${A}/0/`, "html")).toMatchObject({
			ok: false,
			reason: "tooManyRedirects",
		})
	})
})

describe("crawler: failures and refusals", () => {
	it("refuses a URL off the allow-list, or on plain http, without a request", async () => {
		const { crawler, calls } = setup({})
		expect(await crawler.get("https://evil.example/", "html")).toMatchObject({
			ok: false,
			reason: "notAllowListed",
		})
		expect(await crawler.get("http://www.eksempel.kommune.no/", "html")).toMatchObject({
			ok: false,
			reason: "notHttps",
		})
		expect(calls).toEqual([])
	})

	it("refuses a URL with a port or user info, and a redirect to either, without a request", async () => {
		const { crawler, calls } = setup({
			[`${A}/til-port/`]: redirect("https://www.eksempel.kommune.no:8443/x"),
			[`${A}/til-bruker/`]: redirect("https://kari:hemmelig@www.eksempel.kommune.no/x"),
		})
		for (const url of [
			"https://www.eksempel.kommune.no:8443/x",
			"https://kari:hemmelig@www.eksempel.kommune.no/x",
			"https://kari@www.eksempel.kommune.no/x",
		]) {
			expect(await crawler.get(url, "html")).toMatchObject({ ok: false, reason: "notAllowListed" })
		}
		expect(calls).toEqual([])
		for (const url of [`${A}/til-port/`, `${A}/til-bruker/`]) {
			expect(await crawler.get(url, "html")).toMatchObject({ ok: false, reason: "notAllowListed" })
		}
		expect(calls).toEqual([`${A}/robots.txt`, `${A}/til-port/`, `${A}/til-bruker/`])
	})

	it("keeps a host out when robots.txt redirects to a port or to user info", async () => {
		for (const location of [
			"https://www.annen.kommune.no:8443/robots.txt",
			"https://kari:hemmelig@www.annen.kommune.no/robots.txt",
		]) {
			const { crawler, calls } = setup({ [`${A}/robots.txt`]: redirect(location) })
			expect(await crawler.get(`${A}/a/`, "html")).toMatchObject({
				ok: false,
				reason: "hostSkipped",
			})
			expect(calls).toEqual([`${A}/robots.txt`])
			expect(crawler.report().hosts[0]?.stopped).toBe("robotsUnreachable")
		}
	})

	it("refuses a path robots.txt disallows", async () => {
		const { crawler, calls } = setup({
			[`${A}/robots.txt`]: robotsTxt("User-agent: *", "Disallow: /Kontakt.aspx"),
		})
		expect(await crawler.get(`${A}/Kontakt.aspx`, "html")).toMatchObject({
			ok: false,
			reason: "robots",
		})
		expect(calls).toEqual([`${A}/robots.txt`])
	})

	it("matches robots.txt rules against the path and query, never the full URL", async () => {
		const { crawler } = setup({
			[`${A}/robots.txt`]: robotsTxt("User-agent: *", "Disallow: /*?print="),
			[`${A}/side/`]: html("side"),
		})
		expect(await crawler.get(`${A}/side/?print=1`, "html")).toMatchObject({
			ok: false,
			reason: "robots",
		})
		expect((await crawler.get(`${A}/side/`, "html")).ok).toBe(true)
	})

	it("keeps a host out when its robots.txt answers 500", async () => {
		const { crawler, calls } = setup({ [`${A}/robots.txt`]: html("", 500) })
		expect(await crawler.get(`${A}/a/`, "html")).toMatchObject({ ok: false, reason: "hostSkipped" })
		expect(calls).toEqual([`${A}/robots.txt`])
	})

	it("stops a host that resolves to a private address, and goes on with the others", async () => {
		const { crawler } = setup({
			[`${A}/robots.txt`]: new NetError("privateAddress"),
			[`${B}/a/`]: html("b"),
		})
		expect(await crawler.get(`${A}/a/`, "html")).toMatchObject({ ok: false, reason: "hostSkipped" })
		expect((await crawler.get(`${B}/a/`, "html")).ok).toBe(true)
		const hostA = crawler.report().hosts.find((h) => h.host === "www.eksempel.kommune.no")
		expect(hostA?.stopped).toBe("privateAddress")
	})

	it("stops a host after a timeout or a server error", async () => {
		const timeout = setup({ [`${A}/a/`]: new NetError("timeout"), [`${A}/b/`]: html("b") })
		await timeout.crawler.get(`${A}/a/`, "html")
		expect(await timeout.crawler.get(`${A}/b/`, "html")).toMatchObject({
			ok: false,
			reason: "hostSkipped",
		})
		const broken = setup({ [`${A}/a/`]: html("", 500) })
		await broken.crawler.get(`${A}/a/`, "html")
		expect(broken.crawler.report().hosts[0]?.stopped).toBe("serverError")
	})

	it("skips a missing page or an oversized one without stopping the host", async () => {
		const { crawler } = setup({ [`${A}/stor/`]: new NetError("tooLarge"), [`${A}/a/`]: html("a") })
		expect(await crawler.get(`${A}/borte/`, "html")).toMatchObject({
			ok: false,
			reason: "httpStatus",
			status: 404,
		})
		expect(await crawler.get(`${A}/stor/`, "html")).toMatchObject({ ok: false, reason: "tooLarge" })
		expect((await crawler.get(`${A}/a/`, "html")).ok).toBe(true)
	})

	it("skips and lists a PDF where a page was expected", async () => {
		const pdf = {
			status: 200,
			headers: { "content-type": "application/pdf" },
			body: Buffer.from("%PDF"),
		}
		const { crawler } = setup({ [`${A}/fil.pdf`]: pdf })
		expect(await crawler.get(`${A}/fil.pdf`, "html")).toMatchObject({
			ok: false,
			reason: "wrongType",
		})
		expect(crawler.report().notFetched).toEqual([
			{
				ok: false,
				url: `${A}/fil.pdf`,
				reason: "wrongType",
				status: 200,
				contentType: "application/pdf",
			},
		])
	})

	it("stamps the fetch time in UTC to the second, and decodes the charset it is given", async () => {
		const latin = {
			status: 200,
			headers: { "content-type": "text/html; charset=iso-8859-1" },
			body: Buffer.from([0x66, 0xf8, 0x72]),
		}
		const { crawler } = setup({ [`${A}/a/`]: latin })
		expect(await crawler.get(`${A}/a/`, "html")).toMatchObject({
			ok: true,
			body: "før",
			fetchedAt: "2026-11-03T12:00:05Z",
		})
	})
})
