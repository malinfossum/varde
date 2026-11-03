import { describe, expect, it } from "vitest"
import {
	DISALLOW_ALL,
	inVisitWindow,
	parseRobots,
	parseVisitTime,
	robotsFromResponse,
} from "../src/net/robots.ts"

const lines = (...l: string[]) => l.join("\n")

describe("parseRobots: rules", () => {
	it("follows the group for VardeBot over the one for everyone", () => {
		const robots = parseRobots(
			lines("User-agent: *", "Disallow: /", "", "User-agent: VardeBot/1.0", "Disallow: /privat/")
		)
		expect(robots.allows("/helse/")).toBe(true)
		expect(robots.allows("/privat/side")).toBe(false)
	})

	it("treats a ClaudeBot block as somebody else's group", () => {
		const robots = parseRobots(
			lines("User-agent: ClaudeBot", "Disallow: /", "User-agent: *", "Disallow:")
		)
		expect(robots.allows("/helse/")).toBe(true)
	})

	it("keeps a User-agent run open across Sitemap and Crawl-delay lines (RFC 9309)", () => {
		const sitemapBetween = parseRobots(
			lines(
				"User-agent: VardeBot",
				"Sitemap: https://www.eksempel.kommune.no/sitemap.xml",
				"User-agent: *",
				"Disallow: /"
			)
		)
		expect(sitemapBetween.allows("/x")).toBe(false)
		const delayBetween = parseRobots(
			lines("User-agent: VardeBot", "Crawl-delay: 7", "User-agent: *", "Disallow: /")
		)
		expect(delayBetween.allows("/x")).toBe(false)
		expect(delayBetween.crawlDelayMs).toBe(7000)
		const visitBetween = parseRobots(
			lines(
				"User-agent: *",
				"Visit-time: 0200-0500 UTC+1",
				"User-agent: VardeBot",
				"Disallow: /privat/"
			)
		)
		expect(visitBetween.visitTime).toEqual({ from: 60, to: 240 })
		expect(visitBetween.allows("/privat/x")).toBe(false)
	})

	it("lets the longest match win, and Allow win a tie", () => {
		const robots = parseRobots(
			lines(
				"User-agent: *",
				"Disallow: /helse/",
				"Allow: /helse/helsestasjon/",
				"Disallow: /a",
				"Allow: /a"
			)
		)
		expect(robots.allows("/helse/rus/")).toBe(false)
		expect(robots.allows("/helse/helsestasjon/")).toBe(true)
		expect(robots.allows("/a")).toBe(true)
	})

	it("reads * and $ and matches paths case-sensitively", () => {
		const robots = parseRobots(
			lines(
				"User-agent: *",
				"Disallow: /*?contactUserId=",
				"Disallow: /*.pdf$",
				"Disallow: /Kontakt.aspx"
			)
		)
		expect(robots.allows("/tjenester?contactUserId=12")).toBe(false)
		expect(robots.allows("/fil.pdf")).toBe(false)
		expect(robots.allows("/fil.pdf?x=1")).toBe(true)
		expect(robots.allows("/Kontakt.aspx")).toBe(false)
		expect(robots.allows("/kontakt.aspx")).toBe(true)
	})

	it("matches a hostile pattern full of wildcards in moments", () => {
		const robots = parseRobots(lines("User-agent: *", `Disallow: /${"*a".repeat(200)}b`))
		const started = Date.now()
		expect(robots.allows(`/${"a".repeat(5000)}`)).toBe(true)
		expect(Date.now() - started).toBeLessThan(1000)
	})

	it("always allows robots.txt itself, and allows everything without rules", () => {
		expect(parseRobots(lines("User-agent: *", "Disallow: /")).allows("/robots.txt")).toBe(true)
		expect(parseRobots("").allows("/x")).toBe(true)
		const softPage = "<!DOCTYPE html><html><body>Fant ikke siden</body></html>"
		expect(parseRobots(softPage).allows("/x")).toBe(true)
	})

	it("collects Sitemap lines from anywhere, absolute URLs only", () => {
		const robots = parseRobots(
			lines(
				"Sitemap: https://www.eksempel.kommune.no/sitemap.xml",
				"User-agent: *",
				"Disallow:",
				"Sitemap: /relative.xml",
				"sitemap: https://www.eksempel.kommune.no/b.xml"
			)
		)
		expect(robots.sitemaps).toEqual([
			"https://www.eksempel.kommune.no/sitemap.xml",
			"https://www.eksempel.kommune.no/b.xml",
		])
	})
})

