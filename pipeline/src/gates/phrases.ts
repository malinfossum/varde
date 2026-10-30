import type { Cost } from "../schema/common.ts"
import { normaliseText } from "../text/normalise.ts"

// Phrase readings shared by the grounding, safety and Lavterskel rules. Text is normalised
// first, so case, soft hyphens and odd spaces never decide a reading.

export const NEGATORS: ReadonlySet<string> = new Set(["ikke", "ingen", "uten"])

export function sentences(text: string): string[] {
	return normaliseText(text)
		.split(/(?<=[.!?])\s+/)
		.filter((s) => s.length > 0)
}

export function words(sentence: string): string[] {
	return sentence.split(/[^\p{L}\p{N}-]+/u).filter((w) => w.length > 0)
}

// True when a negator stands within `span` words before position `index`.
export function negatedWithin(ws: readonly string[], index: number, span = 3): boolean {
	return ws.slice(Math.max(0, index - span), index).some((w) => NEGATORS.has(w))
}

// Things a service may give away while the service itself costs money: "gratis parkering"
// says nothing about the price of a session. Matched by prefix, except the short words.
const EXTRA_PREFIXES = [
	"parkering",
	"kaffe",
	"servering",
	"bevertning",
	"frokost",
	"lunsj",
	"middag",
	"kveldsmat",
	"måltid",
	"frukt",
	"drikke",
	"kake",
	"internett",
	"wifi",
	"wi-fi",
]
const EXTRA_WORDS: ReadonlySet<string> = new Set(["te", "mat", "maten", "brus", "trådløst"])

function isExtra(word: string | undefined): boolean {
	if (word === undefined) return false
	return EXTRA_WORDS.has(word) || EXTRA_PREFIXES.some((p) => word.startsWith(p))
}

// Words after "for alle" that narrow it to a group again: "gratis for alle under 25 år".
const NARROWING: ReadonlySet<string> = new Set([
	"under",
	"over",
	"som",
	"mellom",
	"med",
	"fra",
	"i",
])

// A free phrase that spans ws[start..end] is about the service itself only when no extra stands
// within two words on either side, and it is not followed by "for" and a group ("for barn",
// "for medlemmer"). "For alle" on its own is no group.
function freeForEveryone(ws: readonly string[], start: number, end: number): boolean {
	const near = [...ws.slice(Math.max(0, start - 2), start), ...ws.slice(end + 1, end + 3)]
	if (near.some(isExtra)) return false
	if (ws[end + 1] !== "for") return true
	return ws[end + 2] === "alle" && !NARROWING.has(ws[end + 3] ?? "")
}

export function saysFree(quote: string): boolean {
	for (const sentence of sentences(quote)) {
		const ws = words(sentence)
		for (const [i, w] of ws.entries()) {
			const next = ws[i + 1]
			if (w === "gratis" && !negatedWithin(ws, i) && freeForEveryone(ws, i, i)) return true
			if (w === "koster" && next === "ingenting" && freeForEveryone(ws, i, i + 1)) return true
			if (w === "uten" && next === "egenandel" && freeForEveryone(ws, i, i + 1)) return true
		}
	}
	return false
}

// A price in kroner anywhere in the quote. Tested on the whole quote, because "kr." would
// otherwise end a sentence before its number.
const PRICE = /(?:\bkr\.?\s?\d|\bnok\s?\d|\d+(?:[.,]\d+)?\s?(?:kr\b|kroner\b|,-))/

export function saysFee(quote: string): boolean {
	if (PRICE.test(normaliseText(quote))) return true
	for (const sentence of sentences(quote)) {
		const ws = words(sentence)
		for (const [i, w] of ws.entries()) {
			if (w.startsWith("egenandel") && !negatedWithin(ws, i, 2)) return true
		}
	}
	return false
}

export function classifyCost(quotes: readonly string[]): Cost | undefined {
	const free = quotes.some(saysFree)
	const fee = quotes.some(saysFee)
	if (free && fee) return "partly"
	if (free) return "free"
	if (fee) return "paid"
	return undefined
}

export type AlwaysOpenReading = "yes" | "no" | "qualified"

const WEEKDAYS = ["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag"]
const MONTHS: ReadonlySet<string> = new Set([
	"januar",
	"februar",
	"mars",
	"april",
	"mai",
	"juni",
	"juli",
	"august",
	"september",
	"oktober",
	"november",
	"desember",
])
// Closures, holidays and seasons. Matched by prefix, so stenger, helgen, høytider, juleaften
// and sommerferien all count. These qualify a claim from any sentence of the same quote.
const CLOSED_OR_SEASONAL = ["steng", "unntak", "helg", "høytid", "ferie", "sommer", "jul", "påske"]

function closedOrSeasonal(ws: readonly string[]): boolean {
	return ws.some((w) => w === "unntatt" || CLOSED_OR_SEASONAL.some((p) => w.startsWith(p)))
}

