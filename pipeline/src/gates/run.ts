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

// Accents never decide a match: "Ánne-Marié" is "Anne-Marie". Text is compared in NFD, where
// each accent is a combining mark after its letter.
const stripMarks = (text: string) => text.normalize("NFD").replace(/\p{M}/gu, "")

// Norwegian letters a page may write plainly: "Øvrebø" as "Ovrebo", "æ" as "ae". "å" folds
// to "a" through stripMarks already. Applied to name and text alike; no definite forms are
// added, so "Berg" never redacts "Bergen".
const fold = (text: string) =>
	stripMarks(text).replace(/ø/g, "o").replace(/Ø/g, "O").replace(/æ/g, "ae").replace(/Æ/g, "AE")

// The letters of a name part, each allowed any accents after it. A folded "o" also matches
// "ø", and a folded "ae" also matches "æ".
function letters(token: string): string {
	const folded = fold(token)
	let out = ""
	for (let i = 0; i < folded.length; i++) {
		const ch = folded[i] ?? ""
		if (folded.slice(i, i + 2).toLowerCase() === "ae") {
			out += "(?:ae|æ)\\p{M}*"
			i++
		} else if (ch.toLowerCase() === "o") {
			out += "(?:o|ø)\\p{M}*"
		} else {
			out += `${escapeRegExp(ch)}\\p{M}*`
		}
	}
	return out
}

// A genitive "s" after a name is still the name: "Karis kontor", "ANNEMARIES".
const GENITIVE = "(?:'?s)?"

// A name token of two or more letters, as a whole word: not glued to a letter, digit or mark.
function tokenPattern(token: string, flags: string): RegExp {
	return new RegExp(
		`(?<![\\p{L}\\p{N}\\p{M}])${letters(token)}${GENITIVE}(?![\\p{L}\\p{N}\\p{M}])`,
		flags
	)
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

// Every run of two or more adjacent parts also goes in glued together, longest first, so a page
// that writes "Anne-Marie-Louise" or "Anne Marie" as "ANNEMARIELOUISE", "MARIELOUISE" or
// "AnneMarie" is caught too. Runs that take in the surname are the safe side.
function joinedParts(personName: string): string[] {
	const parts = nameParts(personName)
	const runs: string[] = []
	for (let length = parts.length; length >= 2; length--) {
		for (let start = 0; start + length <= parts.length; start++) {
			runs.push(parts.slice(start, start + length).join(""))
		}
	}
	return runs
}

function nameTokens(personName: string): string[] {
	return [...joinedParts(personName), ...nameParts(personName)].filter(
		(t) => (stripMarks(t).match(/\p{L}/gu) ?? []).length >= 2
	)
}

// The full name goes first, with any spacing, hyphen, case or accent, so a whole name becomes
// one marker. Then every name token goes on its own, so "Kari" or "Nordmann, Kari" cannot
// survive. The quote is read in NFD so accents match, and goes back to NFC.
export function redact(quotes: readonly string[], personName: string | undefined): string[] {
	if (personName === undefined || personName.trim() === "") return [...quotes]
	const parts = nameParts(personName).map(letters)
	const full = new RegExp(`${parts.join(NAME_SEPARATOR)}${GENITIVE}`, "giu")
	const tokens = nameTokens(personName).map((t) => tokenPattern(t, "giu"))
	return quotes.map((q) =>
		tokens
			.reduce(
				(text, token) => text.replace(token, "[navn]"),
				q.normalize("NFD").replace(full, "[navn]")
			)
			.normalize("NFC")
	)
}

// Fail-safe after redaction: the grounding gate matches normalised text, redact does not, so a
// name split by a soft hyphen can survive. Such a field is dropped, never stored.
function nameSurvives(texts: readonly string[], personName: string | undefined): boolean {
	if (personName === undefined) return false
	const tokens = nameTokens(personName).map((t) => tokenPattern(normaliseText(t), "iu"))
	return texts.some((text) => tokens.some((token) => token.test(fold(normaliseText(text)))))
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
