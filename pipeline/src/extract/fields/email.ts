import { MAX_QUOTE } from "../../schema/common.ts"
import type { ContactBlock, ExtractedCandidate } from "../../schema/extraction.ts"
import { MAX_LINE } from "../../text/normalise.ts"
import { dedupe } from "./phone.ts"

// The local part may not start inside another run of its characters (the lookbehind), so the
// engine never rescans a run; the domain is dot-separated labels, so nothing overlaps. A full
// stop after the address is not part of it: a label must follow every dot.
const EMAIL = /(?<![\p{L}\p{N}._%+-])[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+/gu

export function emailsIn(line: string): string[] {
	if (line.length > MAX_LINE) return []
	return [...line.matchAll(EMAIL)].map((m) => m[0])
}

const quoted = (
	line: string,
	value: string,
	origin: "unitContact" | "unitPage",
	block?: number
): ExtractedCandidate => ({
	field: "email",
	value,
	evidence: { kind: "quote", quotes: [line] },
	origin,
	...(block === undefined ? {} : { block }),
})

// mailto: links and plain addresses in the contact block first; the rest of the page only when
// the block gives none. The safety gate drops an address that may be a person's own.
export function emailCandidates(
	blocks: readonly ContactBlock[],
	pageLines: readonly string[]
): ExtractedCandidate[] {
	const inBlocks = blocks.flatMap((b, i) =>
		b.lines
			.filter((l) => l.length <= MAX_QUOTE)
			.flatMap((line) => emailsIn(line).map((e) => quoted(line, e, "unitContact", i)))
	)
	if (inBlocks.length > 0) return dedupe(inBlocks)
	return dedupe(
		pageLines
			.filter((l) => l.length <= MAX_QUOTE)
			.flatMap((line) => emailsIn(line).map((e) => quoted(line, e, "unitPage")))
	)
}