// Only within the claim's own sentence: days, months, "fra", "til" and any number other than
// the 24 in "24/7" or "24 timer", since a quote often carries the phone number or the hours.
function limitedInTime(sentence: string, ws: readonly string[]): boolean {
	if (/\d/.test(sentence.replace(/24\/7|24 timer/g, " "))) return true
	return ws.some(
		(w) =>
			w === "fra" ||
			w === "til" ||
			MONTHS.has(w) ||
			w.startsWith("hverdag") ||
			WEEKDAYS.some((d) => w.startsWith(d))
	)
}

function claimsAlwaysOpen(sentence: string, ws: readonly string[]): boolean {
	for (const [i, w] of ws.entries()) {
		if (w.startsWith("døgnåpen") && !negatedWithin(ws, i, 2)) return true
	}
	return /hele døgnet|24\/7|24 timer i døgnet/.test(sentence) && !ws.includes("ikke")
}

// Yes only for a plain claim ("Døgnåpent.", "Vi svarer 24/7."). A claim with a closure, a
// season, a day, a month, "fra", "til" or a number next to it is qualified and goes to me.
export function readAlwaysOpen(quote: string): AlwaysOpenReading {
	const all = sentences(quote).map((sentence) => ({ sentence, ws: words(sentence) }))
	const claims = all.filter(({ sentence, ws }) => claimsAlwaysOpen(sentence, ws))
	if (claims.length === 0) return "no"
	if (all.some(({ ws }) => closedOrSeasonal(ws))) return "qualified"
	if (claims.some(({ sentence, ws }) => limitedInTime(sentence, ws))) return "qualified"
	return "yes"
}

export function saysAlwaysOpen(quote: string): boolean {
	return readAlwaysOpen(quote) === "yes"
}

export type ReferralReading = "noneNeeded" | "needed" | "unclear" | "silent"

// Matches by prefix, so henvist, henvises, henvisninger and vedtaket all count.
const REFERRAL_WORD = /^(?:henvis|vedtak)/

// Words that say no referral is needed although they start like one: henvisningsfritt,
// vedtaksfrie, selvhenvisning. Checked before REFERRAL_WORD.
const NO_REFERRAL_WORD = /^(?:henvisningsfri|vedtaksfri|selvhenvis)/

// "Lavterskel..." (any word starting so), drop-in, the no-referral words and "henvise deg
// selv". The index of each one in the sentence.
function markerIndexes(ws: readonly string[]): number[] {
	const found: number[] = []
	for (const [i, w] of ws.entries()) {
		if (
			w.startsWith("lavterskel") ||
			w.startsWith("drop-in") ||
			(w === "drop" && ws[i + 1] === "in") ||
			NO_REFERRAL_WORD.test(w) ||
			(w === "henvise" && ws[i + 1] === "deg" && ws[i + 2] === "selv")
		) {
			found.push(i)
		}
	}
	return found
}

// A sentence that says the service has closed or ended: "Drop-in-tilbudet er avviklet".
function saysClosed(ws: readonly string[]): boolean {
	return ws.some(
		(w, i) =>
			w === "avviklet" ||
			w === "nedlagt" ||
			w === "stengt" ||
			w.startsWith("opphør") ||
			(w === "lagt" && ws[i + 1] === "ned") ||
			(w === "ikke" && ws[i + 1] === "lenger")
	)
}

// Per sentence:
// - A lavterskel, drop-in or no-referral word means none is needed, unless a negator stands
//   up to three words before it ("ikke et lavterskeltilbud"), which makes the sentence unclear.
// - A lone referral word reads noneNeeded only when the sentence holds exactly one negator
//   and it stands up to three words before that word. With no negator it reads needed.
// - Two negators, a negator out of reach, or several referral words next to any negator
//   ("Krever ikke henvisning, men vedtak") are unclear.
// - A noneNeeded reading in a sentence that says the service closed or ended is unclear.
// Quotes that read more than one way are unclear too.
export function readReferral(quotes: readonly string[]): ReferralReading {
	const readings = new Set<Exclude<ReferralReading, "silent">>()
	for (const quote of quotes) {
		for (const sentence of sentences(quote)) {
			const ws = words(sentence)
			const none = saysClosed(ws) ? "unclear" : "noneNeeded"
			const markers = markerIndexes(ws)
			for (const i of markers) {
				readings.add(negatedWithin(ws, i) ? "unclear" : none)
			}
			const referralAt = ws.flatMap((w, i) =>
				REFERRAL_WORD.test(w) && !NO_REFERRAL_WORD.test(w) && !markers.includes(i) ? [i] : []
			)
			if (referralAt.length === 0) continue
			const negators = ws.filter((w) => NEGATORS.has(w)).length
			if (negators === 0) readings.add("needed")
			else if (negators === 1 && referralAt.length === 1 && negatedWithin(ws, referralAt[0] ?? 0)) {
				readings.add(none)
			} else readings.add("unclear")
		}
	}
	if (readings.size === 0) return "silent"
	if (readings.size > 1) return "unclear"
	return [...readings][0] ?? "silent"
}
