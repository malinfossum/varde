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

// The reason a field goes to review when the page's place is not Kartverket's.
export const PLACE_MISMATCH = "place part does not match Kartverket"

// Punctuation that may close the place: "2999 Eksempelby." or "2999 Eksempelby, Kari Nordmann".
// A loop, not a pattern, so a long run of dots costs one pass.
function withoutClosing(word: string): string {
	let end = word.length
	while (end > 0 && ".,;:".includes(word.charAt(end - 1))) end--
	return word.slice(0, end)
}

// The place part verify may store after Kartverket's street text: the text after the first comma,
// only when it is Kartverket's postcode, then whitespace, then Kartverket's poststed, compared
// without case. The page's own spelling stays ("Lillehammer", not "LILLEHAMMER") and every word
// after the poststed is cut, so a name or a label that follows the place never rides into the
// value. The text is split on whitespace, so the poststed always ends at a word: "Eksempelbyen"
// is not "Eksempelby", and "Nordre-Eksempelby" is not "NORDRE EKSEMPELBY". undefined: the value
// has no comma, so there is no place part to keep.
export function placePart(
	value: string,
	postcode: string | undefined,
	poststed: string | undefined
): { place: string } | { review: string } | undefined {
	const comma = value.indexOf(",")
	if (comma < 0) return undefined
	const mismatch = { review: PLACE_MISMATCH }
	if (postcode === undefined || poststed === undefined) return mismatch
	const [code, ...rest] = value
		.slice(comma + 1)
		.trim()
		.split(/\s+/)
	if (code !== postcode) return mismatch
	const length = poststed.trim().split(/\s+/).length
	const words = rest.slice(0, length)
	if (words.length < length) return mismatch
	const place = [...words.slice(0, -1), withoutClosing(words.at(-1) ?? "")].join(" ")
	if (normaliseText(place) !== normaliseText(poststed)) return mismatch
	return { place: `, ${code} ${place}` }
}
