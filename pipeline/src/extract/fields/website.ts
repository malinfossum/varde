import type { TextLine } from "../../adapters/clean.ts"
import { MAX_QUOTE } from "../../schema/common.ts"
import type { ExtractedCandidate } from "../../schema/extraction.ts"

// The unit's own page URL, already grounded by the fetch. The grounding gate passes a website
// that is its source page; the quote (the h1, else the first line) proves the page has text.
export function websiteCandidate(
	finalUrl: string,
	main: readonly TextLine[]
): ExtractedCandidate | undefined {
	const anchor = main.find((l) => l.heading === 1) ?? main[0]
	if (anchor === undefined || anchor.text.length > MAX_QUOTE) return undefined
	return {
		field: "website",
		value: finalUrl,
		evidence: { kind: "quote", quotes: [anchor.text] },
		origin: "unitPage",
	}
}
