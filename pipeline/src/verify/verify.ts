import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { matchUnits, type UnitGroup } from "../curate/include.ts"
import { type RenameIo, SaveError, writeCuratedFile, writeLockFile } from "../curate/write.ts"
import type { KommuneDiscovery } from "../discover/types.ts"
import { norwegianDate } from "../gates/grounding.ts"
import { runGates } from "../gates/run.ts"
import type { GateContext, UnitFacts } from "../gates/types.ts"
import type { ManifestEntry } from "../io/pageCache.ts"
import type { AllowList } from "../net/allowList.ts"
import type { Get } from "../net/crawler.ts"
import { namesMatch } from "../recall/match.ts"
import type { NklmRow } from "../registers/nklm.ts"
import type { FieldName } from "../schema/common.ts"
import {
	CuratedFile,
	type CuratedUnit,
	findDecision,
	type ReviewDecision,
} from "../schema/curated.ts"
import type { ExtractedPage, ExtractionFile } from "../schema/extraction.ts"
import { slugify } from "../schema/ids.ts"
import { acceptedCost, type LockField, LockFile, type LockUnit } from "../schema/lock.ts"
import { normaliseText, siteHost } from "../text/normalise.ts"
import { type Proposal, unitCandidates, withCost } from "./candidates.ts"
import {
	buildLookups,
	contextFor,
	kartverketForm,
	resolveAddresses,
	resolveUrls,
} from "./context.ts"

export class VerifyError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "VerifyError"
	}
}

export type VerifyInput = {
	kommune: KommuneDiscovery
	extraction: ExtractionFile
	national?: ExtractionFile
	manifest: readonly ManifestEntry[]
	readHtml: (entry: ManifestEntry) => string | undefined
	allowList: AllowList
	validKommuner: ReadonlySet<string>
	places: readonly string[]
	get: Get
	nklm?: { date: string; rows: readonly NklmRow[] }
	curated?: CuratedFile
	now: string
}

export type VerifyCounts = {
	kommune: string
	name: string
	units: number
	auto: number
	inclusionReview: number
	accepted: number
	review: number
	dropped: number
	noUnitId: number
	unitsWithoutPage: number
	nationalUnmatched: number
	pagesWithProblem: number
	// A page fetched again after extract ran: its extraction no longer describes the cached page.
	pagesStale: number
	// A main unit and its only sub-unit counted as one (Task 14).
	foldedParents: number
	// My accepted or edited answers that verify still could not accept (a mobile with no role).
	answersUnsettled: number
}

export const lockPath = (dataDir: string, kommune: string) =>
	join(dataDir, "lock", `${kommune}.json`)
export const curatedPathFor = (dataDir: string, kommune: string, name: string) =>
	join(dataDir, "curated", `${kommune}-${slugify(name)}.json`)

// The kommune's curated file, whatever its name part: "3405-lillehammer.json".
export function findCuratedPath(dataDir: string, kommune: string): string | undefined {
	const dir = join(dataDir, "curated")
	if (!existsSync(dir)) return undefined
	const name = readdirSync(dir).find((f) => f.startsWith(`${kommune}-`) && f.endsWith(".json"))
	return name === undefined ? undefined : join(dir, name)
}

// Messages name the kommune only: a parse error would quote the file.
export function readCuratedFile(path: string, kommune: string): CuratedFile {
	let data: unknown
	try {
		data = JSON.parse(readFileSync(path, "utf8"))
	} catch {
		throw new VerifyError(`${kommune}: the curated file is not valid JSON`)
	}
	const parsed = CuratedFile.safeParse(data)
	if (!parsed.success)
		throw new VerifyError(`${kommune}: the curated file does not match its schema`)
	return parsed.data
}

function toReview(field: LockField, reason: string): LockField {
	if (field.status === "dropped") return field
	if (field.status === "review")
		return { ...field, reason: `${field.reason ?? "review"}; ${reason}` }
	return { ...field, status: "review", reason }
}

// My answer stands on the page's quotes. The grounding gate passes a decision without reading the
// page (Task 2), so verify checks here that every original quote is still on the cached page, the
// way the grounding gate checks a quote. A register value has no quote and needs no check.
function quotesStillOnPage(c: Proposal["candidate"], ctx: GateContext): boolean {
	if (c.evidence.kind !== "quote") return true
	const page = ctx.pageText(c.sourceUrl)
	if (page === undefined) return false
	const onPage = normaliseText(page)
	return c.evidence.quotes.every(
		(q) => normaliseText(q).length > 0 && onPage.includes(normaliseText(q))
	)
}

