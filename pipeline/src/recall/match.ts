import type { KeyRow } from "../answerKey/schema.ts"
import type { DiscoveredUnit } from "../discover/types.ts"
import { splitAddress } from "../text/address.ts"
import { foldNorwegian, isFrontPage, normaliseText, normaliseUrl } from "../text/normalise.ts"

export const RECALL_RULES = ["orgNumber", "nameAndAddress", "website"] as const
export type RecallRule = (typeof RECALL_RULES)[number]

// What discover listed: its units, the normalised URLs of its pages and unit websites, and the
// kommune sites in siteHost form (lower case, no leading "www.").
export type Found = {
	units: readonly DiscoveredUnit[]
	urls: ReadonlySet<string>
	kommuneHosts: ReadonlySet<string>
}

const STOP_WORDS = new Set([
	"og",
	"for",
	"til",
	"av",
	"pa",
	"med",
	"kommune",
	"kommunes",
	"the",
	"and",
])

function nameWords(name: string): string[] {
	return foldNorwegian(normaliseText(name))
		.split(/[^a-z0-9]+/)
		.filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
}

// "helsestasjonen" is "helsestasjon" with a definite ending.
function sameWord(a: string, b: string): boolean {
	if (a === b) return true
	const [short, long] = a.length <= b.length ? [a, b] : [b, a]
	return short.length >= 5 && long.startsWith(short) && long.length - short.length <= 3
}

// Brreg writes names in capitals and often longer ("LILLEHAMMER KOMMUNE HELSESTASJON"). Two
// names match when every word of the one with fewer words is in the other.
export function namesMatch(a: string, b: string): boolean {
	const wa = nameWords(a)
	const wb = nameWords(b)
	if (wa.length === 0 || wb.length === 0) return false
	const [few, many] = wa.length <= wb.length ? [wa, wb] : [wb, wa]
	return few.every((w) => many.some((m) => sameWord(w, m)))
}

// Same street and number, and the same postcode. Without a postcode two addresses never match.
export function sameAddress(a: string, b: string): boolean {
	const x = splitAddress(a)
	const y = splitAddress(b)
	return (
		x !== undefined &&
		y !== undefined &&
		x.street === y.street &&
		x.postcode !== undefined &&
		x.postcode === y.postcode
	)
}

// Org number first; the 138-row key holds none, so this rule is for curated files. A kommune's
// front page never counts: every kommune site is discovered, so it proves nothing about one service.
export function matchRecall(row: KeyRow, found: Found, orgNumber?: string): RecallRule | undefined {
	if (orgNumber !== undefined && found.units.some((u) => u.orgNumber === orgNumber))
		return "orgNumber"
	const address = row.fields.address
	if (
		address !== null &&
		found.units.some(
			(u) =>
				u.address !== undefined && sameAddress(u.address, address) && namesMatch(u.name, row.name)
		)
	) {
		return "nameAndAddress"
	}
	const website = row.fields.website
	if (
		website !== null &&
		!isFrontPage(website, found.kommuneHosts) &&
		found.urls.has(normaliseUrl(website))
	) {
		return "website"
	}
	return undefined
}
