import { readReferral, saysFee, saysFree, splitSentences } from "../../gates/phrases.ts"
import { MAX_QUOTE } from "../../schema/common.ts"
import { MAX_LINE } from "../../text/normalise.ts"

// Sentences of the whole page that hold a phrase from the phrase table: a cost phrase or a
// referral phrase. The rule only collects them; the Lavterskel rule in the safety gate decides.
// Sentences are split with phrases.ts's own splitter, but on the raw text, so each is verbatim.
export function lavterskelQuotes(lines: readonly string[]): string[] {
	const found = new Set<string>()
	for (const line of lines) {
		if (line.length > MAX_LINE) continue
		for (const sentence of splitSentences(line)) {
			const s = sentence.trim()
			if (s === "" || s.length > MAX_QUOTE) continue
			if (readReferral([s]) !== "silent" || saysFree(s) || saysFee(s)) found.add(s)
		}
	}
	return [...found]
}
