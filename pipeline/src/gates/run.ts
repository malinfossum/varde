import type { Evidence, LockField } from "../schema/lock.ts"
import { normaliseText } from "../text/normalise.ts"
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

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// A name token of two or more letters, as a whole word: not glued to a letter or digit.
function tokenPattern(token: string, flags: string): RegExp {
	return new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(token)}(?![\\p{L}\\p{N}])`, flags)
}

// Name parts split on spaces and on every hyphen or dash, so "Anne-Marie" is two parts and a
// page that writes "Anne Marie" or "Anne\u2011Marie" is still caught. The same separators may
// stand between the parts of the full name.
const NAME_SEPARATOR = "[\\s\\u00A0\\u2010-\\u2015-]+"

function nameParts(personName: string): string[] {
	return personName
		.trim()
		.split(new RegExp(NAME_SEPARATOR, "u"))
		.filter((t) => t.length > 0)
}

// A hyphen- or dash-joined word of the name also goes in with its parts glued together, so a
// page that writes "Anne-Marie" as "ANNEMARIE" is caught too. These go first, before the parts.
function joinedParts(personName: string): string[] {
	return personName
		.trim()
		.split(/[\s\u00A0]+/u)
		.map((word) => word.split(/[\u2010-\u2015-]+/u).filter((t) => t.length > 0))
		.filter((parts) => parts.length > 1)
		.map((parts) => parts.join(""))
}

function nameTokens(personName: string): string[] {
	return [...joinedParts(personName), ...nameParts(personName)].filter(
		(t) => (t.match(/\p{L}/gu) ?? []).length >= 2
	)
}

// The full name goes first, with any spacing, hyphen or case, so a whole name becomes one
// marker. Then every name token goes on its own, so "Kari" or "Nordmann, Kari" cannot survive.
export function redact(quotes: readonly string[], personName: string | undefined): string[] {
	if (personName === undefined || personName.trim() === "") return [...quotes]
	const parts = nameParts(personName).map(escapeRegExp)
	const full = new RegExp(parts.join(NAME_SEPARATOR), "giu")
	const tokens = nameTokens(personName).map((t) => tokenPattern(t, "giu"))
	return quotes.map((q) =>
		tokens.reduce((text, token) => text.replace(token, "[navn]"), q.replace(full, "[navn]"))
	)
}

// Fail-safe after redaction: the grounding gate matches normalised text, redact does not, so a
// name split by a soft hyphen can survive. Such a field is dropped, never stored.
function nameSurvives(texts: readonly string[], personName: string | undefined): boolean {
	if (personName === undefined) return false
	const tokens = nameTokens(personName).map((t) => tokenPattern(normaliseText(t), "u"))
	return texts.some((text) => tokens.some((token) => token.test(normaliseText(text))))
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
	const evidence = stored(c.evidence, c.personName)
	const role = c.role === undefined ? undefined : (redact([c.role], c.personName)[0] ?? "")
	const left = [...(evidence.kind === "quote" ? evidence.quotes : []), ...(role ? [role] : [])]
	if (nameSurvives(left, c.personName)) {
		return { ...base, status: "dropped", reason: "person name left after redaction" }
	}
	const kept = {
		value: c.value,
		evidence,
		...(role === undefined ? {} : { role }),
		...(addressId === undefined ? {} : { addressId }),
	}
	if (failed.length > 0) {
		const reason = failed.map((g) => `${g.gate}: ${g.reason ?? "failed"}`).join("; ")
		return { ...base, ...kept, status: "review", reason }
	}
	return { ...base, ...kept, status: "accepted" }
}
