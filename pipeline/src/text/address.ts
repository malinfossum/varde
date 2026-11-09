import { normaliseText, quoteHasText } from "./normalise.ts"

export type AddressParts = { street: string; postcode?: string }

// The street and number before the first comma, and the four-digit postcode after it:
// "Storgata 1, 2. etasje, 2609 LILLEHAMMER" is street "storgata 1", postcode "2609". A first
// part without both a letter and a digit is not a street address.
export function splitAddress(text: string): AddressParts | undefined {
	const comma = text.indexOf(",")
	const street = normaliseText(comma < 0 ? text : text.slice(0, comma))
	if (!/\p{L}/u.test(street) || !/\d/.test(street)) return undefined
	const postcode = comma < 0 ? undefined : /\b(\d{4})\b/.exec(text.slice(comma))?.[1]
	return postcode === undefined ? { street } : { street, postcode }
}

// The street as Kartverket compares it: normalised, with a single house letter joined to its
// number. "Storgata 1 A" and "Storgata 1A" are one address; "Storgata 1 og 2" keeps its space,
// because "og" is a word, not a letter. So do the one-letter words "i" and "å": "Storgata 1 i
// 2. etasje" is Storgata 1.
export function streetKey(text: string): string {
	return normaliseText(text).replace(/(\d) ((?![iå])\p{L})(?![\p{L}\p{N}])/gu, "$1$2")
}

// The quote holds the value's street (letter joined) and its postcode, each as a whole word. A
// two-line page address ("Storgata 1 A" over "2609 Lillehammer") is one quote, so it counts.
export function quoteHasAddress(quote: string, value: string): boolean {
	const parts = splitAddress(value)
	if (parts === undefined) return quoteHasText(quote, value)
	const text = streetKey(quote)
	if (!quoteHasText(text, streetKey(parts.street))) return false
	return parts.postcode === undefined || quoteHasText(text, parts.postcode)
}
