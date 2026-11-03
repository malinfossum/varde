import { normaliseText } from "./normalise.ts"

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
