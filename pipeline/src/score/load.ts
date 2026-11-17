import { existsSync, readFileSync, statSync } from "node:fs"
import { join } from "node:path"
import { z } from "zod"
import { AnswerKey } from "../answerKey/schema.ts"
import { DiscoverError } from "../discover/discover.ts"
import { type DiscoveryFiles, readDiscovery } from "../discover/files.ts"
import { readExtraction } from "../extract/extract.ts"
import { readCrawlReport } from "../fetch/fetchPages.ts"
import { readJsonDir } from "../io/files.ts"
import { readTimings } from "../io/timings.ts"
import type { CrawlReport } from "../net/crawler.ts"
import { CLAUDEBOT_BLOCKED, KEY_KOMMUNER } from "../pilot/list.ts"
import { CuratedFile } from "../schema/curated.ts"
import { LockFile } from "../schema/lock.ts"
import { siteHost } from "../text/normalise.ts"
import { ownSiteStopTransient } from "../verify/failed.ts"
import { readKnownWrong, readPilotChecks } from "./checks.ts"
import type { PageCount, PilotInput } from "./pilot.ts"
import { compareText } from "./sample.ts"
import type { ScaleInput } from "./scale.ts"

export const REPORT_PATH = "docs/pilot/pilot-report.md"
export const testFile = (root: string, name: string) => join(root, "pipeline", "test", name)

export class ScoreLoadError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "ScoreLoadError"
	}
}

const VerifyStats = z.object({
	lookups: z.number().int().nonnegative(),
	hits: z.number().int().nonnegative(),
})
const DecideOnce = z.object({ rows: z.array(z.number().int().positive()) })

// Messages name the file only: a parse error would quote its text.
function readJson<S extends z.ZodType>(schema: S, path: string, name: string): z.output<S> {
	if (!existsSync(path)) throw new ScoreLoadError(`${name} is missing`)
	let data: unknown
	try {
		data = JSON.parse(readFileSync(path, "utf8"))
	} catch {
		throw new ScoreLoadError(`${name} is not valid JSON`)
	}
	const parsed = schema.safeParse(data)
	if (!parsed.success) throw new ScoreLoadError(`${name} does not match its schema`)
	return parsed.data
}

function readLocks(root: string, only: readonly string[]): LockFile[] {
	return readJsonDir(join(root, "data", "lock")).flatMap((f) => {
		const parsed = LockFile.safeParse(f.data)
		if (!f.valid || !parsed.success)
			throw new ScoreLoadError(
				`data/lock/${f.file} does not match its schema: run npm run data:check`
			)
		return only.includes(parsed.data.kommune) ? [parsed.data] : []
	})
}

function readCurated(root: string, only: readonly string[]): CuratedFile[] {
	return readJsonDir(join(root, "data", "curated")).flatMap((f) => {
		const parsed = CuratedFile.safeParse(f.data)
		if (!f.valid || !parsed.success)
			throw new ScoreLoadError(
				`data/curated/${f.file} does not match its schema: run npm run data:check`
			)
		return only.includes(parsed.data.kommune) ? [parsed.data] : []
	})
}

function readChecksFile<T>(read: () => T, name: string): T {
	try {
		return read()
	} catch {
		throw new ScoreLoadError(`${name} is missing or does not match its schema`)
	}
}

function readDiscoveryFiles(cacheDir: string): DiscoveryFiles {
	try {
		return readDiscovery(join(cacheDir, "discover"))
	} catch (err) {
		if (err instanceof DiscoverError) throw new ScoreLoadError(`discover/${err.message}`)
		throw err
	}
}

// The crawl report through fetch's own reader (Task 4). A report that exists but does not parse
// stops the score: read as missing, it would turn a stopped host into "no pages fetched".
function crawlReportOf(cacheDir: string): CrawlReport | undefined {
	const path = join(cacheDir, "pages", "report.json")
	if (!existsSync(path)) return undefined
	const report = readCrawlReport(path)
	if (report === undefined) throw new ScoreLoadError("pages/report.json does not match its schema")
	return report
}

