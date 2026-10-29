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

export function saysFree(quote: string): boolean {
	for (const sentence of sentences(quote)) {
		if (sentence.includes("koster ingenting") || sentence.includes("uten egenandel")) return true
		const ws = words(sentence)
		for (const [i, w] of ws.entries()) {
			if (w === "gratis" && !negatedWithin(ws, i)) return true
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

export function saysAlwaysOpen(quote: string): boolean {
	for (const sentence of sentences(quote)) {
		const ws = words(sentence)
		for (const [i, w] of ws.entries()) {
			if (w.startsWith("døgnåpen") && !negatedWithin(ws, i, 2)) return true
		}
		if (/hele døgnet|24\/7|24 timer i døgnet/.test(sentence) && !ws.includes("ikke")) return true
	}
	return false
}

export type ReferralReading = "noneNeeded" | "needed" | "unclear" | "silent"

// Matches by prefix, so henvist, henvises, henvisninger and vedtaket all count.
const REFERRAL_WORD = /^(?:henvis|vedtak)/

// "Lavterskel..." (any word starting so) and drop-in. The index of each one in the sentence.
function markerIndexes(ws: readonly string[]): number[] {
	const found: number[] = []
	for (const [i, w] of ws.entries()) {
		if (
			w.startsWith("lavterskel") ||
			w.startsWith("drop-in") ||
			(w === "drop" && ws[i + 1] === "in")
		) {
			found.push(i)
		}
	}
	return found
}

// Per sentence:
// - A lavterskel or drop-in word means none is needed, unless a negator stands up to three
//   words before it ("ikke et lavterskeltilbud"), which makes the sentence unclear.
// - A lone referral word reads noneNeeded only when the sentence holds exactly one negator
//   and it stands up to three words before that word. With no negator it reads needed.
// - Two negators, a negator out of reach, or several referral words next to any negator
//   ("Krever ikke henvisning, men vedtak") are unclear.
// Quotes that read more than one way are unclear too.
export function readReferral(quotes: readonly string[]): ReferralReading {
	const readings = new Set<Exclude<ReferralReading, "silent">>()
	for (const quote of quotes) {
		for (const sentence of sentences(quote)) {
			const ws = words(sentence)
			for (const i of markerIndexes(ws)) {
				readings.add(negatedWithin(ws, i) ? "unclear" : "noneNeeded")
			}
			const referralAt = ws.flatMap((w, i) => (REFERRAL_WORD.test(w) ? [i] : []))
			if (referralAt.length === 0) continue
			const negators = ws.filter((w) => NEGATORS.has(w)).length
			if (negators === 0) readings.add("needed")
			else if (negators === 1 && referralAt.length === 1 && negatedWithin(ws, referralAt[0] ?? 0)) {
				readings.add("noneNeeded")
			} else readings.add("unclear")
		}
	}
	if (readings.size === 0) return "silent"
	if (readings.size > 1) return "unclear"
	return [...readings][0] ?? "silent"
}