// One field: Kartverket's form for an address, my answer if I gave one, then the five gates. A
// rule's or the shared page's review reason applies only where I have not answered. An answer
// whose quotes left the page counts as no answer, so the gates judge the value afresh.
function settle(
	p: Proposal,
	ctx: GateContext,
	decisions: readonly ReviewDecision[],
	now: string
): { field: LockField; unsettled: boolean } {
	let c = p.candidate
	if (c.field === "address" && typeof c.value === "string") {
		const hit = ctx.findAddress(c.value)
		if (hit !== undefined) c = { ...c, value: kartverketForm(c.value, hit) }
	}
	const found = findDecision(decisions, { field: c.field, value: c.value, sourceUrl: c.sourceUrl })
	const d = found !== undefined && quotesStillOnPage(c, ctx) ? found : undefined
	if (d?.decision === "reject") {
		const { gates } = runGates(c, ctx, now)
		const field: LockField = {
			status: "dropped",
			sourceUrl: c.sourceUrl,
			fetchedAt: c.fetchedAt,
			verifiedAt: now,
			gates,
			reason: `my decision of ${norwegianDate(d.decidedOn)}: rejected`,
		}
		return { field, unsettled: false }
	}
	if (d !== undefined) {
		const original = c.evidence.kind === "decision" ? c.evidence.original : c.evidence
		c = {
			...c,
			evidence: { kind: "decision", decidedOn: d.decidedOn, original },
			...(d.decision === "edit" ? { value: d.editedValue ?? c.value } : {}),
			// The role I typed with an edited mobile: the safety gate passes a mobile only with one.
			...(d.role === undefined ? {} : { role: d.role }),
		}
		const field = runGates(c, ctx, now)
		return { field, unsettled: field.status !== "accepted" }
	}
	const field = runGates(c, ctx, now)
	return { field: p.review === undefined ? field : toReview(field, p.review), unsettled: false }
}

// The pages verify may use: those whose extraction describes the page the cache holds now. A page
// fetched again after extract ran (or purged from the cache) gives no values until extract runs
// again, so a value I accepted can never outlive the page it came from.
function freshPages(
	pages: readonly ExtractedPage[],
	manifest: readonly ManifestEntry[]
): { fresh: ExtractedPage[]; stale: number } {
	const byUrl = new Map(manifest.map((e) => [e.url, e]))
	const fresh: ExtractedPage[] = []
	let stale = 0
	for (const p of pages) {
		if (byUrl.get(p.url)?.fetchedAt === p.fetchedAt) fresh.push(p)
		else stale++
	}
	return { fresh, stale }
}

// The values I typed in review that verify must look up before the gates run: addresses through
// Kartverket, website and chat URLs through the crawler.
function editedValues(curated: CuratedFile | undefined, fields: ReadonlySet<FieldName>): string[] {
	return (curated?.units ?? []).flatMap((u) =>
		u.decisions.flatMap((d) =>
			d.decision === "edit" && fields.has(d.field) && typeof d.editedValue === "string"
				? [d.editedValue]
				: []
		)
	)
}

function sourcesOf(g: UnitGroup): LockUnit["sources"] {
	const nav = g.pages.find((p) => p.navOfficeId !== undefined)?.navOfficeId
	return [
		...(g.unit === undefined ? [] : [{ kind: "brreg" as const, ref: g.unit.orgNumber }]),
		...(nav === undefined ? [] : [{ kind: "nav" as const, ref: nav }]),
		...g.pages.map((p) => ({ kind: "page" as const, ref: p.finalUrl })),
	]
}

function curatedFor(g: UnitGroup): CuratedUnit | undefined {
	if (g.inclusion.status !== "auto" || g.providerType === undefined) return undefined
	const nav = g.pages.find((p) => p.navOfficeId !== undefined)?.navOfficeId
	return {
		unitId: g.unitId,
		name: g.name,
		include: true,
		sources: {
			...(g.unit === undefined ? {} : { orgNumber: g.unit.orgNumber }),
			...(nav === undefined ? {} : { navOfficeId: nav }),
			pages: g.pages.map((p) => p.finalUrl),
		},
		categories: g.categories,
		providerType: g.providerType,
		decisions: [],
	}
}

