import { existsSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs"
import { join } from "node:path"
import { writeJsonAtomic } from "../io/files.ts"
import { OfflineMissError } from "../io/offline.ts"
import { DAY_MS, MAX_AGE_DAYS, type ManifestEntry, type PageCache } from "../io/pageCache.ts"
import { isNavOfficeUrl, parseNavOffice } from "../registers/nav.ts"
import {
	type ExtractedCandidate,
	type ExtractedField,
	ExtractedPage,
	ExtractionFile,
	type PageProblem,
} from "../schema/extraction.ts"
import { siteHost } from "../text/normalise.ts"
import { contactBlocks } from "./contactBlock.ts"
import { addressCandidates } from "./fields/address.ts"
import { emailCandidates } from "./fields/email.ts"
import { navHoursCandidate, pageHoursCandidate } from "./fields/hours.ts"
import { lavterskelQuotes } from "./fields/lavterskel.ts"
import { nameCandidate } from "./fields/name.ts"
import { dedupe, LOST_TO_NAME, phoneCandidates } from "./fields/phone.ts"
import { websiteCandidate } from "./fields/website.ts"
import { allLines, readUnitPage } from "./page.ts"

export type ExtractContext = { places: readonly string[]; kommuneHost?: string }

const empty = (entry: ManifestEntry, problem: PageProblem): ExtractedPage => ({
	url: entry.url,
	finalUrl: entry.finalUrl,
	fetchedAt: entry.fetchedAt,
	adapter: entry.adapter ?? "fallback",
	fallback: (entry.adapter ?? "fallback") === "fallback",
	problem,
	blocks: [],
	candidates: [],
	lavterskelQuotes: [],
})

// One cached page through the adapter and every field rule. A page that gives nothing keeps its
// reason; the run goes on. A rule that throws, or a page whose values do not fit the schema,
// gives the reason unreadable for that page only, so one odd page never stops its kommune's
// file (ExtractionFile.parse would refuse the whole file).
export function extractPage(
	entry: ManifestEntry,
	html: string | undefined,
	ctx: ExtractContext
): ExtractedPage {
	if (html === undefined) return empty(entry, "cacheMismatch")
	try {
		const page = readWithRules(entry, html, ctx)
		return ExtractedPage.safeParse(page).success ? page : empty(entry, "unreadable")
	} catch {
		return empty(entry, "unreadable")
	}
}

function readWithRules(entry: ManifestEntry, html: string, ctx: ExtractContext): ExtractedPage {
	const unit = readUnitPage(html, entry.finalUrl)
	if (unit.text === "")
		return { ...empty(entry, "noText"), adapter: unit.adapter, fallback: unit.fallback }
	const blocks = contactBlocks(unit)
	const name = nameCandidate(unit.main)
	const unitName = typeof name?.value === "string" ? name.value : undefined
	const rule = {
		...(unitName === undefined ? {} : { unitName }),
		places: ctx.places,
		onKommuneSite:
			ctx.kommuneHost !== undefined &&
			siteHost(entry.finalUrl) === siteHost(`https://${ctx.kommuneHost}/`),
	}
	const nav = isNavOfficeUrl(entry.url) ? parseNavOffice(html) : undefined
	const navValues: ExtractedCandidate[] = []
	if (nav !== undefined) {
		const hours = navHoursCandidate(nav)
		if (hours !== undefined) navValues.push(hours)
		if (nav.visitingAddress !== undefined) {
			navValues.push({
				field: "address",
				value: nav.visitingAddress,
				evidence: { kind: "register", register: "nav", recordId: nav.enhetNr },
				origin: "register",
			})
		}
	}
	const hours = nav === undefined ? pageHoursCandidate(unit) : undefined
	const website = websiteCandidate(entry.finalUrl, unit.main)
	const candidates = dedupe([
		...(name === undefined ? [] : [name]),
		...(website === undefined ? [] : [website]),
		...phoneCandidates(blocks, rule),
		...emailCandidates(blocks, allLines(unit)),
		...addressCandidates(blocks),
		...navValues,
		...(hours === undefined ? [] : [hours]),
	])
	const page: ExtractedPage = {
		url: entry.url,
		finalUrl: entry.finalUrl,
		fetchedAt: entry.fetchedAt,
		adapter: unit.adapter,
		fallback: unit.fallback,
		blocks,
		candidates,
		lavterskelQuotes: lavterskelQuotes(allLines(unit)),
	}
	if (nav?.orgNumber !== undefined) page.orgNumber = nav.orgNumber
	if (nav !== undefined) page.navOfficeId = nav.enhetNr
	return page
}

export type ExtractSummary = {
	scope: string
	name?: string
	pages: number
	notInCache: number
	withValues: number
	problems: Partial<Record<PageProblem, number>>
	byField: Partial<Record<ExtractedField, number>>
	withLavterskel: number
	// Phone candidates sent to review as "a number next to a possible name, with no role word". A count only.
	lostToName: number
}

const bump = <K extends string>(counts: Partial<Record<K, number>>, key: K) => {
	counts[key] = (counts[key] ?? 0) + 1
}

// --offline: nothing is fetched and nothing expires, so the cache must hold every page the scope
// lists. A URL that fetch recorded as not fetched (robots, a 404, a stopped host) is no miss: the
// run that filled the cache never had it either. Any other URL the cache lacks is an error that
// names it (local only: --offline never runs in Actions).
export type ExtractOptions = { offline?: boolean; notFetched?: ReadonlySet<string> }

// Every cached page of one scope (a kommune, or "national" for Nav offices). A URL fetch never
// stored is counted, not read. A scope with no cached page still gives a file, with no pages,
// so verify can write that kommune's failed lock.
export function extractScope(
	scope: string,
	urls: readonly string[],
	cache: PageCache,
	ctx: ExtractContext,
	now: string,
	options: ExtractOptions = {}
): { file: ExtractionFile; summary: ExtractSummary } {
	const summary: ExtractSummary = {
		scope,
		pages: 0,
		notInCache: 0,
		withValues: 0,
		problems: {},
		byField: {},
		withLavterskel: 0,
		lostToName: 0,
	}
	const pages: ExtractedPage[] = []
	for (const url of [...new Set(urls)].sort()) {
		const entry = cache.get(url)
		if (entry === undefined) {
			if (options.offline === true && options.notFetched?.has(url) !== true)
				throw new OfflineMissError(url)
			summary.notInCache++
			continue
		}
		const page = extractPage(entry, cache.read(entry), ctx)
		pages.push(page)
		summary.pages++
		if (page.problem !== undefined) bump(summary.problems, page.problem)
		if (page.candidates.length > 0) summary.withValues++
		for (const c of page.candidates) {
			bump(summary.byField, c.field)
			if (c.field === "phone" && c.review === LOST_TO_NAME) summary.lostToName++
		}
		if (page.lavterskelQuotes.length > 0) summary.withLavterskel++
	}
	const file = ExtractionFile.parse({ scope, extractedAt: now, pages })
	return { file, summary }
}

const counts = (c: Partial<Record<string, number>>) => {
	const parts = Object.entries(c).map(([k, n]) => `${k} ${n}`)
	return parts.length === 0 ? "none" : parts.join(", ")
}

// What the command prints. Actions logs are public: counts, kommune numbers and names, reasons.
export function formatExtractSummary(summaries: readonly ExtractSummary[]): string {
	return summaries
		.map(
			(s) =>
				`${s.scope}${s.name === undefined ? "" : ` ${s.name}`}: ${s.pages} pages, ${s.withValues} with values, ` +
				`${s.notInCache} not in the cache; problems: ${counts(s.problems)}; values: ${counts(s.byField)}; ` +
				`Lavterskel quotes on ${s.withLavterskel} pages; phone lines lost to a possible name: ${s.lostToName}`
		)
		.join("\n")
}

export type ScopeInput = {
	scope: string
	name?: string
	urls: readonly string[]
	ctx: ExtractContext
}

// Every scope in turn, each written whole or not at all (write is writeJsonAtomic in runExtract).
// One scope that stops never stops the next: it is counted, and its old file stays as it was. An
// offline miss is kept apart, with what it missed; any other error gives the scope name only,
// since its text could quote a page. onDone hears of each scope written, for the progress line.
export function extractScopes(
	scopes: readonly ScopeInput[],
	cache: PageCache,
	now: string,
	write: (scope: string, file: ExtractionFile) => void,
	options: ExtractOptions & { onDone?: (scope: string, at: number, of: number) => void } = {}
): { summaries: ExtractSummary[]; failed: string[]; misses: string[] } {
	const summaries: ExtractSummary[] = []
	const failed: string[] = []
	const misses: string[] = []
	for (const [i, s] of scopes.entries()) {
		try {
			const { file, summary } = extractScope(s.scope, s.urls, cache, s.ctx, now, options)
			write(s.scope, file)
			summaries.push(s.name === undefined ? summary : { ...summary, name: s.name })
			options.onDone?.(s.scope, i + 1, scopes.length)
		} catch (err) {
			if (err instanceof OfflineMissError) misses.push(`${s.scope}: ${err.message}`)
			else failed.push(s.scope)
		}
	}
	return { summaries, failed, misses }
}

export const extractionPath = (cacheDir: string, scope: string) =>
	join(cacheDir, "extract", `${scope}.json`)

// The extraction file, or undefined when it is missing or does not match its schema. The error
// is dropped: a parse error quotes the file, and the file holds page lines.
export function readExtraction(cacheDir: string, scope: string): ExtractionFile | undefined {
	const path = extractionPath(cacheDir, scope)
	if (!existsSync(path)) return undefined
	try {
		const parsed = ExtractionFile.safeParse(JSON.parse(readFileSync(path, "utf8")))
		return parsed.success ? parsed.data : undefined
	} catch {
		return undefined
	}
}

// Extraction files hold page lines, so they age out like the pages do (PageCache.purge only
// clears pages/). A file that does not parse ages by its modification time. Returns the count.
export function purgeExtractions(cacheDir: string, nowMs: number): number {
	const dir = join(cacheDir, "extract")
	if (!existsSync(dir)) return 0
	const cutoff = nowMs - MAX_AGE_DAYS * DAY_MS
	let removed = 0
	for (const name of readdirSync(dir)) {
		if (!name.endsWith(".json")) continue
		const path = join(dir, name)
		let at: number
		try {
			const extractedAt: unknown = JSON.parse(readFileSync(path, "utf8")).extractedAt
			at = typeof extractedAt === "string" ? Date.parse(extractedAt) : Number.NaN
		} catch {
			at = Number.NaN
		}
		if (Number.isNaN(at)) at = statSync(path).mtimeMs
		if (at < cutoff) {
			rmSync(path)
			removed++
		}
	}
	return removed
}

export type ExtractRun = {
	root: string
	scopes: readonly ScopeInput[]
	cache: PageCache
	now: string
	nowMs: number
	dryRun?: boolean
	offline?: boolean
	notFetched?: ReadonlySet<string>
	onDone?: (scope: string, at: number, of: number) => void
}

// The extract command's run, so a test can drive it: purge extraction files over 90 days old
// (never offline, where nothing expires, and never in a dry run), then every scope, each written
// whole to <cache>/extract/<scope>.json unless it is a dry run.
export function runExtract(o: ExtractRun): {
	purged: number | undefined
	summaries: ExtractSummary[]
	failed: string[]
	misses: string[]
} {
	const purged =
		o.dryRun === true || o.offline === true ? undefined : purgeExtractions(o.root, o.nowMs)
	const write = (scope: string, file: ExtractionFile) => {
		if (o.dryRun !== true) writeJsonAtomic(extractionPath(o.root, scope), file)
	}
	const result = extractScopes(o.scopes, o.cache, o.now, write, {
		offline: o.offline,
		notFetched: o.notFetched,
		onDone: o.onDone,
	})
	return { purged, ...result }
}
