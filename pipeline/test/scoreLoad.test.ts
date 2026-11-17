import { mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { describe, expect, it } from "vitest"
import type { HostLine } from "../src/net/crawler.ts"
import { CLAUDEBOT_BLOCKED } from "../src/pilot/list.ts"
import {
	loadPilotInput,
	loadScaleInput,
	ScoreLoadError,
	transientStops,
} from "../src/score/load.ts"
import { type PilotInput, scorePilot } from "../src/score/pilot.ts"
import { AT, baseLocks, discovery, KEY, lock, PILOT_T, page, pilotInput } from "./pilotFixture.ts"

const write = (path: string, value: unknown) => {
	mkdirSync(dirname(path), { recursive: true })
	writeFileSync(path, `${JSON.stringify(value, null, "\t")}\n`)
}

// A tiny repo and cache, laid out as the score command finds them. The extraction's quote holds
// a marker word, so a test can show the loaded input keeps no page text.
function layout(): { root: string; cache: string } {
	const root = mkdtempSync(join(tmpdir(), "varde-score-"))
	const cache = join(root, ".cache")
	for (const l of baseLocks()) write(join(root, "data", "lock", `${l.kommune}.json`), l)
	write(join(root, "data", "lock", "0301.json"), lock("0301", []))
	write(join(root, "data", "curated", "3401-eksempelby.json"), {
		kommune: "3401",
		name: "Eksempelby",
		units: [],
	})
	const test = (name: string) => join(root, "pipeline", "test", name)
	write(test("answer-key.json"), KEY)
	write(test("lavterskel-changes.json"), { rows: [] })
	write(test("pilot-checks.json"), { checks: [] })
	write(test("known-wrong.json"), { entries: [] })
	const found = discovery()
	write(join(cache, "discover", "report.json"), found.report)
	write(join(cache, "discover", "hosts.json"), found.hosts)
	write(join(cache, "discover", "national.json"), found.national)
	for (const k of found.kommuner) write(join(cache, "discover", "kommuner", `${k.kommune}.json`), k)
	write(join(cache, "pages", "report.json"), {
		hosts: [{ host: "www.eksempel.kommune.no", requests: 12, delayMs: 5_000 }],
		notFetched: [],
	})
	write(join(cache, "verify-stats.json"), { lookups: 40, hits: 30 })
	for (const scope of ["3401", "3403", "national"])
		write(join(cache, "extract", `${scope}.json`), { scope, extractedAt: AT, pages: [] })
	write(join(cache, "extract", "3405.json"), {
		scope: "3405",
		extractedAt: AT,
		pages: [
			{
				url: page("tjeneste-1"),
				finalUrl: page("tjeneste-1"),
				fetchedAt: AT,
				adapter: "fallback",
				fallback: true,
				blocks: [],
				candidates: [
					{
						field: "phone",
						value: "62 00 00 00",
						evidence: { kind: "quote", quotes: ["Sentralbord 62 00 00 00 (eksempeltekst)"] },
						origin: "unitPage",
					},
				],
				lavterskelQuotes: [],
			},
		],
	})
	return { root, cache }
}

describe("loadPilotInput", () => {
	it("reads the committed files and the caches, and keeps no page text", () => {
		const { root, cache } = layout()
		const input = loadPilotInput(root, cache, PILOT_T)
		expect(input.pilot).toEqual(PILOT_T)
		expect(input.keyKommuner).toEqual(["3403", "3405"])
		expect(input.blocked).toEqual(CLAUDEBOT_BLOCKED)
		expect(input.locks.map((l) => l.kommune)).toEqual(PILOT_T)
		expect(input.curated.map((c) => c.kommune)).toEqual(["3401"])
		expect(input.key.rows).toHaveLength(11)
		expect(input.crawl?.hosts).toEqual([
			{ host: "www.eksempel.kommune.no", requests: 12, delayMs: 5_000 },
		])
		expect(input.extracted).toEqual({
			"3401": [],
			"3403": [],
			"3405": [{ url: page("tjeneste-1"), finalUrl: page("tjeneste-1"), candidates: 1 }],
			national: [],
		})
		expect(JSON.stringify(input)).not.toContain("eksempeltekst")
		expect(scorePilot(input).refused).toBe(false)
	})

	it("passes the key kommuner as a subset of the pilot and the sites of the blocking ones", () => {
		const { root, cache } = layout()
		const found = discovery()
		const site = {
			host: "WWW.Proveby.eksempel.kommune.no",
			sitemap: "probe" as const,
			sitemapUrls: 1,
			servicePages: 1,
			kept: 1,
			truncated: false,
		}
		for (const k of found.kommuner)
			if (k.kommune === "3403" || k.kommune === "3405")
				write(join(cache, "discover", "kommuner", `${k.kommune}.json`), { ...k, site })
		// 3405 does not block ClaudeBot, so only 3403's site counts.
		write(join(cache, "discover", "kommuner", "3405.json"), {
			...found.kommuner.find((k) => k.kommune === "3405"),
			site: { ...site, host: "www.testby.eksempel.kommune.no" },
		})
		const input = loadPilotInput(root, cache, ["3401", "3403"])
		expect(input.keyKommuner).toEqual(["3403"])
		expect(input.keyKommuner.every((k) => input.pilot.includes(k))).toBe(true)
		expect(input.blockedHosts).toEqual(["proveby.eksempel.kommune.no"])
	})

	it("says to run discover when the discover folder is missing", () => {
		const { root, cache } = layout()
		rmSync(join(cache, "discover"), { recursive: true })
		expect(() => loadPilotInput(root, cache, PILOT_T)).toThrow(
			new ScoreLoadError("discover/report.json is missing: run discover first")
		)
	})

	it("stops on a missing extraction file and names it", () => {
		const { root, cache } = layout()
		rmSync(join(cache, "extract", "3403.json"))
		expect(() => loadPilotInput(root, cache, PILOT_T)).toThrow(
			new ScoreLoadError(
				"extract/3403.json is missing or does not match its schema: run extract first (--offline for a gap PR)"
			)
		)
	})

	it("names a lock file that does not match its schema, never quoting it", () => {
		const { root, cache } = layout()
		write(join(root, "data", "lock", "3401.json"), { kommune: "3401", units: "Kari Nordmann" })
		expect(() => loadPilotInput(root, cache, PILOT_T)).toThrow(
			new ScoreLoadError("data/lock/3401.json does not match its schema: run npm run data:check")
		)
	})

	it("reads the scale input from the cache and the selected lock files", () => {
		const { root, cache } = layout()
		const scale = loadScaleInput(root, cache, PILOT_T)
		const bytes = PILOT_T.reduce(
			(sum, k) => sum + statSync(join(root, "data", "lock", `${k}.json`)).size,
			0
		)
		expect(scale).toMatchObject({ lockBytes: bytes, stats: { lookups: 40, hits: 30 } })
		expect(scale.report?.hosts).toHaveLength(1)
	})
})

describe("transientStops", () => {
	const SITE = "www.eksempel.kommune.no"
	// 3405's own site is SITE, and the crawl report gives SITE the stop under test.
	const input = (stopped?: HostLine["stopped"]): PilotInput => {
		const found = discovery()
		const site = {
			host: SITE,
			sitemap: "probe" as const,
			sitemapUrls: 1,
			servicePages: 1,
			kept: 1,
			truncated: false,
		}
		const line = { host: SITE, requests: 12, delayMs: 5_000 }
		return pilotInput({
			discovery: {
				...found,
				kommuner: found.kommuner.map((k) => (k.kommune === "3405" ? { ...k, site } : k)),
			},
			crawl: { hosts: [stopped === undefined ? line : { ...line, stopped }], notFetched: [] },
		})
	}

	it("names a pilot kommune whose own site stopped on a timeout, a network error or a server error", () => {
		for (const kind of ["timeout", "network", "serverError"] as const) {
			expect(transientStops(input(kind))).toEqual(["3405"])
		}
	})

	it("leaves out a lasting stop, a site that ran, and a run with no crawl report", () => {
		expect(transientStops(input("visitTime"))).toEqual([])
		expect(transientStops(input())).toEqual([])
		expect(transientStops(pilotInput({ crawl: undefined }))).toEqual([])
	})
})