// Verify one kommune: everything in memory, nothing written. A throw anywhere (a lookup, a schema)
// leaves the files as they were.
export async function verifyKommune(
	input: VerifyInput
): Promise<{ lock: LockFile; curated: CuratedFile; counts: VerifyCounts }> {
	const k = input.kommune
	const { fresh: pages, stale } = freshPages(
		[...input.extraction.pages, ...(input.national?.pages ?? [])],
		input.manifest
	)
	const national = new Set((input.national?.pages ?? []).map((p) => p.url))
	const nklmHere = (input.nklm?.rows ?? []).filter((r) => r.kommuner.includes(k.kommune))
	const wanted = new Set<string>()
	for (const u of k.units) if (u.address !== undefined) wanted.add(u.address)
	for (const p of pages)
		for (const c of p.candidates)
			if (c.field === "address" && typeof c.value === "string") wanted.add(c.value)
	for (const r of nklmHere) if (r.address !== undefined) wanted.add(r.address)
	for (const a of editedValues(input.curated, new Set(["address"]))) wanted.add(a)
	const resolved = await resolveAddresses(input.get, wanted, k.kommune)
	const addresses = new Map(resolved)
	for (const [a, hit] of resolved)
		if (hit?.text !== undefined) addresses.set(kartverketForm(a, hit), hit)
	const checkedUrls = await resolveUrls(
		input.get,
		editedValues(input.curated, new Set(["website", "chatUrl"]))
	)

	const match = matchUnits({
		units: k.units,
		pages,
		national,
		addressId: (a) => addresses.get(a)?.addressId,
		...(k.site === undefined ? {} : { kommuneHost: k.site.host }),
		nklmLegevakt: (name) => nklmHere.some((r) => namesMatch(r.name, name)),
	})
	const sharers = new Map<string, UnitGroup[]>()
	for (const g of match.groups)
		for (const p of g.pages) sharers.set(p.finalUrl, [...(sharers.get(p.finalUrl) ?? []), g])
	const lookups = buildLookups({
		manifest: input.manifest,
		readHtml: input.readHtml,
		allowList: input.allowList,
		validKommuner: input.validKommuner,
		addresses,
		checkedUrls,
	})
	const own = k.site === undefined ? undefined : siteHost(`https://${k.site.host}/`)
	const kommunePages = pages.filter((p) => own !== undefined && siteHost(p.finalUrl) === own)
	const curated: CuratedFile = input.curated ?? { kommune: k.kommune, name: k.name, units: [] }
	const mine = new Map(curated.units.map((u) => [u.unitId, u]))
	const counts: VerifyCounts = {
		kommune: k.kommune,
		name: k.name,
		units: 0,
		auto: 0,
		inclusionReview: 0,
		accepted: 0,
		review: 0,
		dropped: 0,
		noUnitId: match.noUnitId,
		unitsWithoutPage: match.unitsWithoutPage,
		nationalUnmatched: match.nationalUnmatched,
		pagesWithProblem: match.pagesWithProblem,
		pagesStale: stale,
		foldedParents: match.foldedParents,
		answersUnsettled: 0,
	}
	const units: LockUnit[] = []
	const added: CuratedUnit[] = []
	for (const g of match.groups) {
		const answer = mine.get(g.unitId)
		if (answer?.include === false) continue
		const { chosen, peers } = unitCandidates({
			kommune: k.kommune,
			group: g,
			sharers,
			...(k.switchboard === undefined ? {} : { switchboard: k.switchboard }),
			kommunePages,
			...(input.nklm === undefined ? {} : { nklm: { date: input.nklm.date, rows: nklmHere } }),
			places: input.places,
		})
		const facts: UnitFacts = {
			categories: answer?.categories ?? g.categories,
			isKrisesenter: g.isKrisesenter,
			ownHosts: new Set(
				g.pages.map((p) => siteHost(p.finalUrl)).filter((h): h is string => h !== undefined)
			),
			...(g.unit === undefined ? {} : { orgForm: g.unit.orgForm }),
		}
		const ctx = contextFor(lookups, facts, peers)
		const fields: Partial<Record<FieldName, LockField>> = {}
		const settleInto = (p: Proposal, at: typeof ctx) => {
			const { field, unsettled } = settle(p, at, answer?.decisions ?? [], input.now)
			fields[p.candidate.field] = field
			counts[field.status]++
			if (unsettled) counts.answersUnsettled++
		}
		for (const p of chosen) if (p.candidate.field !== "lowThreshold") settleInto(p, ctx)
		// The Lavterskel rule reads the unit's own accepted cost, so it runs after every other field,
		// with that cost in its facts and in the value it proposes.
		const cost = acceptedCost(fields)
		const withUnitCost = cost === undefined ? ctx : { ...ctx, unit: { ...ctx.unit, cost } }
		for (const p of chosen)
			if (p.candidate.field === "lowThreshold") settleInto(withCost(p, cost), withUnitCost)
		units.push({ unitId: g.unitId, sources: sourcesOf(g), fields, inclusion: g.inclusion })
		counts.units++
		if (g.inclusion.status === "auto") counts.auto++
		else if (answer === undefined) counts.inclusionReview++
		const auto = answer === undefined ? curatedFor(g) : undefined
		if (auto !== undefined) added.push(auto)
	}
	// A parse error would quote a value, so only the kommune is named.
	const parsed = LockFile.safeParse({
		kommune: k.kommune,
		units: units.sort((a, b) => (a.unitId < b.unitId ? -1 : 1)),
	})
	if (!parsed.success)
		throw new VerifyError(
			`${k.kommune}: the lock file does not match its schema: nothing was written`
		)
	const lock = parsed.data
	const all = [...curated.units, ...added].sort((a, b) => (a.unitId < b.unitId ? -1 : 1))
	return { lock, curated: { ...curated, units: all }, counts }
}

