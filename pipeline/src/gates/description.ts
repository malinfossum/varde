import type { DescriptionDraft } from "../schema/model.ts"
import { normaliseText, normaliseUrl, quoteHasPhone } from "../text/normalise.ts"
import { words } from "./phrases.ts"
import { fitsNumberPlan } from "./validity.ts"

// The description gate: every number, link, email and mid-sentence name in an AI draft must
// match a value in the lock file. Words that open a sentence are not checked for names,
// because they are almost always ordinary words ("Tilbudet", "Call").

const CALENDAR_WORDS = new Set([
	"mandag",
	"tirsdag",
	"onsdag",
	"torsdag",
	"fredag",
	"lørdag",
	"søndag",
	"monday",
	"tuesday",
	"wednesday",
	"thursday",
	"friday",
	"saturday",
	"sunday",
	"januar",
	"februar",
	"mars",
	"april",
	"mai",
	"juni",
	"juli",
	"august",
	"september",
	"oktober",
	"november",
	"desember",
	"january",
	"february",
	"march",
	"may",
	"june",
	"july",
	"october",
	"december",
])
const ALWAYS_ALLOWED = new Set(["varde", "nav", "norge", "norway", "norwegian", "norsk", "i"])

const NUMBER_RUN = /\d+(?:[ .:,]\d+)*/g
const LINK_OR_EMAIL =
	/[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.\p{L}{2,}|(?:https?:\/\/)?(?:www\.)?[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)*\.(?:no|com|org|net)(?:\/[^\s)]*)?/gu

function groupsOf(run: string): string[] {
	return run.split(/[ .:,]/).filter((g) => g.length > 0)
}

// The token's digit groups appear, in order and whole, inside one number in the text; or
// the token is a phone number the text holds in another grouping.
export function numberInText(token: string, text: string): boolean {
	const want = groupsOf(token)
	if (want.length === 0) return false
	for (const run of normaliseText(text).match(NUMBER_RUN) ?? []) {
		const have = groupsOf(run)
		for (let i = 0; i + want.length <= have.length; i++) {
			if (want.every((g, j) => have[i + j] === g)) return true
		}
	}
	// Only a token in the Nkom plan may match a phone in another grouping. Without this, a glued
	// part of a phone ("6200" from "62 00 00 00") would pass as the whole number.
	return fitsNumberPlan(token) && quoteHasPhone(text, token)
}

export function checkDraft(draft: string, values: readonly string[]): string[] {
	const unmatched: string[] = []
	const haystack = values.map(normaliseText)

	for (const token of draft.match(LINK_OR_EMAIL) ?? []) {
		const clean = token.replace(/[.,;:]+$/, "")
		const ok = clean.includes("@")
			? values.some((v) => v.trim().toLowerCase() === clean.toLowerCase())
			: values.some(
					(v) =>
						normaliseUrl(v) ===
						normaliseUrl(/^https?:\/\//.test(clean) ? clean : `https://${clean}`)
				)
		if (!ok) unmatched.push(clean)
	}

	const text = draft.replace(LINK_OR_EMAIL, " ")
	for (const run of text.match(NUMBER_RUN) ?? []) {
		const token = run.replace(/[.,:]+$/, "")
		if (!values.some((v) => numberInText(token, v))) unmatched.push(token)
	}

	for (const sentence of text.split(/(?<=[.!?])\s+/)) {
		const ws = words(sentence)
		for (const w of ws.slice(1)) {
			if (!/^\p{Lu}/u.test(w)) continue
			const lower = w.toLocaleLowerCase("nb")
			if (CALENDAR_WORDS.has(lower) || ALWAYS_ALLOWED.has(lower)) continue
			if (haystack.some((v) => v.includes(normaliseText(w)))) continue
			unmatched.push(w)
		}
	}
	return unmatched
}

export function descriptionGate(
	draft: DescriptionDraft,
	values: readonly string[]
): { pass: boolean; unmatched: string[] } {
	const unmatched = [...checkDraft(draft.nb, values), ...checkDraft(draft.en, values)]
	return { pass: unmatched.length === 0, unmatched }
}
