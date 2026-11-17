import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { checkData } from "../src/check/dataCheck.ts"
import type { KommuneDiscovery } from "../src/discover/types.ts"
import type { CrawlReport, HostLine } from "../src/net/crawler.ts"
import { LockFile } from "../src/schema/lock.ts"
import {
	failedCounts,
	failedKind,
	failedLock,
	ownSiteStopTransient,
	TRANSIENT_KINDS,
	writeFailedLock,
} from "../src/verify/failed.ts"
import { RULES_VERSION } from "../src/verify/rules.ts"
import { formatVerifySummary, lockPath } from "../src/verify/verify.ts"

const SITE = "www.eksempel.kommune.no"
const OTHER = "www.eksempel-helse.no"
const A = `https://${SITE}/barnevern/`
const B = `https://${OTHER}/rus/`
const INPUTS = { extraction: `sha256:${"0".repeat(64)}`, rules: RULES_VERSION }

const kommune = (pages: readonly string[] = [A, B]): KommuneDiscovery => ({
	kommune: "3405",
	name: "Lillehammer",
	discoveredAt: "2026-11-06T10:00:00Z",
	site: {
		host: SITE,
		sitemap: "probe",
		sitemapUrls: 2,
		servicePages: 2,
		kept: 2,
		truncated: false,
	},
	brregComplete: true,
	allSitemapUrls: [],
	units: [],
	pages: pages.map((url) => ({ url, from: "sitemap" as const })),
})
const host = (name: string, stopped?: HostLine["stopped"]): HostLine =>
	stopped === undefined
		? { host: name, requests: 3, delayMs: 5_000 }
		: { host: name, requests: 3, delayMs: 5_000, stopped }
const report = (over: Partial<CrawlReport> = {}): CrawlReport => ({
	hosts: [],
	notFetched: [],
	...over,
})

describe("failedKind", () => {
	it("gives the stop of the kommune's own site, a transient one for a timeout", () => {
		const failure = failedKind(kommune(), report({ hosts: [host(SITE, "timeout")] }))
		expect(failure).toEqual({ kind: "timeout", reason: `host stopped: timeout (${SITE})` })
		expect(TRANSIENT_KINDS).toContain(failure.kind)
	})

	it("puts the kommune's own site first, before another page host that stopped", () => {
		const r = report({ hosts: [host(OTHER, "serverError"), host(SITE, "visitTime")] })
		expect(failedKind(kommune(), r).kind).toBe("visitTime")
	})

	it("gives a page host's stop when the kommune's own site ran", () => {
		const r = report({ hosts: [host(OTHER, "serverError"), host(SITE)] })
		expect(failedKind(kommune(), r)).toEqual({
			kind: "serverError",
			reason: `host stopped: serverError (${OTHER})`,
		})
	})

	it("ignores a stopped host that serves none of the kommune's pages", () => {
		const r = report({ hosts: [host("www.annen.kommune.no", "timeout")] })
		expect(failedKind(kommune(), r).kind).toBe("noPages")
	})

	it("says robots when robots.txt refused every page, and only then", () => {
		const refused = (url: string) => ({ ok: false as const, url, reason: "robots" as const })
		expect(failedKind(kommune(), report({ notFetched: [refused(A), refused(B)] }))).toEqual({
			kind: "robots",
			reason: "every page refused by robots.txt",
		})
		const mixed = report({
			notFetched: [refused(A), { ok: false, url: B, reason: "httpStatus", status: 404 }],
		})
		expect(failedKind(kommune(), mixed).kind).toBe("noPages")
	})

	it("says no pages fetched when the report says nothing, or there is no report", () => {
		expect(failedKind(kommune(), report())).toEqual({ kind: "noPages", reason: "no pages fetched" })
		expect(failedKind(kommune(), undefined).kind).toBe("noPages")
		expect(failedKind(kommune([]), report()).kind).toBe("noPages")
	})

	it("never puts a URL in the reason", () => {
		const r = report({ hosts: [host(SITE, "network")] })
		expect(failedKind(kommune(), r).reason).not.toContain("/barnevern/")
	})

	it("counts only a timeout, a network error and a server error as transient", () => {
		expect(TRANSIENT_KINDS).toEqual(["timeout", "network", "serverError"])
		for (const kind of ["robots", "noPages", "visitTime", "secondTooMany"] as const) {
			expect(TRANSIENT_KINDS).not.toContain(kind)
		}
	})
})

describe("ownSiteStopTransient", () => {
	it("looks at the kommune's own site alone, so verify names the kommuner score refuses", () => {
		const own = (stopped?: HostLine["stopped"]) => report({ hosts: [host(SITE, stopped)] })
		expect(ownSiteStopTransient(kommune(), own("timeout"))).toBe(true)
		expect(ownSiteStopTransient(kommune(), own("visitTime"))).toBe(false)
		expect(ownSiteStopTransient(kommune(), own())).toBe(false)
		// A page host's transient stop leaves the own site's line alone: failedKind would say serverError.
		const other = report({ hosts: [host(OTHER, "serverError"), host(SITE)] })
		expect(ownSiteStopTransient(kommune(), other)).toBe(false)
		expect(ownSiteStopTransient(kommune(), undefined)).toBe(false)
	})
})

describe("failed locks", () => {
	it("writes a lock with no units and its reason, which data:check passes", async () => {
		const root = mkdtempSync(join(tmpdir(), "varde-failed-"))
		const dataDir = join(root, "data")
		const failure = await writeFailedLock(
			dataDir,
			kommune(),
			report({ hosts: [host(SITE, "timeout")] }),
			INPUTS
		)
		const lock = LockFile.parse(JSON.parse(readFileSync(lockPath(dataDir, "3405"), "utf8")))
		expect(lock).toMatchObject({ kommune: "3405", units: [], failed: failure, inputs: INPUTS })
		expect(checkData(root)).toEqual([])
	})

	it("leaves the curated file alone, so my answers survive a failed run", async () => {
		const root = mkdtempSync(join(tmpdir(), "varde-failed-"))
		const dataDir = join(root, "data")
		mkdirSync(join(dataDir, "curated"), { recursive: true })
		const curated = join(dataDir, "curated", "3405-lillehammer.json")
		const text = `${JSON.stringify({ kommune: "3405", name: "Lillehammer", units: [] }, null, "\t")}\n`
		writeFileSync(curated, text)
		await writeFailedLock(dataDir, kommune(), undefined, INPUTS)
		expect(readFileSync(curated, "utf8")).toBe(text)
	})

	it("builds a lock the schema accepts for a robots refusal and for no pages", () => {
		for (const failure of [
			{ kind: "robots" as const, reason: "every page refused by robots.txt" },
			{ kind: "noPages" as const, reason: "no pages fetched" },
		]) {
			expect(LockFile.safeParse(failedLock("3405", failure, INPUTS)).success).toBe(true)
		}
	})

	it("counts a failed kommune as zero units in the summary", () => {
		expect(formatVerifySummary([failedCounts(kommune())])).toContain("3405 Lillehammer: 0 units")
	})
})
