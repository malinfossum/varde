import { comparable } from "../../gates/compare.ts"
import { alwaysOpenQualifiedIn, plainlyAlwaysOpen, readAlwaysOpen } from "../../gates/phrases.ts"
import { MAX_QUOTE } from "../../schema/common.ts"
import type { ContactBlock, ExtractedCandidate } from "../../schema/extraction.ts"
import { formatHours, hasTime } from "../../text/hours.ts"
import { possibleNames } from "../../text/names.ts"
import { MAX_LINE, quoteHasText } from "../../text/normalise.ts"
import { findPhones, isMobileDigits, type PhoneHit } from "../../text/phone.ts"
import { findRoleWord } from "../roleWords.ts"

export type RuleContext = { unitName?: string; places: readonly string[]; onKommuneSite: boolean }

const word = (alternatives: string) =>
	new RegExp(`(?<![\\p{L}])(?:${alternatives})(?![\\p{L}])`, "iu")
const PHONE_LABEL = word("telefon|telefonnummer(?:et)?|tlf|vakttelefon")
const RING = word("ring")
const FAX = word("faks|fax|telefaks")
// A fax word in brackets right after a number: "62 00 00 01 (faks)".
const FAX_AFTER = /^\s*\(\s*(?:telefaks|faks|fax)\s*\)/iu
const SWITCHBOARD = word("sentralbord(?:et)?|servicetorg(?:et)?")
const PHONE_TIME = word("telefontid(?:en|er|ene)?")
const ALWAYS = word("døgnåpen|døgnåpent|døgnåpne|hele døgnet")
const LETTER = /\p{L}/u
const TIME_SHAPE = /\d[.:]\d{2}/
const DIGIT = /\d/g

// One candidate per field, compared by value and role: a number in the box and again in the
// text is one number, not two. The first wins, except that a duplicate with a review reason
// replaces a clean one: "Ikke døgnåpen" in a second block must not vanish behind "Døgnåpent".
export function dedupe(candidates: readonly ExtractedCandidate[]): ExtractedCandidate[] {
	const out: ExtractedCandidate[] = []
	const at = new Map<string, number>()
	for (const c of candidates) {
		const key = `${c.field}|${comparable(c.field, c.value)}|${c.role ?? ""}`
		const seen = at.get(key)
		if (seen === undefined) {
			at.set(key, out.length)
			out.push(c)
		} else if (c.review !== undefined && out[seen]?.review === undefined) {
			out[seen] = c
		}
	}
	return out
}

type Labelled = {
	hit: PhoneHit
	label: string
	labelLine?: number
	first: boolean
	after: string
	last: boolean
}

// Each number's label: the text between it and the number before it on the line. A number with
// no words before it takes the label of the number before it on the line, or else the line
// above when that line holds no number of its own ("Telefon:" over "62 00 00 00"). after is the
// text up to the next number, where a fax word may follow the number it belongs to.
function labelled(lines: readonly string[], i: number, hitsOf: readonly PhoneHit[][]): Labelled[] {
	const line = lines[i] ?? ""
	const hits = hitsOf[i] ?? []
	const out: Labelled[] = []
	let from = 0
	let previous: { label: string; labelLine?: number } | undefined
	for (const [n, hit] of hits.entries()) {
		const segment = line.slice(from, hit.index)
		from = hit.index + hit.text.length
		let current: { label: string; labelLine?: number }
		if (LETTER.test(segment)) {
			current = { label: segment }
		} else if (previous !== undefined) {
			current = previous
		} else {
			const above = lines[i - 1]
			current =
				above !== undefined && above.length <= MAX_LINE && (hitsOf[i - 1]?.length ?? 0) === 0
					? { label: above, labelLine: i - 1 }
					: { label: "" }
		}
		previous = current
		const next = hits[n + 1]
		out.push({
			hit,
			...current,
			first: n === 0,
			after: line.slice(from, next?.index ?? line.length),
			last: next === undefined,
		})
	}
	return out
}

