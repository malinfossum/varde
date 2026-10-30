import type { Cost } from "../schema/common.ts"
import { classifyCost, readReferral } from "./phrases.ts"

export type LavterskelOutcome = { outcome: "yes" | "no" | "review"; reason: string }

// The 2026-10-28 rule: lavterskel means free to attend and no vedtak or referral. Free
// entry with paid extras (partly) counts, but only as the unit's own accepted cost value:
// read from quotes alone, "gratis parkering" next to a fee would look partly too.
export function lavterskel(quotes: readonly string[], cost: Cost | undefined): LavterskelOutcome {
	const referral = readReferral(quotes)
	const effectiveCost = cost ?? classifyCost(quotes)
	if (referral === "needed") return { outcome: "no", reason: "needs a vedtak or a referral" }
	// The unit's own "free" never silences a fee the quotes mention.
	if (cost === "free") {
		const fromQuotes = classifyCost(quotes)
		if (fromQuotes === "paid" || fromQuotes === "partly") {
			return { outcome: "review", reason: "the cost value and a fee in the quotes disagree" }
		}
	}
	if (effectiveCost === "paid") return { outcome: "no", reason: "the service itself costs money" }
	if (effectiveCost === "partly" && cost === undefined) {
		return { outcome: "review", reason: "free and paid quotes together need my eye" }
	}
	if (referral === "noneNeeded" && (effectiveCost === "free" || effectiveCost === "partly")) {
		return { outcome: "yes", reason: "free, and no vedtak or referral" }
	}
	if (referral === "unclear") {
		return { outcome: "review", reason: "the referral quotes disagree or the negation is unclear" }
	}
	return {
		outcome: "review",
		reason: referral === "silent" ? "no quote on referral" : "no quote on cost",
	}
}
