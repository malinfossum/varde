import { cellText, codeBlock, codeSpan } from "./markdown.ts"
import {
	INCLUSION_SECONDS,
	type LostStage,
	type PilotScore,
	type RuleStatus,
	type Ruling,
	type RulingName,
} from "./pilot.ts"
import { compareText } from "./sample.ts"
import { formatDuration, groupDigits, JOB_LIMIT_MS, type ScaleNumbers } from "./scale.ts"

// GitHub refuses a PR body over 65,536 characters. The summary stays under this, with room left
// for my own lines.
export const PR_BODY_LIMIT = 60_000

export class PrBodyTooLongError extends Error {
	constructor(length: number) {
		super(
			`the PR body is ${length} characters, over the ${PR_BODY_LIMIT}-character limit: nothing was written`
		)
		this.name = "PrBodyTooLongError"
	}
}

const dotted = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`

const RESULT: Readonly<Record<RuleStatus, string>> = {
	pass: "pass",
	fail: "fail",
	waiting: "waiting for my checks",
}
const RULING_TEXT: Readonly<Record<RulingName, string>> = {
	keyStale: "key stale",
	pipelineWrong: "pipeline wrong",
	unclear: "unclear",
	right: "right",
}
const STAGE_TEXT: Readonly<Record<LostStage, string>> = {
	failed: "the failed kommune",
	discover: "discover",
	notFetched: "fetch",
	noValues: "extract",
	noUnitId: "verify (no unit)",
	droppedByGate: "verify (a gate)",
	noMatch: "verify (no match)",
}
const STAGE_ORDER = ["discover", "fetch", "extract", "verify", "score"]
const SHOWN_HOSTS = 30
const BY_HAND =
	"none yet. Check by hand: its kommune, or the site its page is on, blocks ClaudeBot, so no AI session reads it."

// Blocks of lines with one blank line between them.
const spaced = (blocks: readonly (readonly string[])[]): string[] =>
	blocks.flatMap((b, i) => (i === 0 ? [...b] : ["", ...b]))

const kommuneLabel = (kommune: string, name: string) =>
	name === "" ? kommune : `${kommune} ${cellText(name)}`
const rulingText = (r: Ruling) => `${RULING_TEXT[r.ruling]}. ${cellText(r.note)}`

function myText(mine: Ruling | undefined, byHand: boolean): string {
	if (mine !== undefined) return rulingText(mine)
	return byHand ? BY_HAND : "none yet"
}

function checkLines(
	noun: "ruling" | "check",
	proposed: Ruling | undefined,
	mine: Ruling | undefined,
	byHand: boolean
): string[] {
	return [
		`- Proposed ${noun}: ${proposed === undefined ? "none" : rulingText(proposed)}`,
		`- My ${noun}: ${myText(mine, byHand)}`,
	]
}

function quoteLines(quotes: readonly string[]): string[] {
	if (quotes.length === 0) return ["No quote: the value comes from a register."]
	return ["Quotes:", "", codeBlock(quotes.join("\n"))]
}

function intro(s: PilotScore): string {
	const oldest =
		s.oldestFetchedAt === undefined
			? "No lock holds a field, so no cached page stands behind them."
			: `The oldest cached page behind these locks was fetched on ${dotted(s.oldestFetchedAt)}.`
	return `I score the committed lock and curated files with \`npm run score\`, against the answer key frozen on ${dotted(s.keyFrozenOn)}, \`test/lavterskel-changes.json\` and my checks in \`test/pilot-checks.json\`. ${oldest} Nothing in this report is on the live site.`
}

function passMark(s: PilotScore): string[] {
	return [
		"| Rule | Measured | Target | Result |",
		"|---|---|---|---|",
		...s.rules.map(
			(r) => `| ${r.rule}. ${r.title} | ${r.measured} | ${r.target} | ${RESULT[r.status]} |`
		),
		"",
		`Overall: **${s.pass ? "pass" : "not passed yet"}**.`,
		"",
		`Done when every disagreement has my ruling and every sampled field my check: disagreements ruled by me ${s.done.disagreementsRuled} of ${s.done.disagreements}; sampled fields checked by me ${s.done.sampleFieldsChecked} of ${s.done.sampleFields}. Left to check by hand in the kommuner that block ClaudeBot: ${s.done.checkByHand}.`,
	]
}

function perKommune(s: PilotScore): string[] {
	return [
		"| Kommune | Units | Waiting for inclusion | Units with review | Accepted fields | Review fields | Dropped fields | Note |",
		"|---|---|---|---|---|---|---|---|",
		...s.kommuner.map((k) => {
			const note =
				k.failed === undefined ? "" : cellText(`failed (${k.failed.kind}): ${k.failed.reason}`)
			return `| ${kommuneLabel(k.kommune, k.name)} | ${k.units} | ${k.waiting} | ${k.unitsWithReview} | ${k.accepted} | ${k.review} | ${k.dropped} | ${note} |`
		}),
	]
}