// The line with its numbers taken out, so digits never read as words.
function withoutNumbers(line: string, hits: readonly PhoneHit[]): string {
	let out = ""
	let from = 0
	for (const h of hits) {
		out += `${line.slice(from, h.index)} `
		from = h.index + h.text.length
	}
	return out + line.slice(from)
}

const quote = (texts: readonly string[]) => ({ kind: "quote" as const, quotes: [...texts] })

// "(hverdager 08.00-15.30)" after the number on its line, or a "Telefontid" line right after
// it. Any other time on the next line is the opening hours, never the phone's.
function hoursAfter(
	lines: readonly string[],
	i: number,
	hit: PhoneHit,
	block: number
): ExtractedCandidate | undefined {
	const line = lines[i] ?? ""
	const rest = line.slice(hit.index + hit.text.length)
	const next = lines[i + 1]
	const timeIn = (text: string) => hasTime(text) || TIME_SHAPE.test(text)
	const source = timeIn(rest)
		? { text: rest, line }
		: next !== undefined &&
				next.length <= MAX_LINE &&
				PHONE_TIME.test(next) &&
				findPhones(next).length === 0 &&
				timeIn(next)
			? { text: next, line: next }
			: undefined
	if (source === undefined || source.line.length > MAX_QUOTE) return undefined
	const trimmed = source.text.replace(/^[\s,;:()-]+|[\s,;()]+$/g, "").replace(/\s+/g, " ")
	if (trimmed === "") return undefined
	const formatted = formatHours(trimmed)
	return formatted.ok
		? {
				field: "phoneHours",
				value: formatted.text,
				evidence: quote([source.line]),
				origin: "unitContact",
				block,
			}
		: {
				field: "phoneHours",
				value: trimmed,
				evidence: quote([source.line]),
				origin: "unitContact",
				block,
				review: "a time the formatter cannot read",
			}
}

// "Døgnåpent", read the way the grounding gate reads it. Plain only when every claim line is a
// plain claim on its own, holds no number (ruling 35: a number beside it blocks a yes), and no
// other line of the block limits it ("Stengt 24. desember", "Åpent mandag til fredag"). Those
// lines join the quotes, so the gate reads them too. A line with a phone number is left out of
// that check: the gate's digit rule would call every phone line a limit. Digits are taken out
// before the check for the same reason, and the quote stays verbatim. Anything else goes to
// review: a wrong alwaysOpen on an acute line tells someone at night that a closed place is open.
function alwaysOpen(
	lines: readonly string[],
	hitsOf: readonly PhoneHit[][],
	block: number
): ExtractedCandidate | undefined {
	const usable = lines.map((l, j) => ({ l, j })).filter(({ l }) => l.length <= MAX_QUOTE)
	const claims = usable.filter(({ l }) => ALWAYS.test(l))
	if (claims.length === 0) return undefined
	const limits = usable.filter(
		({ l, j }) =>
			!ALWAYS.test(l) &&
			(hitsOf[j]?.length ?? 0) === 0 &&
			alwaysOpenQualifiedIn([l.replace(DIGIT, " ")])
	)
	const c: ExtractedCandidate = {
		field: "alwaysOpen",
		value: true,
		evidence: quote([...claims, ...limits].sort((a, b) => a.j - b.j).map(({ l }) => l)),
		origin: "unitContact",
		block,
	}
	if (claims.some(({ j }) => (hitsOf[j]?.length ?? 0) > 0)) {
		return { ...c, review: "the always-open claim shares a line with a number" }
	}
	if (claims.some(({ l }) => readAlwaysOpen(l) !== "yes" || !plainlyAlwaysOpen([l]))) {
		return { ...c, review: "the always-open line holds other words" }
	}
	return limits.length > 0 ? { ...c, review: "the block limits the always-open claim" } : c
}

