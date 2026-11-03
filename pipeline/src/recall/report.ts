import type { AnswerKey, KeyRow } from "../answerKey/schema.ts"
import { looksLikeService } from "../discover/pathWords.ts"
import type { DiscoverReport, KommuneDiscovery, NationalDiscovery } from "../discover/types.ts"
import type { HostStop } from "../net/crawler.ts"
import type { HostEntry } from "../sources/hosts.ts"
import { isFrontPage, normaliseUrl, siteHost } from "../text/normalise.ts"
import { type Found, matchRecall, RECALL_RULES, type RecallRule } from "./match.ts"

export type Miss = { id: number; name: string; kommune: string | null; reason: string }
export type RecallResult = {
	date: string
	total: number
	found: number
	byRule: Record<RecallRule, number>
	kommuneRows: { total: number; found: number }
	nationalRows: { total: number; found: number }
	misses: Miss[]
	stoppedHosts: { host: string; reason: string }[]
	notes: string[]
}

const STOP_TEXT: Readonly<Record<HostStop, string>> = {
	visitTime: "outside its Visit-time window",
	crawlDelayTooLong: "its Crawl-delay is over a minute",
	retryAfterTooLong: "it asked to wait more than ten minutes",
	secondTooMany: "a second 429 or 503",
	serverError: "a server error",
	timeout: "a timeout",
	privateAddress: "it resolves to a private address",
	network: "a network error",
	robotsUnreachable: "its robots.txt could not be read",
}

const host = (h: string) => siteHost(`https://${h}/`) ?? h

type Context = {
	kommuneHosts: ReadonlySet<string>
	stopped: ReadonlyMap<string, HostStop>
	allowed: ReadonlySet<string>
	siteByHost: ReadonlyMap<string, KommuneDiscovery>
}

// Hosts are written as code, so GitHub never turns them into links.
function missReason(row: KeyRow, ctx: Context): string {
	const prefix = row.national ? "national row: " : ""
	const website = row.fields.website
	if (website === null)
		return `${prefix}no website in the key, and no unit matched by name and address`
	if (isFrontPage(website, ctx.kommuneHosts))
		return `${prefix}the key's website is the kommune's front page`
	// A value that is not a URL is never echoed: it is no host, and it is not code.
	const h = siteHost(website)
	if (h === undefined) return `${prefix}the key's website is not a valid URL`
	const stop = ctx.stopped.get(h)
	if (stop !== undefined) return `${prefix}\`${h}\` was skipped: ${STOP_TEXT[stop]}`
	if (!ctx.allowed.has(h))
		return `${prefix}\`${h}\` was not found by any register, sitemap or catalogue`
	const site = ctx.siteByHost.get(h)
	if (site === undefined)
		return `${prefix}\`${h}\` is known, but discover lists no page at this address`
	if (site.site?.sitemap === "none") return `${prefix}\`${h}\` has no sitemap`
	const wanted = normaliseUrl(website)
	if (site.allSitemapUrls.some((u) => normaliseUrl(u) === wanted)) {
		return looksLikeService(website)
			? `${prefix}in the sitemap, but past the 300-page cap`
			: `${prefix}in the sitemap, but the path words filtered it out`
	}
	return `${prefix}not in the sitemap of \`${h}\``
}