describe("parseRobots: crawl delay and visiting hours", () => {
	it("takes Crawl-delay from the group that applies", () => {
		expect(parseRobots(lines("User-agent: *", "Crawl-delay: 7")).crawlDelayMs).toBe(7000)
	})

	it("takes the strictest Crawl-delay of any group when the applying group has none", () => {
		// Kongsvinger's shape: the 30 seconds sit in Bing's group only.
		const robots = parseRobots(
			lines(
				"User-agent: *",
				"Sitemap: https://www.eksempel.kommune.no/sitemap.xml",
				"User-agent: MSNBot",
				"Crawl-delay: 30",
				"User-agent: Bingbot",
				"Crawl-delay: 20"
			)
		)
		expect(robots.crawlDelayMs).toBe(30_000)
	})

	it("reads Visit-time with and without a UTC offset", () => {
		expect(parseVisitTime("0200-0500 UTC+1")).toEqual({ from: 60, to: 240 })
		expect(parseVisitTime("0600-0845")).toEqual({ from: 360, to: 525 })
		expect(parseVisitTime("23:00-02:00 UTC")).toEqual({ from: 1380, to: 120 })
		expect(parseVisitTime("whenever")).toBeUndefined()
		expect(parseVisitTime("2500-0100")).toBeUndefined()
	})

	it("tells inside the window from outside, across midnight too", () => {
		const at = (time: string) => Date.parse(`2026-11-03T${time}:00Z`)
		const night = { from: 60, to: 240 }
		expect(inVisitWindow(at("01:30"), night)).toBe(true)
		expect(inVisitWindow(at("12:00"), night)).toBe(false)
		expect(inVisitWindow(at("04:00"), night)).toBe(false)
		const late = { from: 1380, to: 120 }
		expect(inVisitWindow(at("23:30"), late)).toBe(true)
		expect(inVisitWindow(at("01:00"), late)).toBe(true)
		expect(inVisitWindow(at("03:00"), late)).toBe(false)
	})

	it("reads frivilligsentral.no's line, and notes one it cannot read", () => {
		const robots = parseRobots(lines("User-agent: * ", "Disallow:", "Visit-time: 0200-0500 UTC+1"))
		expect(robots.visitTime).toEqual({ from: 60, to: 240 })
		const odd = parseRobots(lines("User-agent: *", "Visit-time: om natta", "Crawl-delay: snart"))
		expect(odd.visitTime).toBeUndefined()
		expect(odd.notes).toEqual(["unreadable Visit-time", "unreadable Crawl-delay"])
	})
})

describe("robotsFromResponse (RFC 9309)", () => {
	it("allows everything when robots.txt is missing", () => {
		expect(robotsFromResponse(404, "<html>Fant ikke siden</html>").allows("/kontor/x")).toBe(true)
		expect(robotsFromResponse(403, "").allows("/x")).toBe(true)
	})

	it("keeps out when the server fails", () => {
		expect(robotsFromResponse(500, "")).toBe(DISALLOW_ALL)
		expect(robotsFromResponse(503, "").allows("/x")).toBe(false)
	})

	it("parses a 200", () => {
		expect(robotsFromResponse(200, lines("User-agent: *", "Disallow: /x")).allows("/x")).toBe(false)
	})
})
