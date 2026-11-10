import { type Evidence, evidenceQuotes, type LockField } from "../schema/lock.ts"
import { capitalisedRuns, midSentenceWords } from "../text/names.ts"
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
// to "a" through stripMarks already. The name is folded, and its pattern (letters) matches
// both spellings, so the text needs no fold of its own. No definite forms are added, so
// "Berg" never redacts "Bergen".
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

// Longest names first, so "Kari Anne Nordmann" becomes one marker before "Kari" is tried. A
// one-letter "name" (the house letter in "Bygg A", a sentence-initial "I") names no one, and
// redacting it would turn every "i" in the quote into a marker.
const longestFirst = (names: readonly string[]) =>
	[...names]
		.filter((n) => (stripMarks(n).match(/\p{L}/gu) ?? []).length >= 2)
		.sort((a, b) => b.length - a.length)

// A full name with any spacing, hyphen, case or accent, as a whole word: never inside a longer
// word, so the one-word name "Du" leaves "Dusjen" alone.
function fullPattern(personName: string): RegExp {
	return new RegExp(
		`(?<![\\p{L}\\p{N}\\p{M}])${nameParts(personName).map(letters).join(NAME_SEPARATOR)}${GENITIVE}(?![\\p{L}\\p{N}\\p{M}])`,
		"giu"
	)
}

// Every full name first, across the whole list and longest first, then every name token on its
// own. So "Kari Nordmann og Ola Nordmann" loses both names whole before "Nordmann" alone is
// tried, and no "Ola" is left beside a marker; the tokens then catch "Kari" or "Nordmann, Kari".
// The quote is read in NFD so accents match, and goes back to NFC.
export function redact(quotes: readonly string[], personNames: readonly string[]): string[] {
	const names = longestFirst(personNames)
	if (names.length === 0) return [...quotes]
	const fulls = names.map(fullPattern)
	const tokens = names.flatMap((n) => nameTokens(n).map((t) => tokenPattern(t, "giu")))
	return quotes.map((q) => {
		const whole = fulls.reduce((text, full) => text.replace(full, "[navn]"), q.normalize("NFD"))
		return tokens.reduce((text, token) => text.replace(token, "[navn]"), whole).normalize("NFC")
	})
}

// Fail-safe after redaction: the grounding gate matches normalised text, redact does not, so a
// name split by a soft hyphen can survive. Such a field is dropped, never stored.
function survivesOne(texts: readonly string[], personName: string): boolean {
	const tokens = nameTokens(personName).map((t) => tokenPattern(normaliseText(t), "iu"))
	return texts.some((text) => tokens.some((token) => token.test(stripMarks(normaliseText(text)))))
}

function nameSurvives(texts: readonly string[], personNames: readonly string[]): boolean {
	return longestFirst(personNames).some((name) => survivesOne(texts, name))
}

function stored(evidence: Evidence, personNames: readonly string[]): Evidence {
	if (evidence.kind === "quote")
		return { kind: "quote", quotes: redact(evidence.quotes, personNames) }
	if (evidence.kind === "decision" && evidence.original.kind === "quote") {
		return {
			...evidence,
			original: { kind: "quote", quotes: redact(evidence.original.quotes, personNames) },
		}
	}
	return evidence
}

// A possible name whose every part stands in the field's own value ("Storgata" in "Storgata 1").
// The value is stored anyway, so redacting that text out of its quote protects nothing and only
// cuts the value out of the quote that grounds it.
function inValue(c: Candidate, personName: string): boolean {
	if (typeof c.value !== "string") return false
	const value = stripMarks(normaliseText(c.value))
	const parts = nameParts(personName)
	return parts.length > 0 && parts.every((p) => tokenPattern(normaliseText(p), "iu").test(value))
}

const HOURS_FIELDS: ReadonlySet<string> = new Set(["openingHours", "phoneHours"])
const HOURS_NAME = "the hours text may hold a person name"

// The hours value is built from the quoted lines and stored as it is, so it cannot be redacted.
// A run like "Kari Nordmann" drops it, and so does a possible name that stands inside a sentence
// ("hos Kari"). A capitalised word that opens a sentence ("Helsestasjonen er åpen") does not.
function hoursNameReason(c: Candidate): string | undefined {
	if (!HOURS_FIELDS.has(c.field) || typeof c.value !== "string") return undefined
	if (capitalisedRuns(c.value).length > 0) return HOURS_NAME
	const inside = midSentenceWords(c.value)
	if (inside.length === 0) return undefined
	return longestFirst(c.personNames).some((name) => survivesOne(inside, name))
		? HOURS_NAME
		: undefined
}

export type EditCheck = { ok: true } | { ok: false; reason: string }

// The check my own value gets before review saves it: validity, safety and the hours name
// guard, the gates verify runs on a value with my decision as its evidence (grounding and
// agreement pass a decision). So a validity review I settle passes, a drop refuses, and a
// mobile passes only with a role. Task 18's review calls it; verify runs runGates, which holds
// the same checks.
export function checkEdit(c: Candidate, ctx: GateContext): EditCheck {
	for (const result of [validityGate(c, ctx), safetyGate(c, ctx)]) {
		if (!result.pass) return { ok: false, reason: `${result.gate}: ${result.reason ?? "failed"}` }
	}
	const name = hoursNameReason(c)
	return name === undefined ? { ok: true } : { ok: false, reason: name }
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
	const hoursName = hoursNameReason(c)
	if (hoursName !== undefined) return { ...base, status: "dropped", reason: hoursName }
	const addressId =
		c.field === "address" && typeof c.value === "string"
			? ctx.findAddress(c.value)?.addressId
			: undefined
	// Every possible name is redacted, except one that is the value's own text.
	const names = c.personNames.filter((n) => !inValue(c, n))
	const evidence = stored(c.evidence, names)
	const role = c.role === undefined ? undefined : (redact([c.role], names)[0] ?? "")
	const left = [...evidenceQuotes(evidence), ...(role ? [role] : [])]
	if (nameSurvives(left, names)) {
		return { ...base, status: "dropped", reason: "person name left after redaction" }
	}
	const kept = {
		value: c.value,
		origin: c.origin,
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
