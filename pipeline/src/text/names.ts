import { ROLE_WORD_PARTS } from "../extract/roleWords.ts"
import { foldNorwegian } from "./normalise.ts"

// Possible person names in a quote (ruling 28). Lock files and PR bodies are public, so a
// missed name is a leak: every capitalised word, and every run of them, counts unless it is a
// word Varde knows is no name. It redacts too much on purpose.

const days = ["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag"]
// Day names, their plurals ("mandager"), definite forms ("mandagen") and short forms ("man").
export const DAY_WORDS: ReadonlySet<string> = new Set(
	[
		...days,
		...days.map((d) => `${d}er`),
		...days.map((d) => `${d}en`),
		"man",
		"tir",
		"ons",
		"tor",
		"fre",
		"lør",
		"søn",
		"hverdag",
		"hverdager",
		"helg",
		"helger",
		"helgen",
		"helligdager",
	].map(foldNorwegian)
)
export const MONTH_WORDS: ReadonlySet<string> = new Set(
	[
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
	].map(foldNorwegian)
)
// Words that label a contact line. Without them every phone line would hold a "name".
export const LABEL_WORDS: ReadonlySet<string> = new Set(
	[
		"telefon",
		"tlf",
		"vakttelefon",
		"mobil",
		"sms",
		"faks",
		"fax",
		"telefaks",
		"sentralbord",
		"servicetorg",
		"e-post",
		"epost",
		"post",
		"adresse",
		"besøksadresse",
		"postadresse",
		"postboks",
		"kontakt",
		"kontaktinformasjon",
		// "Ring 62 00 00 00" opens many contact lines.
		"ring",
		"åpningstider",
		"åpningstid",
		// A service, never a person: "Legevakten: 116 117" is a service line.
		"legevakt",
		"telefontid",
		"telefontider",
		"åpent",
		"stengt",
		"døgnåpent",
		"døgnåpen",
		"kl",
	].map(foldNorwegian)
)

export type NameContext = { unitName?: string; places: readonly string[] }

// A capitalised word: a capital letter, then letters or marks, with hyphenated parts kept in
// one word ("Anne-Marie"). The hyphen separates the parts, so nothing overlaps.
const CAPITALISED = /(?<![\p{L}\p{N}\p{M}])\p{Lu}[\p{L}\p{M}]*(?:[-\u2010\u2011][\p{L}\p{M}]+)*/gu
const WHITESPACE_ONLY = /^\s+$/

const fold = (word: string) => foldNorwegian(word.replace(/[\u2010\u2011]/g, "-"))
const wordsOf = (text: string) => text.split(/[\s,()]+/).filter((w) => w !== "")

// A label word as written, in its definite form ("Sentralbordet", "Legevakten") or with
// "-nummer" ("Telefonnummer", "Telefonnummeret"). Each ending is one fixed suffix: no overlap.
const DEFINITE = /(?:ene|en|et|a)$/
const NUMBER = /(?:nummer|numre)$/
export function isLabelWord(folded: string): boolean {
	if (LABEL_WORDS.has(folded)) return true
	const bare = folded.replace(DEFINITE, "")
	return LABEL_WORDS.has(bare) || LABEL_WORDS.has(bare.replace(NUMBER, ""))
}

// Day and month words that are given names too. Capitalised, they count as possible names, so
// "Tor Nordmann" and "August Nordmann" are redacted whole. The hours formatter still reads them
// as day and month words (DAY_WORDS and MONTH_WORDS keep them).
const GIVEN_NAMES_TOO: ReadonlySet<string> = new Set(["tor", "mai", "august"])

const calendarWord = (folded: string) =>
	(DAY_WORDS.has(folded) || MONTH_WORDS.has(folded)) && !GIVEN_NAMES_TOO.has(folded)

// A word Varde knows is no name. A hyphenated word counts when every part does: "Mandag-fredag"
// and "Man-fre" are day ranges, "Tor-Erik" is a name.
function staticWord(folded: string): boolean {
	const one = (w: string) => calendarWord(w) || isLabelWord(w) || ROLE_WORD_PARTS.has(w)
	if (one(folded)) return true
	if (!folded.includes("-")) return false
	return folded
		.split("-")
		.every((p) => p !== "" && (one(p) || DAY_WORDS.has(p) || MONTH_WORDS.has(p)))
}

type Word = { text: string; folded: string }

// Runs of capitalised words that stand next to each other with only spaces between. A label
// word ends a run and is left out ("Ring Kari" is the label "Ring" and the run "Kari").
function runs(text: string): Word[][] {
	const found: Word[][] = []
	let current: Word[] = []
	let lastEnd = -1
	const close = () => {
		if (current.length > 0) found.push(current)
		current = []
	}
	for (const m of text.matchAll(CAPITALISED)) {
		const word = m[0]
		const start = m.index
		if (current.length > 0 && !WHITESPACE_ONLY.test(text.slice(lastEnd, start))) close()
		const folded = fold(word)
		if (isLabelWord(folded)) close()
		else current.push({ text: word, folded })
		lastEnd = start + word.length
	}
	close()
	return found
}

// Every run that holds one word that may be a name, returned whole. An exempt word inside such a
// run is redacted with it, so "Kari Gran" (Gran is a kommune) or "Tor Nordmann" never leaves half
// a name behind. A word of the unit's own name is exempt only beside another one ("Eksempel
// Helsestasjon"): alone it may be the person a unit is named after.
export function possibleNames(text: string, ctx: NameContext): string[] {
	const places = new Set<string>()
	for (const place of ctx.places) {
		places.add(fold(place))
		for (const part of place.split(/[\s-]+/)) places.add(fold(part))
	}
	const unitWords = new Set(wordsOf(ctx.unitName ?? "").map(fold))
	const found: string[] = []
	for (const run of runs(text)) {
		const inUnit = run.map((w) => unitWords.has(w.folded))
		const exempt = run.map(
			(w, i) =>
				staticWord(w.folded) ||
				places.has(w.folded) ||
				(inUnit[i] === true && (inUnit[i - 1] === true || inUnit[i + 1] === true))
		)
		if (!exempt.every(Boolean)) found.push(run.map((w) => w.text).join(" "))
	}
	return [...new Set(found)]
}

// Two or more capitalised words in a row that are not days, months, labels or roles: the shape
// of "Kari Nordmann". The hours name guard in runGates uses it on a value it cannot redact.
export function capitalisedRuns(text: string): string[] {
	const out: string[] = []
	for (const run of runs(text)) {
		let part: string[] = []
		for (const w of [...run, undefined]) {
			if (w === undefined || staticWord(w.folded)) {
				if (part.length >= 2) out.push(part.join(" "))
				part = []
			} else {
				part.push(w.text)
			}
		}
	}
	return out
}

// Capitalised words that do not open a sentence: "hos Kari" gives "Kari", "Helsestasjonen er
// åpen" gives nothing. A sentence opens at the start of the text or after ".", "!", "?" or ":".
// Only the 20 characters before each word are read, so this stays linear.
export function midSentenceWords(text: string): string[] {
	const out: string[] = []
	for (const m of text.matchAll(CAPITALISED)) {
		const before = text.slice(Math.max(0, m.index - 20), m.index)
		const opens = (m.index === before.length && before.trim() === "") || /[.!?:]\s*$/.test(before)
		if (!opens) out.push(m[0])
	}
	return out
}