// The sites of the kommuner that block ClaudeBot, as siteHost gives them, from what discover found.
function blockedHostsOf(discovery: DiscoveryFiles, pilot: readonly string[]): string[] {
	const hosts = new Set<string>()
	for (const k of discovery.kommuner) {
		if (!CLAUDEBOT_BLOCKED.includes(k.kommune) || !pilot.includes(k.kommune)) continue
		// Fail closed: without its site, a page of an open kommune's unit on that site would go unmarked.
		const host = k.site === undefined ? undefined : siteHost(`https://${k.site.host}/`)
		if (host === undefined)
			throw new ScoreLoadError(
				`kommune ${k.kommune} blocks ClaudeBot and discover found no site for it: run discover for it first`
			)
		hosts.add(host)
	}
	return [...hosts].sort(compareText)
}

// Everything scorePilot needs, read from the repo (root) and the cache. The extraction files hold
// page lines: each is cut down to its pages' URLs and candidate counts here, so the score never
// holds page text. only is the list of kommune numbers to score (PILOT for --only pilot).
export function loadPilotInput(
	root: string,
	cacheDir: string,
	only: readonly string[]
): PilotInput {
	const discovery = readDiscoveryFiles(cacheDir)
	const pilot = [...only].sort(compareText)
	const extracted: Record<string, PageCount[]> = {}
	for (const scope of [...pilot, "national"]) {
		// Read as empty, a missing file would change the report with no lock change.
		const extraction = readExtraction(cacheDir, scope)
		if (extraction === undefined)
			throw new ScoreLoadError(
				`extract/${scope}.json is missing or does not match its schema: run extract first (--offline for a gap PR)`
			)
		extracted[scope] = extraction.pages.map((p) => ({
			url: p.url,
			finalUrl: p.finalUrl,
			candidates: p.candidates.length,
		}))
	}
	return {
		pilot,
		keyKommuner: KEY_KOMMUNER.filter((k) => pilot.includes(k)),
		blocked: CLAUDEBOT_BLOCKED,
		blockedHosts: blockedHostsOf(discovery, pilot),
		locks: readLocks(root, pilot),
		curated: readCurated(root, pilot),
		key: readJson(AnswerKey, testFile(root, "answer-key.json"), "test/answer-key.json"),
		decideOnce: readJson(
			DecideOnce,
			testFile(root, "lavterskel-changes.json"),
			"test/lavterskel-changes.json"
		).rows,
		checks: readChecksFile(
			() => readPilotChecks(testFile(root, "pilot-checks.json")),
			"test/pilot-checks.json"
		),
		known: readChecksFile(
			() => readKnownWrong(testFile(root, "known-wrong.json")),
			"test/known-wrong.json"
		),
		discovery,
		crawl: crawlReportOf(cacheDir),
		extracted,
	}
}

// The pilot kommuner whose own site host stopped on a timeout, a network error or a server error in
// the merged crawl report (Decided 26). Such a kommune can hold a normal lock with part of its
// pages missing, so its numbers are no result yet. Kommune numbers only.
export function transientStops(input: PilotInput): string[] {
	return input.discovery.kommuner
		.filter((k) => input.pilot.includes(k.kommune) && ownSiteStopTransient(k, input.crawl))
		.map((k) => k.kommune)
		.sort(compareText)
}

// The PR body's scale numbers: the crawl report, the selected lock files' total size, verify's
// Kartverket counts and the stage timings. All of it is local; none of it goes in the report.
export function loadScaleInput(
	root: string,
	cacheDir: string,
	only: readonly string[]
): ScaleInput {
	let lockBytes = 0
	for (const kommune of only) {
		const path = join(root, "data", "lock", `${kommune}.json`)
		if (existsSync(path)) lockBytes += statSync(path).size
	}
	const report = crawlReportOf(cacheDir)
	const statsPath = join(cacheDir, "verify-stats.json")
	return {
		...(report === undefined ? {} : { report }),
		lockBytes,
		...(existsSync(statsPath)
			? { stats: readJson(VerifyStats, statsPath, "verify-stats.json") }
			: {}),
		timings: readTimings(cacheDir),
	}
}
