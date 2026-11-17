import type { z } from "zod"
import type { AnswerKey, KeyRow } from "../answerKey/schema.ts"
import { matchKeyRow, score as scoreKey } from "../answerKey/score.ts"
import type { DiscoveryFiles } from "../discover/files.ts"
import type { CrawlReport, SkipReason } from "../net/crawler.ts"
import { recall, STOP_TEXT } from "../recall/report.ts"
import { FIELD_NAMES, type FieldName, type FieldValue, GATE_NAMES } from "../schema/common.ts"
import type { CuratedFile } from "../schema/curated.ts"
import { evidenceQuotes, type LockFile } from "../schema/lock.ts"
import { normaliseUrl, siteHost } from "../text/normalise.ts"
import { TRANSIENT_KINDS } from "../verify/failed.ts"
import { checksAgree, type KnownWrong, type PilotChecks, type RULINGS } from "./checks.ts"
import { compareText, curatedIds, drawSample, SAMPLE_SIZE, waitsForInclusion } from "./sample.ts"

export type Checks = z.infer<typeof PilotChecks>
export type Check = Checks["checks"][number]
export type RulingName = (typeof RULINGS)[number]
export type Ruling = { ruling: RulingName; note: string }

// One page extract read, cut down to what recall needs. The score never holds page text.
export type PageCount = { url: string; finalUrl: string; candidates: number }

export type PilotInput = {
	// The kommuner scored (PILOT for --only pilot), the ones the answer key covers, and the ones
	// that block ClaudeBot.
	pilot: readonly string[]
	keyKommuner: readonly string[]
	blocked: readonly string[]
	// Their sites, as siteHost gives them (from discover). A value read from one of these pages is
	// checked by hand too, whatever the unit's kommune.
	blockedHosts: readonly string[]
	locks: readonly LockFile[]
	curated: readonly CuratedFile[]
	key: AnswerKey
	// The rows whose badge the new Lavterskel rule changes (test/lavterskel-changes.json).
	decideOnce: readonly number[]
	checks: Checks
	known: z.infer<typeof KnownWrong>
	// What discover wrote: recall's discover reasons come from it.
	discovery: DiscoveryFiles
	// The merged crawl report, when the cache has one.
	crawl?: CrawlReport
	// Per kommune number, and "national", the pages extract read.
	extracted: Readonly<Record<string, readonly PageCount[]>>
}

export const INCLUSION_SECONDS = 30
export const LOST_STAGES = [
	"failed",
	"discover",
	"notFetched",
	"noValues",
	"noUnitId",
	"droppedByGate",
	"noMatch",
] as const
export type LostStage = (typeof LOST_STAGES)[number]
export type RuleStatus = "pass" | "fail" | "waiting"
export type RuleLine = {
	rule: 1 | 2 | 3 | 4 | 5
	title: string
	measured: string
	target: string
	status: RuleStatus
}
export type KommuneRow = {
	kommune: string
	name: string
	units: number
	waiting: number
	unitsWithReview: number
	accepted: number
	review: number
	dropped: number
	failed?: { kind: string; reason: string }
}
export type ReasonGroup = { gate: string; reason: string; count: number }
export type LostRow = {
	keyId: number
	kommune: string
	name: string
	stage: LostStage
	reason: string
	website?: string
}
export type Disagreement = {
	keyId: number
	kommune: string
	unitId: string
	field: FieldName
	keyValue: FieldValue
	pipelineValue: FieldValue
	sourceUrl: string
	quotes: string[]
	proposed?: Ruling
	mine?: Ruling
	byHand: boolean
}
export type SampleField = {
	field: FieldName
	value: FieldValue
	sourceUrl: string
	quotes: string[]
	proposed?: Ruling
	mine?: Ruling
	byHand: boolean
}
export type SampleUnit = {
	kommune: string
	unitId: string
	sources: { kind: string; ref: string }[]
	fields: SampleField[]
}

