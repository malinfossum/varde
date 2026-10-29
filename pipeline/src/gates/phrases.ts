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

const REFERRAL_WORD = /^(?:henvisning|henvisningen|vedtak|vedtaket)$/

// A referral word with a negator up to three words before it means none is needed. With
// no negator in the sentence it is needed. A negator elsewhere in the sentence, or quotes
// that read both ways, is unclear. Any word starting "lavterskel", and drop-in, means none.
export function readReferral(quotes: readonly string[]): ReferralReading {
	const readings = new Set<Exclude<ReferralReading, "silent">>()
	for (const quote of quotes) {
		for (const sentence of sentences(quote)) {
			const ws = words(sentence)
			if (ws.some((w) => w.startsWith("lavterskel")) || /\bdrop[- ]in\b/.test(sentence)) {
				readings.add("noneNeeded")
			}
			for (const [i, w] of ws.entries()) {
				if (!REFERRAL_WORD.test(w)) continue
				if (negatedWithin(ws, i)) readings.add("noneNeeded")
				else if (ws.some((x) => NEGATORS.has(x))) readings.add("unclear")
				else readings.add("needed")
			}
		}
	}
	if (readings.size === 0) return "silent"
	if (readings.size > 1) return "unclear"
	return [...readings][0] ?? "silent"
}