// Verify, then write the curated file and the lock file, each whole and each with the Windows
// retry. Nothing is written for a kommune that does not complete. The curated file goes first: a
// lock that fails to save after it leaves extra curated units, which review never walks, while a
// lock with no curated file would stop the whole review run. The CLI holds the data folder
// (holdDataDir) for the whole run, so no review writes the curated file in between.
export async function verifyAndWrite(
	dataDir: string,
	input: VerifyInput,
	io: RenameIo = {}
): Promise<VerifyCounts> {
	const { lock, curated, counts } = await verifyKommune(input)
	const path =
		findCuratedPath(dataDir, input.kommune.kommune) ??
		curatedPathFor(dataDir, input.kommune.kommune, input.kommune.name)
	await writeCuratedFile(path, curated, io)
	await writeLockFile(lockPath(dataDir, input.kommune.kommune), lock, io)
	return counts
}

// A kommune verify did not finish, and why. Every VerifyError message opens with its kommune.
export type Unfinished = { kommune: string; reason: string }

// The reason a kommune stopped, by class. An unexpected error's own text could quote a file, and
// Actions logs are public, so only the class is printed for it.
export function unfinishedReason(kommune: string, err: unknown): string {
	if (err instanceof VerifyError) return err.message
	if (err instanceof SaveError) return `${kommune}: ${err.message}`
	return `${kommune}: stopped on an unexpected error`
}

// Each kommune on its own, as extract runs each scope: one that stops is named in the summary and
// never stops the next, and the counts of the ones done still print. run gives undefined for a
// kommune with no extraction file.
export async function verifyEach<K extends { kommune: string }>(
	kommuner: readonly K[],
	run: (k: K) => Promise<VerifyCounts | undefined>
): Promise<{ counts: VerifyCounts[]; missing: string[]; unfinished: Unfinished[] }> {
	const counts: VerifyCounts[] = []
	const missing: string[] = []
	const unfinished: Unfinished[] = []
	for (const k of kommuner) {
		try {
			const done = await run(k)
			if (done === undefined) missing.push(k.kommune)
			else counts.push(done)
		} catch (err) {
			unfinished.push({ kommune: k.kommune, reason: unfinishedReason(k.kommune, err) })
		}
	}
	return { counts, missing, unfinished }
}

// The kommuner a run did not finish, by number, then one reason line each.
export function formatUnfinished(unfinished: readonly Unfinished[]): string {
	return [
		`not finished: ${unfinished.map((u) => u.kommune).join(", ")}`,
		...unfinished.map((u) => u.reason),
	].join("\n")
}

// What the command prints. Actions logs are public: counts, kommune numbers and names only.
export function formatVerifySummary(counts: readonly VerifyCounts[]): string {
	return counts
		.map(
			(c) =>
				`${c.kommune} ${c.name}: ${c.units} units (${c.auto} included by rule, ${c.inclusionReview} to ask), ` +
				`fields ${c.accepted} accepted, ${c.review} review, ${c.dropped} dropped; ` +
				`${c.answersUnsettled} of my answers did not settle their field; ` +
				`${c.foldedParents} main units folded into their only sub-unit; ` +
				`not stored: ${c.noUnitId} pages with no unit id, ${c.unitsWithoutPage} Brreg units with no page, ` +
				`${c.nationalUnmatched} national pages with no unit here, ${c.pagesWithProblem} pages with a problem, ` +
				`${c.pagesStale} pages fetched again since extract (run extract)`
		)
		.join("\n")
}