export type ScoreRefusal = { refused: true; problems: string[] }
// Everything the report's seven parts need. Every list is sorted: kommune number, then unit id,
// then field; review reasons by count, largest first, then gate name, then reason.
export type PilotScore = {
	refused: false
	pass: boolean
	keyFrozenOn: string
	rules: RuleLine[]
	kommuner: KommuneRow[]
	reviewFields: number
	reviewReasons: ReasonGroup[]
	inclusion: {
		rows: { kommune: string; name: string; questions: number }[]
		total: number
		estimateMinutes: number
	}
	recall: { keyRows: number; found: number; lost: LostRow[] }
	disagreements: Disagreement[]
	badgeMismatches: number[]
	sample: { size: number; drawn: number; units: SampleUnit[] }
	oldestFetchedAt?: string
	// What "done when" counts: rulings and checks by me only, and what waits for my own browser.
	done: {
		disagreements: number
		disagreementsRuled: number
		sampleFields: number
		sampleFieldsChecked: number
		checkByHand: number
	}
}

const GATES: ReadonlySet<string> = new Set(GATE_NAMES)
const SORTED_FIELDS = [...FIELD_NAMES].sort(compareText)
const percent = (n: number, of: number) => (of === 0 ? 0 : Math.round((n * 1000) / of) / 10)

// A review reason as runGates and verify build it: gate results joined by "; ", each
// "<gate>: <reason>". A part with no gate name in front (the place-part rule, a rule's own review
// reason, "my decision of ...") belongs to the gate "rule".
export function reasonParts(reason: string): { gate: string; reason: string }[] {
	return reason
		.split("; ")
		.filter((part) => part.trim() !== "")
		.map((part) => {
			const at = part.indexOf(": ")
			const gate = at === -1 ? "" : part.slice(0, at)
			return GATES.has(gate) ? { gate, reason: part.slice(at + 2) } : { gate: "rule", reason: part }
		})
}

const SKIP_TEXT: Readonly<Record<SkipReason, string>> = {
	notHttps: "the address is not https",
	notAllowListed: "its host is not on the allow list",
	robots: "robots.txt refuses it",
	hostSkipped: "its host was stopped",
	httpStatus: "the server answered with an error",
	wrongType: "it is not an HTML page",
	tooLarge: "the page is too large",
	tooManyRedirects: "too many redirects",
}

// Why a page the key names never reached the cache: the crawler's own reason for that URL, else
// its host's stop, else nothing more than the fact.
function notFetchedReason(website: string, crawl: CrawlReport | undefined): string {
	const target = normaliseUrl(website)
	const skipped = crawl?.notFetched.find((n) => normaliseUrl(n.url) === target)
	if (skipped !== undefined) {
		const status = skipped.status === undefined ? "" : ` (HTTP ${skipped.status})`
		return `not fetched: ${SKIP_TEXT[skipped.reason]}${status}`
	}
	const host = siteHost(website)
	const stop = crawl?.hosts.find(
		(h) => h.stopped !== undefined && siteHost(`https://${h.host}/`) === host
	)?.stopped
	return stop === undefined
		? "not fetched"
		: `not fetched: its host was stopped (${STOP_TEXT[stop]})`
}

const NO_MATCH = "no lock unit matches it by name, or by address and phone"

// The stage that lost a key row: a failed kommune first, then discover's own reason, then the
// key's website traced through fetch, extract and verify.
function lostAt(
	row: KeyRow,
	lock: LockFile | undefined,
	discoverReason: string | undefined,
	pages: readonly PageCount[],
	crawl: CrawlReport | undefined
): { stage: LostStage; reason: string } {
	if (lock?.failed !== undefined) return { stage: "failed", reason: lock.failed.reason }
	// Recall writes hosts as code for its own report; here every reason is plain text.
	if (discoverReason !== undefined)
		return { stage: "discover", reason: discoverReason.replaceAll("`", "") }
	const website = row.fields.website
	if (website === null) return { stage: "noMatch", reason: NO_MATCH }
	const target = normaliseUrl(website)
	const page = pages.find(
		(p) => normaliseUrl(p.url) === target || normaliseUrl(p.finalUrl) === target
	)
	if (page === undefined) return { stage: "notFetched", reason: notFetchedReason(website, crawl) }
	if (page.candidates === 0) return { stage: "noValues", reason: "no values extracted" }
	const urls = new Set([normaliseUrl(page.url), normaliseUrl(page.finalUrl)])
	const onPage = (lock?.units ?? []).filter((u) =>
		u.sources.some((s) => s.kind === "page" && urls.has(normaliseUrl(s.ref)))
	)
	if (onPage.length === 0) return { stage: "noUnitId", reason: "fetched, no unit id" }
	const dropped = onPage.map((u) => u.fields.name).find((f) => f?.status === "dropped")
	if (dropped !== undefined)
		return {
			stage: "droppedByGate",
			reason: `dropped by a gate: ${dropped.reason ?? "no reason given"}`,
		}
	return { stage: "noMatch", reason: `a unit was built from its page, but ${NO_MATCH}` }
}