export function recall(input: {
	key: AnswerKey
	kommuner: readonly KommuneDiscovery[]
	national: NationalDiscovery
	report: DiscoverReport
	hosts: readonly HostEntry[]
}): RecallResult {
	const urlsOf = (k: KommuneDiscovery) => [
		...k.pages.map((p) => p.url),
		...k.units.flatMap((u) => (u.website === undefined ? [] : [u.website])),
	]
	const nationalUrls = input.national.pages.map((p) => p.url)
	const kommuneHosts = new Set(input.kommuner.flatMap((k) => (k.site ? [host(k.site.host)] : [])))
	const everywhere: Found = {
		units: input.kommuner.flatMap((k) => k.units),
		urls: new Set([...input.kommuner.flatMap(urlsOf), ...nationalUrls].map(normaliseUrl)),
		kommuneHosts,
	}
	const byKommune = new Map(input.kommuner.map((k) => [k.kommune, k]))
	const ctx: Context = {
		kommuneHosts,
		stopped: new Map(
			input.report.hosts.flatMap((h) =>
				h.stopped === undefined ? [] : [[host(h.host), h.stopped] as const]
			)
		),
		allowed: new Set(input.hosts.map((h) => host(h.host))),
		siteByHost: new Map(
			input.kommuner.flatMap((k) => (k.site ? [[host(k.site.host), k] as const] : []))
		),
	}
	const byRule = Object.fromEntries(RECALL_RULES.map((r) => [r, 0])) as Record<RecallRule, number>
	const kommuneRows = { total: 0, found: 0 }
	const nationalRows = { total: 0, found: 0 }
	const misses: Miss[] = []
	for (const row of input.key.rows) {
		const k = row.kommune === null ? undefined : byKommune.get(row.kommune)
		const found: Found =
			k === undefined
				? everywhere
				: {
						units: k.units,
						urls: new Set([...urlsOf(k), ...nationalUrls].map(normaliseUrl)),
						kommuneHosts,
					}
		const rule = matchRecall(row, found)
		const tally = row.national ? nationalRows : kommuneRows
		tally.total++
		if (rule !== undefined) {
			tally.found++
			byRule[rule]++
		} else {
			misses.push({
				id: row.id,
				name: row.name,
				kommune: row.kommune,
				reason: missReason(row, ctx),
			})
		}
	}
	return {
		date: input.report.date,
		total: input.key.rows.length,
		found: kommuneRows.found + nationalRows.found,
		byRule,
		kommuneRows,
		nationalRows,
		misses,
		stoppedHosts: input.report.hosts.flatMap((h) =>
			h.stopped === undefined ? [] : [{ host: h.host, reason: STOP_TEXT[h.stopped] }]
		),
		notes: [
			...input.report.renumberings.map(
				(c) => `KLASS renumbering: ${c.oldCode} to ${c.newCode} on ${c.changeOccurred}`
			),
			...input.report.nameMismatches.map((m) => `Kommune name against KLASS: ${m}`),
			...input.report.problems,
		],
	}
}

// Text from the key goes into a public PR body: no markup, no HTML, no mention can ping anyone.
export function inert(text: string): string {
	return text
		.replace(/[\\`*_[\]<>|#]/g, (ch) => `\\${ch}`)
		.replace(/@/g, "&#64;")
		.replace(/\s*\n\s*/g, " ")
}

const dotted = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`

export function renderRecall(r: RecallResult): string {
	const percent = r.total === 0 ? 0 : Math.round((r.found * 1000) / r.total) / 10
	const lines = [
		"## Recall report",
		"",
		`Found **${r.found} of ${r.total}** answer-key services (${percent}%). The pilot bar is 9 in 10: ${Math.ceil((r.total * 9) / 10)} of ${r.total}.`,
		`Discover only, against the live sources on ${dotted(r.date)}. No page text and no model.`,
		"",
		"| Rows | Found | Of |",
		"|---|---|---|",
		`| Kommune rows | ${r.kommuneRows.found} | ${r.kommuneRows.total} |`,
		`| National rows | ${r.nationalRows.found} | ${r.nationalRows.total} |`,
		"",
		`By rule: org number ${r.byRule.orgNumber} (the answer key holds no org numbers), name and address ${r.byRule.nameAndAddress}, website ${r.byRule.website}.`,
		"",
		"### Misses",
		"",
	]
	if (r.misses.length === 0) lines.push("None.")
	else {
		lines.push("| Row | Kommune | Likely reason |", "|---|---|---|")
		for (const m of r.misses)
			lines.push(`| ${m.id} ${inert(m.name)} | ${m.kommune ?? "national"} | ${m.reason} |`)
	}
	lines.push("", "### Hosts skipped", "")
	if (r.stoppedHosts.length === 0) lines.push("None.")
	else for (const h of r.stoppedHosts) lines.push(`- \`${h.host}\`: ${h.reason}`)
	lines.push("", "### Notes", "")
	if (r.notes.length === 0) lines.push("None.")
	else for (const n of r.notes) lines.push(`- ${n}`)
	return `${lines.join("\n")}\n`
}