function reviewPart(s: PilotScore): string[] {
	if (s.reviewReasons.length === 0) return ["No field is in review."]
	return [
		`${s.reviewFields} fields are in review. A field with more than one reason counts under each.`,
		"",
		"| Fields | Gate | Reason |",
		"|---|---|---|",
		...s.reviewReasons.map((g) => `| ${g.count} | ${g.gate} | ${cellText(g.reason)} |`),
	]
}

function inclusionPart(s: PilotScore): string[] {
	const head = `${s.inclusion.total} units wait for my "include this unit?" answer. My time for them: about ${s.inclusion.estimateMinutes} minutes. That is an estimate at ${INCLUSION_SECONDS} seconds a question; each answer is saved in the curated file and never asked again.`
	if (s.inclusion.rows.length === 0) return [head]
	return [
		head,
		"",
		"| Kommune | Questions |",
		"|---|---|",
		...s.inclusion.rows.map((r) => `| ${kommuneLabel(r.kommune, r.name)} | ${r.questions} |`),
	]
}

function recallPart(s: PilotScore): string[] {
	const { found, keyRows, lost } = s.recall
	const head = `Found ${found} of ${keyRows} key rows in the key kommuner. A row counts as found while its unit waits for my inclusion answer. Lost: ${lost.length}.`
	if (lost.length === 0) return [head]
	return [
		head,
		"",
		...lost.map((r) => {
			const website = r.website === undefined ? "" : ` Website: ${codeSpan(r.website)}`
			return `- Row ${r.keyId} in ${r.kommune}, ${cellText(r.name)}. Lost at ${STAGE_TEXT[r.stage]}: ${cellText(r.reason)}.${website}`
		}),
	]
}

function disagreementPart(s: PilotScore): string[] {
	const n = s.disagreements.length
	if (n === 0) return ["No accepted value differs from the key."]
	const byHand = s.disagreements.filter((d) => d.byHand).length
	return spaced([
		[
			`${n} accepted values differ from the key. ${s.done.disagreementsRuled} have my ruling, and ${byHand} wait for a check by hand.`,
		],
		...s.disagreements.map((d) => [
			`### Row ${d.keyId}, ${d.field}, in ${d.kommune}`,
			"",
			`- Unit: ${codeSpan(d.unitId)}`,
			`- Key value: ${codeSpan(String(d.keyValue))}`,
			`- Pipeline value: ${codeSpan(String(d.pipelineValue))}`,
			`- Source: ${codeSpan(d.sourceUrl)}`,
			...checkLines("ruling", d.proposed, d.mine, d.byHand),
			"",
			...quoteLines(d.quotes),
		]),
	])
}

function samplePart(s: PilotScore): string[] {
	const { drawn, size, units } = s.sample
	const short =
		drawn < size
			? ` Only ${drawn} units could be drawn, so this is ${drawn} of ${size}, not a full sample.`
			: ""
	const head = `The sample holds ${drawn} of ${size} accepted units from the pilot kommuner the key does not cover.${short} Fields with my check: ${s.done.sampleFieldsChecked} of ${s.done.sampleFields}.`
	return spaced([
		[head],
		...units.map((u) =>
			spaced([
				[
					`### ${u.kommune}, ${codeSpan(u.unitId)}`,
					"",
					`Sources: ${u.sources.map((x) => `${x.kind} ${codeSpan(x.ref)}`).join("; ")}`,
				],
				...u.fields.map((f) => [
					`#### ${f.field}`,
					"",
					`- Value: ${codeSpan(String(f.value))}`,
					`- Source: ${codeSpan(f.sourceUrl)}`,
					...checkLines("check", f.proposed, f.mine, f.byHand),
					"",
					...quoteLines(f.quotes),
				]),
			])
		),
	])
}

// The committed report: the spec's seven parts in order, "\n" line ends, no clock time, no
// duration, no machine path. The same score gives the same bytes.
export function renderReport(s: PilotScore): string {
	return `${spaced([
		["# Pilot report", "", intro(s)],
		["## 1. Pass mark", "", ...passMark(s)],
		["## 2. Per kommune", "", ...perKommune(s)],
		["## 3. Review reasons, ranked", "", ...reviewPart(s)],
		["## 4. Inclusion questions", "", ...inclusionPart(s)],
		["## 5. Recall", "", ...recallPart(s)],
		["## 6. Disagreements", "", ...disagreementPart(s)],
		["## 7. Sample outside the key", "", ...samplePart(s)],
	]).join("\n")}\n`
}