type Slot = { ruling: Ruling; entry: number }
const targetOf = (kind: Check["kind"], keyId: number | undefined, unitId: string, field: string) =>
	`${kind}|${keyId ?? "-"}|${unitId}|${field}`
// Never the unit id: it holds an org number, and refusals print to public logs.
const entryText = (c: Check) =>
	`${c.kind}${c.keyId === undefined ? "" : `, row ${c.keyId}`}, ${c.field}`

function keyValueOf(row: KeyRow, field: FieldName): FieldValue | null {
	const fields: Readonly<Partial<Record<FieldName, FieldValue | null>>> = row.fields
	return fields[field] ?? null
}

// The pass mark names 20 accepted units, so a shorter sample is not the check it names: it fails.
function sampleStatus(wrong: number, drawn: number, unchecked: number): RuleStatus {
	if (wrong > 0 || drawn < SAMPLE_SIZE) return "fail"
	return unchecked > 0 ? "waiting" : "pass"
}

const quotesOf = (f: { evidence?: Parameters<typeof evidenceQuotes>[0] }) =>
	f.evidence === undefined ? [] : [...evidenceQuotes(f.evidence)]

export function scorePilot(input: PilotInput): PilotScore | ScoreRefusal {
	const pilot = [...input.pilot].sort(compareText)
	const byKommune = new Map(input.locks.map((l) => [l.kommune, l]))
	const locks: LockFile[] = []
	const stops: string[] = []
	for (const kommune of pilot) {
		const lock = byKommune.get(kommune)
		if (lock === undefined) {
			stops.push(
				`${kommune}: never attempted (no lock file): run the stages for it, then score again`
			)
			continue
		}
		if (lock.failed !== undefined && TRANSIENT_KINDS.includes(lock.failed.kind)) {
			stops.push(
				`${kommune}: failed for ${lock.failed.kind} (${lock.failed.reason}): run fetch --resume, then extract and verify again`
			)
		}
		locks.push(lock)
	}
	// A partial pilot, or one a sleeping PC broke, is never scored as a whole one.
	if (stops.length > 0) return { refused: true, problems: stops }

	const unitOf = (kommune: string, unitId: string) =>
		byKommune.get(kommune)?.units.find((u) => u.unitId === unitId)
	// A field reads a blocked kommune's text when its kommune blocks ClaudeBot, or when its value or
	// any page of its unit lies on a blocked kommune's site (a unit in an open kommune can be hosted there).
	const blockedHosts = new Set(input.blockedHosts)
	const readsBlocked = (kommune: string, urls: readonly string[]) =>
		input.blocked.includes(kommune) ||
		urls.some((url) => {
			const host = siteHost(url)
			return host !== undefined && blockedHosts.has(host)
		})
	const pagesOf = (kommune: string, unitId: string) =>
		(unitOf(kommune, unitId)?.sources ?? []).filter((s) => s.kind === "page").map((s) => s.ref)
	const keyLocks = locks.filter((l) => input.keyKommuner.includes(l.kommune))
	// checksAgree names unit ids, which hold org numbers, so a refusal gives the count only.
	const agree = checksAgree(input.checks, input.known).length
	const problems: string[] =
		agree === 0
			? []
			: [
					`test/pilot-checks.json and test/known-wrong.json disagree in ${agree} ${agree === 1 ? "place" : "places"}: run npx vitest run test/golden.test.ts to see them`,
				]

	// One proposal and one ruling of mine per checked field. A second of either is a mistake in
	// the file, so the score never depends on which entry comes first.
	const slots = new Map<string, Partial<Record<Check["by"], Slot>>>()
	for (const [i, c] of input.checks.checks.entries()) {
		const target = targetOf(c.kind, c.keyId, c.unitId, c.field)
		const slot = slots.get(target) ?? {}
		const earlier = slot[c.by]
		if (earlier === undefined)
			slot[c.by] = { ruling: { ruling: c.ruling, note: c.note }, entry: i + 1 }
		else
			problems.push(
				`test/pilot-checks.json entries ${earlier.entry} and ${i + 1} (${entryText(c)}) are both ${c.by === "me" ? "mine" : "proposals"}: keep one`
			)
		slots.set(target, slot)
	}
	const rulings = (target: string): { proposed?: Ruling; mine?: Ruling } => {
		const slot = slots.get(target)
		return {
			...(slot?.proposed === undefined ? {} : { proposed: slot.proposed.ruling }),
			...(slot?.me === undefined ? {} : { mine: slot.me.ruling }),
		}
	}

	// Part 6: every accepted value in the key kommuner that differs from the key.
	const keyed = scoreKey({
		locks: keyLocks,
		key: input.key,
		kommuner: input.keyKommuner,
		decideOnce: input.decideOnce,
	})
	const rowById = new Map(input.key.rows.map((r) => [r.id, r]))
	const disagreements: Disagreement[] = []
	// A badge mismatch is listed here too, so a ruling on it still occurs; rule 4 counts it, rule 1 does not.
	for (const w of [...keyed.wrong, ...keyed.badgeWrong]) {
		const row = rowById.get(w.keyId)
		if (row === undefined || row.kommune === null) continue
		const field = w.field as FieldName
		const lockField = unitOf(row.kommune, w.unitId)?.fields[field]
		const keyValue = keyValueOf(row, field)
		if (lockField?.value === undefined || keyValue === null) continue
		const r = rulings(targetOf("disagreement", row.id, w.unitId, field))
		disagreements.push({
			keyId: row.id,
			kommune: row.kommune,
			unitId: w.unitId,
			field,
			keyValue,
			pipelineValue: lockField.value,
			sourceUrl: lockField.sourceUrl,
			quotes: quotesOf(lockField),
			...r,
			byHand:
				readsBlocked(row.kommune, [lockField.sourceUrl, ...pagesOf(row.kommune, w.unitId)]) &&
				r.mine === undefined,
		})
	}
	disagreements.sort(
		(a, b) =>
			compareText(a.kommune, b.kommune) ||
			compareText(a.unitId, b.unitId) ||
			compareText(a.field, b.field) ||
			a.keyId - b.keyId
	)

	// Part 7: the sample from the kommuner the key does not cover, each accepted field with its checks.
	const outside = pilot.filter((k) => !input.keyKommuner.includes(k))
	const drawn = drawSample(locks, input.curated, outside)
	const sample: SampleUnit[] = []
	for (const { kommune, unitId } of drawn) {
		const unit = unitOf(kommune, unitId)
		if (unit === undefined) continue
		const fields: SampleField[] = []
		for (const field of SORTED_FIELDS) {
			const f = unit.fields[field]
			if (f?.status !== "accepted" || f.value === undefined) continue
			const r = rulings(targetOf("sample", undefined, unitId, field))
			fields.push({
				field,
				value: f.value,
				sourceUrl: f.sourceUrl,
				quotes: quotesOf(f),
				...r,
				byHand:
					readsBlocked(kommune, [f.sourceUrl, ...pagesOf(kommune, unitId)]) && r.mine === undefined,
			})
		}
		sample.push({
			kommune,
			unitId,
			sources: unit.sources.map((s) => ({ kind: s.kind, ref: s.ref })),
			fields,
		})
	}

	// A check whose disagreement or sampled field no longer occurs fails the score, as a stale
	// known-wrong entry fails the golden test. Each gap PR removes its own entries.
	const live = new Set([
		...disagreements.map((d) => targetOf("disagreement", d.keyId, d.unitId, d.field)),
		...sample.flatMap((u) => u.fields.map((f) => targetOf("sample", undefined, u.unitId, f.field))),
	])
	for (const [i, c] of input.checks.checks.entries()) {
		if (!live.has(targetOf(c.kind, c.keyId, c.unitId, c.field))) {
			problems.push(
				`test/pilot-checks.json entry ${i + 1} (${entryText(c)}) no longer occurs: remove it, and its known-wrong entry if it has one`
			)
		}
	}
	if (problems.length > 0) return { refused: true, problems }

	// Parts 2, 3 and 4, and the oldest fetchedAt, in one pass over every field.
	const ids = curatedIds(input.curated)
	const names = new Map<string, string>()
	for (const file of input.curated) names.set(file.kommune, file.name)
	for (const k of input.discovery.kommuner) names.set(k.kommune, k.name)
	const groups = new Map<string, ReasonGroup>()
	const kommuner: KommuneRow[] = []
	let reviewFields = 0
	let oldest: string | undefined
	for (const lock of locks) {
		const row: KommuneRow = {
			kommune: lock.kommune,
			name: names.get(lock.kommune) ?? "",
			units: lock.units.length,
			waiting: 0,
			unitsWithReview: 0,
			accepted: 0,
			review: 0,
			dropped: 0,
			...(lock.failed === undefined
				? {}
				: { failed: { kind: lock.failed.kind, reason: lock.failed.reason } }),
		}
		for (const unit of lock.units) {
			const waits = waitsForInclusion(unit, ids.get(lock.kommune))
			if (waits) row.waiting++
			let inReview = false
			for (const f of Object.values(unit.fields)) {
				if (f === undefined) continue
				if (oldest === undefined || f.fetchedAt < oldest) oldest = f.fetchedAt
				row[f.status]++
				if (f.status !== "review") continue
				inReview = true
				reviewFields++
				for (const part of reasonParts(f.reason ?? "review")) {
					const key = `${part.gate}\u0000${part.reason}`
					const group = groups.get(key) ?? { ...part, count: 0 }
					group.count++
					groups.set(key, group)
				}
			}
			// A unit waiting for "include this unit?" is not a row yet (spec decision 2).
			if (inReview && !waits) row.unitsWithReview++
		}
		kommuner.push(row)
	}
	const reviewReasons = [...groups.values()].sort(
		(a, b) => b.count - a.count || compareText(a.gate, b.gate) || compareText(a.reason, b.reason)
	)
	const waitingTotal = kommuner.reduce((n, k) => n + k.waiting, 0)
	const counted = kommuner.reduce((n, k) => n + k.units - k.waiting, 0)
	const withReview = kommuner.reduce((n, k) => n + k.unitsWithReview, 0)

	// Rule 3 and part 5. A unit in review or waiting for inclusion still finds its row (Decided 8).
	const inScope = input.key.rows.filter(
		(r) => !r.national && r.kommune !== null && input.keyKommuner.includes(r.kommune)
	)
	const found = new Set<number>()
	for (const lock of keyLocks) {
		const rows = inScope.filter((r) => r.kommune === lock.kommune)
		for (const unit of lock.units) {
			const row = matchKeyRow(unit, rows, { anyStatus: true })
			if (row !== undefined) found.add(row.id)
		}
	}
	const discoverMisses = new Map(
		recall({
			key: input.key,
			kommuner: input.discovery.kommuner,
			national: input.discovery.national,
			report: input.discovery.report,
			hosts: input.discovery.hosts,
		}).misses.map((m) => [m.id, m.reason])
	)
	const lost: LostRow[] = inScope
		.filter((r) => !found.has(r.id))
		.map((r) => {
			const kommune = r.kommune ?? ""
			const pages = [...(input.extracted[kommune] ?? []), ...(input.extracted.national ?? [])]
			const at = lostAt(r, byKommune.get(kommune), discoverMisses.get(r.id), pages, input.crawl)
			return {
				keyId: r.id,
				kommune,
				name: r.name,
				...at,
				...(r.fields.website === null ? {} : { website: r.fields.website }),
			}
		})
		.sort((a, b) => compareText(a.kommune, b.kommune) || a.keyId - b.keyId)

	const badges = [...new Set(keyed.badgeMismatches)].sort((a, b) => a - b)
	const values = disagreements.filter((d) => d.field !== "lowThreshold")
	const fine = values.filter(
		(d) => d.mine?.ruling === "keyStale" || d.mine?.ruling === "right"
	).length
	const wrongCounted = values.length - fine
	const sampleFields = sample.flatMap((u) => u.fields)
	const checked = sampleFields.filter((f) => f.mine !== undefined).length
	// Any ruling of mine other than "right" counts as wrong, as "unclear" does in rule 1.
	const sampleWrong = sampleFields.filter(
		(f) => f.mine !== undefined && f.mine.ruling !== "right"
	).length
	const status = (ok: boolean): RuleStatus => (ok ? "pass" : "fail")
	const rules: RuleLine[] = [
		{
			rule: 1,
			title: "Zero wrong values in the key kommuner",
			measured: `${wrongCounted} wrong. Differ from the key: ${values.length}; ruled key stale or right by me: ${fine}`,
			target: "0",
			status: status(wrongCounted === 0),
		},
		{
			rule: 2,
			title: "At most 1 unit in 10 with a field in review, in all pilot kommuner",
			measured: `${withReview} of ${counted} units (${percent(withReview, counted)}%). Waiting for their inclusion answer, not counted: ${waitingTotal}`,
			target: "at most 1 in 10",
			// A rule with nothing to measure has not been met.
			status: status(counted > 0 && withReview * 10 <= counted),
		},
		{
			rule: 3,
			title: "At least 9 in 10 key rows found in the key kommuner",
			measured: `${found.size} of ${inScope.length} (${percent(found.size, inScope.length)}%)`,
			target: `at least ${Math.ceil((inScope.length * 9) / 10)} of ${inScope.length}`,
			status: status(inScope.length > 0 && found.size * 10 >= inScope.length * 9),
		},
		{
			rule: 4,
			title: "Lavterskel badges match the key, apart from the rows I decide once",
			measured: `rows that differ: ${badges.length === 0 ? "none" : badges.join(", ")}`,
			target: "none",
			status: status(badges.length === 0),
		},
		{
			rule: 5,
			title: "Zero wrong values in the sample outside the key",
			measured: `${sampleWrong} wrong. Fields checked by me: ${checked} of ${sampleFields.length}; units drawn: ${drawn.length} of ${SAMPLE_SIZE}`,
			target: "0, with every sampled field checked by me",
			status: sampleStatus(sampleWrong, drawn.length, sampleFields.length - checked),
		},
	]

	const inclusionRows = kommuner
		.filter((k) => k.waiting > 0)
		.map((k) => ({ kommune: k.kommune, name: k.name, questions: k.waiting }))
	return {
		refused: false,
		pass: rules.every((r) => r.status === "pass"),
		keyFrozenOn: input.key.frozenOn,
		rules,
		kommuner,
		reviewFields,
		reviewReasons,
		inclusion: {
			rows: inclusionRows,
			total: waitingTotal,
			estimateMinutes: Math.ceil((waitingTotal * INCLUSION_SECONDS) / 60),
		},
		recall: { keyRows: inScope.length, found: found.size, lost },
		disagreements,
		badgeMismatches: badges,
		sample: { size: SAMPLE_SIZE, drawn: drawn.length, units: sample },
		...(oldest === undefined ? {} : { oldestFetchedAt: oldest }),
		done: {
			disagreements: disagreements.length,
			disagreementsRuled: disagreements.filter((d) => d.mine !== undefined).length,
			sampleFields: sampleFields.length,
			sampleFieldsChecked: checked,
			checkByHand:
				disagreements.filter((d) => d.byHand).length + sampleFields.filter((f) => f.byHand).length,
		},
	}
}
