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
