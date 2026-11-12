import { MAX_QUOTE } from "../../schema/common.ts"
import type { ContactBlock, ExtractedCandidate } from "../../schema/extraction.ts"
import { splitAddress } from "../../text/address.ts"
import { MAX_LINE } from "../../text/normalise.ts"
import { findPhones } from "../../text/phone.ts"
import { findRoleWord } from "../../text/roleWords.ts"
import { dedupe } from "./phone.ts"

type Kind = "visit" | "plain" | "post"
const LABEL = /^(besøksadresse|postadresse|adresse)\s*:?\s*/iu
const POSTBOKS = /(?<![\p{L}])postboks(?![\p{L}])/iu
// The postcode and the place name after it, and nothing more: words of letters and hyphens, up
// to the first full stop, comma, semicolon, bracket, slash or digit. A word right before a slash
// ("v/", "c/o") is no place. So "2609 Lillehammer v/ Kari Nordmann 900 00 000" gives
// "2609 Lillehammer": a name or a mobile after the place never rides into the value.
const PLACE = /^\d{4}(?: \p{L}[\p{L}-]*(?![\p{L}/-]))+/u
const RANK: Readonly<Record<Kind, number>> = { visit: 0, plain: 1, post: 2 }

const kindOf = (label: string | undefined): Kind =>
	label === undefined
		? "plain"
		: /^besøk/i.test(label)
			? "visit"
			: /^post/i.test(label)
				? "post"
				: "plain"

// The street part, before the first comma. It may hold no phone number and no role word: a
// "street" of "Kari Nordmann 900 00 000" over a postcode line would put a name and a mobile into
// the value, and a review value is stored in the public lock as it is. possibleNames cannot do
// this check: every street name is a capitalised word, so it would refuse every address.
function streetIsClean(rest: string): boolean {
	const comma = rest.indexOf(",")
	const street = comma < 0 ? rest : rest.slice(0, comma)
	return findPhones(street).length === 0 && findRoleWord(street) === undefined
}

// The value as verify stores it holds no phone number and no role word anywhere, the place
// part included.
const valueIsClean = (value: string) =>
	findPhones(value).length === 0 && findRoleWord(value) === undefined

// A street with its number, then a four-digit postcode: on one line after a comma, or on the
// next line. "Besøksadresse" wins over "Postadresse", and a Postboks is never a street address.
function inBlock(block: ContactBlock, b: number): ExtractedCandidate | undefined {
	const found: { kind: Kind; value: string; quotes: string[] }[] = []
	const lines = block.lines
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i] ?? ""
		if (line.length > MAX_LINE || line.length > MAX_QUOTE || POSTBOKS.test(line)) continue
		const above = lines[i - 1] ?? ""
		const own = LABEL.exec(line)
		const labelAbove =
			own === null && LABEL.test(above) && above.replace(LABEL, "") === ""
				? LABEL.exec(above)
				: null
		const label = own?.[1] ?? labelAbove?.[1]
		const rest = line
			.replace(LABEL, "")
			.trim()
			.replace(/[.,;]+$/, "")
		const quotes = labelAbove === null ? [line] : [above, line]
		if (!streetIsClean(rest)) continue
		const parts = splitAddress(rest)
		const comma = rest.indexOf(",")
		const sameLine = comma < 0 ? null : PLACE.exec(rest.slice(comma + 1).trim())
		if (parts?.postcode !== undefined && sameLine !== null) {
			const value = `${rest.slice(0, comma)}, ${sameLine[0]}`
			if (valueIsClean(value)) found.push({ kind: kindOf(label), value, quotes })
			continue
		}
		const next = (lines[i + 1] ?? "").trim()
		const nextLine = PLACE.exec(next)
		if (parts !== undefined && comma < 0 && nextLine !== null && next.length <= MAX_QUOTE) {
			const value = `${rest}, ${nextLine[0]}`
			if (valueIsClean(value))
				found.push({ kind: kindOf(label), value, quotes: [...quotes, lines[i + 1] ?? ""] })
		}
	}
	const best = found.sort((x, y) => RANK[x.kind] - RANK[y.kind])[0]
	return best === undefined
		? undefined
		: {
				field: "address",
				value: best.value,
				evidence: { kind: "quote", quotes: best.quotes },
				origin: "unitContact",
				block: b,
			}
}

export function addressCandidates(blocks: readonly ContactBlock[]): ExtractedCandidate[] {
	return dedupe(blocks.flatMap((block, b) => inBlock(block, b) ?? []))
}
