import type { TextLine } from "../../adapters/clean.ts"
import { MAX_QUOTE } from "../../schema/common.ts"
import type { ExtractedCandidate } from "../../schema/extraction.ts"

// The page's own h1. The Brreg name (capitals, often longer) is only for matching: as a peer it
// would send every name to review.
export function nameCandidate(main: readonly TextLine[]): ExtractedCandidate | undefined {
	const h1 = main.find((l) => l.heading === 1)
	if (h1 === undefined || h1.text.length > MAX_QUOTE) return undefined
	return {
		field: "name",
		value: h1.text,
		evidence: { kind: "quote", quotes: [h1.text] },
		origin: "unitPage",
	}
}