function inBlock(block: ContactBlock, b: number, ctx: RuleContext): ExtractedCandidate[] {
	const lines = block.lines
	const out: ExtractedCandidate[] = []
	// Once per line: findPhones skips a line over MAX_LINE, and the names are only computed when
	// a number needs them, never once per number.
	const hitsOf = lines.map((l) => findPhones(l))
	const names = new Map<number, boolean>()
	const hasName = (j: number) => {
		let known = names.get(j)
		if (known === undefined) {
			const l = lines[j] ?? ""
			known =
				l.length <= MAX_LINE && possibleNames(withoutNumbers(l, hitsOf[j] ?? []), ctx).length > 0
			names.set(j, known)
		}
		return known
	}
	let serviceLine = false
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? ""
		if (line.length > MAX_LINE) continue
		for (const { hit, label, labelLine, first, after, last } of labelled(lines, i, hitsOf)) {
			if (FAX.test(label) || FAX_AFTER.test(after) || (last && FAX.test(after))) continue
			const phoneLabel = PHONE_LABEL.test(label)
			// A short number is a house number, a price or a room as often as a phone (Task 3).
			if (hit.short && !phoneLabel && !RING.test(label)) continue
			const base = {
				field: "phone" as const,
				value: hit.text,
				origin: "unitContact" as const,
				block: b,
			}
			const quotes = labelLine === undefined ? [line] : [lines[labelLine] ?? "", line]
			if (SWITCHBOARD.test(label)) {
				if (ctx.onKommuneSite && line.length <= MAX_QUOTE)
					out.push({ ...base, evidence: quote(quotes), rank: 3, role: "Sentralbord" })
				continue
			}
			// The role word of this number only: in its own label, or on the line above when that
			// line holds no number of its own, for the first number on the line.
			const above = lines[i - 1]
			const role =
				findRoleWord(label) ??
				(first &&
				labelLine === undefined &&
				above !== undefined &&
				above.length <= MAX_LINE &&
				(hitsOf[i - 1]?.length ?? 0) === 0
					? findRoleWord(above)
					: undefined)
			if (role !== undefined) {
				// Two verbatim pieces only, so no name on the line can be stored, whatever its shape.
				out.push({ ...base, evidence: quote([role.quote, hit.text]), rank: 2, role: role.label })
				continue
			}
			if (hasName(i) || (labelLine !== undefined && hasName(labelLine))) {
				out.push({
					...base,
					evidence: quote([hit.text]),
					rank: 2,
					review: "a number next to a possible name, with no role word",
				})
				continue
			}
			if (isMobileDigits(hit.digits)) {
				// The safety gate sends a mobile with no role label to review.
				out.push({ ...base, evidence: quote([hit.text]), rank: 2 })
				continue
			}
			if (line.length > MAX_QUOTE) continue
			const named = ctx.unitName !== undefined && quoteHasText(label, ctx.unitName)
			if (!phoneLabel && !named) {
				// "Ring 113 ved fare" may be advice about another service, so a short number with only
				// "ring" beside it is never a plain rank 1.
				if (hit.short)
					out.push({
						...base,
						evidence: quote(quotes),
						rank: 1,
						review: 'a short number with only "ring" beside it',
					})
				continue
			}
			out.push({ ...base, evidence: quote(quotes), rank: 1 })
			const hours = hoursAfter(lines, i, hit, b)
			if (hours !== undefined) out.push(hours)
			serviceLine = true
		}
	}
	if (serviceLine) {
		const open = alwaysOpen(lines, hitsOf, b)
		if (open !== undefined) out.push(open)
	}
	return out
}

// Ranks 1 and 2 of the phone order from the contact blocks, and rank 3 from a kommune page that
// labels its switchboard. The gates decide; this rule only proposes.
export function phoneCandidates(
	blocks: readonly ContactBlock[],
	ctx: RuleContext
): ExtractedCandidate[] {
	return dedupe(blocks.flatMap((block, b) => inBlock(block, b, ctx)))
}
