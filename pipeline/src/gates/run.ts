import type { Evidence, LockField } from "../schema/lock.ts"
import { agreementGate } from "./agreement.ts"
import { groundingGate } from "./grounding.ts"
import { safetyGate } from "./safety.ts"
import { sourceGate } from "./source.ts"
import type { Candidate, Gate, GateContext } from "./types.ts"
import { validityGate } from "./validity.ts"

export const GATES: readonly Gate[] = [
	sourceGate,
	groundingGate,
	validityGate,
	agreementGate,
	safetyGate,
]

// The name may sit with any spacing or case on the page.
export function redact(quotes: readonly string[], personName: string | undefined): string[] {
	if (personName === undefined || personName.trim() === "") return [...quotes]
	const parts = personName
		.trim()
		.split(/\s+/)
		.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
	const pattern = new RegExp(parts.join("[\\s\\u00A0]+"), "giu")
	return quotes.map((q) => q.replace(pattern, "[navn]"))
}

function stored(evidence: Evidence, personName: string | undefined): Evidence {
	return evidence.kind === "quote"
		? { kind: "quote", quotes: redact(evidence.quotes, personName) }
		: evidence
}

// All five gates run on every candidate, so the lock file shows each result. A drop wins
// over a review; a dropped field keeps only its reason, source URL and gate results.
export function runGates(c: Candidate, ctx: GateContext, verifiedAt: string): LockField {
	const gates = GATES.map((gate) => gate(c, ctx))
	const failed = gates.filter((g) => !g.pass)
	const base = { sourceUrl: c.sourceUrl, fetchedAt: c.fetchedAt, verifiedAt, gates }
	const dropped = failed.find((g) => g.onFail === "drop")
	if (dropped !== undefined) {
		return { ...base, status: "dropped", reason: `${dropped.gate}: ${dropped.reason ?? "dropped"}` }
	}
	const addressId =
		c.field === "address" && typeof c.value === "string"
			? ctx.findAddress(c.value)?.addressId
			: undefined
	const kept = {
		value: c.value,
		evidence: stored(c.evidence, c.personName),
		...(c.role === undefined ? {} : { role: c.role }),
		...(addressId === undefined ? {} : { addressId }),
	}
	if (failed.length > 0) {
		const reason = failed.map((g) => `${g.gate}: ${g.reason ?? "failed"}`).join("; ")
		return { ...base, ...kept, status: "review", reason }
	}
	return { ...base, ...kept, status: "accepted" }
}
