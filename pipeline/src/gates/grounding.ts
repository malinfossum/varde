import { type FieldName, type FieldValue, MAX_QUOTE } from "../schema/common.ts"
import { normaliseText, quoteHasPhone, quoteHasText, quoteHasUrl } from "../text/normalise.ts"
import { alwaysOpenQualifiedIn, classifyCost, freeQualifiedIn, readAlwaysOpen } from "./phrases.ts"
import { drop, type Gate, pass, review } from "./types.ts"

// Does this quote hold this value? Cost and the two booleans are judged by phrase rules
// instead (below, and in the safety gate for lowThreshold).
export function quoteHasValue(field: FieldName, value: FieldValue, quote: string): boolean {
	if (typeof value === "boolean" || field === "cost") return true
	if (field === "phone") return quoteHasPhone(quote, value)
	if (field === "website" || field === "chatUrl") return quoteHasUrl(quote, value)
	return quoteHasText(quote, value)
}

// Gate 2: a register record id, or verbatim quotes that are on the cached page and hold
// the value. This is what stops an invented value.
export const groundingGate: Gate = (c, ctx) => {
	if (c.evidence.kind === "register") return pass("grounding", `register ${c.evidence.register}`)
	const page = ctx.pageText(c.sourceUrl)
	if (page === undefined) return drop("grounding", "no cached page text for the source URL")
	const onPage = normaliseText(page)
	for (const quote of c.evidence.quotes) {
		if (quote.length > MAX_QUOTE)
			return drop("grounding", `a quote is over ${MAX_QUOTE} characters`)
		const q = normaliseText(quote)
		if (q.length === 0 || !onPage.includes(q)) {
			return drop("grounding", "a quote is not on the cached page")
		}
	}
	const quotes = c.evidence.quotes
	switch (c.field) {
		case "lowThreshold":
			return pass("grounding")
		case "cost":
			// "Egenandel kr 350. Gratis parkering." reads as free plus fee, so partly is mine to call.
			if (c.value === "partly") return review("grounding", "partly free always needs my eye")
			// "Gratis." beside "Egenandel gjelder." or "Tilbudet er lagt ned." is not plainly free.
			if (c.value === "free" && freeQualifiedIn(quotes)) {
				return review("grounding", "a free quote holds a price, a limit or a closure")
			}
			return classifyCost(quotes) === c.value
				? pass("grounding")
				: review("grounding", "the quotes do not support this cost value")
		case "alwaysOpen": {
			if (c.value !== true) return drop("grounding", "only an always-open claim is stored")
			const readings = quotes.map(readAlwaysOpen)
			if (readings.every((r) => r === "no")) {
				return drop("grounding", "no quote says the service is always open")
			}
			// "Døgnåpent fra fredag til mandag" is a claim, but not one I store without a look.
			// Nor is "Døgnåpent." beside "Stengt 24. desember.": every quote is read together.
			if (readings.includes("qualified") || alwaysOpenQualifiedIn(quotes)) {
				return review("grounding", "the always-open quote is qualified")
			}
			return pass("grounding")
		}
		default:
			return quotes.some((q) => quoteHasValue(c.field, c.value, q))
				? pass("grounding")
				: drop("grounding", "no quote holds the value")
	}
}