function stageLine(timings: Readonly<Record<string, number>>): string {
	const rank = (stage: string) => {
		const i = STAGE_ORDER.indexOf(stage)
		return i === -1 ? STAGE_ORDER.length : i
	}
	const stages = Object.entries(timings).sort(([a], [b]) => rank(a) - rank(b) || compareText(a, b))
	if (stages.length === 0) return "- Stage times: none recorded."
	return `- Stage times: ${stages.map(([stage, ms]) => `${cellText(stage)} ${formatDuration(ms)}`).join(", ")}.`
}

function scaleLines(n: ScaleNumbers): string[] {
	const lines = [
		"### Scale",
		"",
		"From this run's cache, so none of it is in the committed report.",
	]
	if (n.hosts.length === 0) lines.push("", "No crawl report, so no hosts.")
	else {
		lines.push(
			"",
			`The ${Math.min(SHOWN_HOSTS, n.hosts.length)} slowest hosts at their pace:`,
			"",
			"| Host | Requests | Crawl delay | Time at that pace |",
			"|---|---|---|---|",
			...n.hosts
				.slice(0, SHOWN_HOSTS)
				.map(
					(h) =>
						`| ${codeSpan(h.host)} | ${groupDigits(h.requests)} | ${formatDuration(h.delayMs)} | ${formatDuration(h.estimateMs)} |`
				)
		)
		const rest = n.hosts.slice(SHOWN_HOSTS)
		if (rest.length > 0) {
			const requests = rest.reduce((sum, h) => sum + h.requests, 0)
			lines.push(
				"",
				`And ${rest.length} more hosts with ${groupDigits(requests)} requests between them.`
			)
		}
	}
	const limit = formatDuration(JOB_LIMIT_MS)
	lines.push(
		"",
		n.slowest === undefined
			? "- Slowest host: none, as there is no crawl report."
			: `- Slowest host: ${codeSpan(n.slowest.host)}, ${formatDuration(n.slowest.estimateMs)} for ${groupDigits(n.slowest.requests)} requests at a ${formatDuration(n.slowest.delayMs)} delay.`,
		n.overJobLimit.length === 0
			? `- No host needs more than the ${limit} a GitHub-hosted job may run.`
			: `- Over the ${limit} a GitHub-hosted job may run: ${n.overJobLimit.map((h) => codeSpan(h)).join(", ")}.`,
		`- Lock files: ${groupDigits(n.lockBytes)} bytes in all.`,
		n.kartverket === undefined
			? "- Kartverket: no counts, as verify-stats.json is missing."
			: `- Kartverket: ${groupDigits(n.kartverket.lookups)} lookups, ${groupDigits(n.kartverket.hits)} answered from the cache.`,
		stageLine(n.timings)
	)
	return lines
}

// The PR body: part 1, part 2, the counts of parts 3 to 7, the report's path and the scale
// numbers. Quotes never come here, and it throws rather than give GitHub a body it refuses.
export function renderPrBody(
	s: PilotScore,
	scale: ScaleNumbers | undefined,
	reportPath: string
): string {
	const disagreementsByHand = s.disagreements.filter((d) => d.byHand).length
	const sampleByHand = s.done.checkByHand - disagreementsByHand
	const lines = [
		"## Pilot score",
		"",
		...passMark(s),
		"",
		"### Per kommune",
		"",
		...perKommune(s),
		"",
		"### The rest of the report",
		"",
		`- Review reasons (part 3): ${s.reviewFields} fields in review, in ${s.reviewReasons.length} groups.`,
		`- Inclusion questions (part 4): ${s.inclusion.total}, about ${s.inclusion.estimateMinutes} minutes of my time. That is an estimate.`,
		`- Recall (part 5): ${s.recall.found} of ${s.recall.keyRows} key rows found, ${s.recall.lost.length} lost.`,
		`- Disagreements (part 6): ${s.done.disagreements}, ${s.done.disagreementsRuled} with my ruling, ${disagreementsByHand} to check by hand.`,
		`- Sample outside the key (part 7): ${s.sample.drawn} of ${s.sample.size} units, ${s.done.sampleFieldsChecked} of ${s.done.sampleFields} fields with my check, ${sampleByHand} to check by hand.`,
		"",
		`The whole report is committed as ${codeSpan(reportPath)}.`,
		...(scale === undefined ? [] : ["", ...scaleLines(scale)]),
	]
	const body = `${lines.join("\n")}\n`
	if (body.length > PR_BODY_LIMIT) throw new PrBodyTooLongError(body.length)
	return body
}
