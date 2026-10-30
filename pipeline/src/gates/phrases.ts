import type { Cost } from "../schema/common.ts"
import { normaliseText, phoneDigits } from "../text/normalise.ts"

// Phrase readings shared by the grounding, safety and Lavterskel rules. Text is normalised
// first, so case, soft hyphens and odd spaces never decide a reading.

export const NEGATORS: ReadonlySet<string> = new Set(["ikke", "ingen", "uten"])

export function sentences(text: string): string[] {
	return normaliseText(text)
		.split(/(?<=[.!?])\s+/)
		.filter((s) => s.length > 0)
}

export function words(sentence: string): string[] {
	return sentence.split(/[^\p{L}\p{N}-]+/u).filter((w) => w.length > 0)
}

// Words that limit a claim to some people or some cases: "men", "kun", "bare", "unntatt" and
// any word starting with "unntak". Shared by the referral, free and always-open readings.
export function limiting(ws: readonly string[]): boolean {
	return ws.some(
		(w) => w === "men" || w === "kun" || w === "bare" || w === "unntatt" || w.startsWith("unntak")
	)
}

// True when a negator stands within `span` words before position `index`.
export function negatedWithin(ws: readonly string[], index: number, span = 3): boolean {
	return ws.slice(Math.max(0, index - span), index).some((w) => NEGATORS.has(w))
}

// Things a service may give away while the service itself costs money: "gratis parkering"
// says nothing about the price of a session. Matched by prefix, except the short words.
const EXTRA_PREFIXES = [
	"parkering",
	"kaffe",
	"servering",
	"bevertning",
	"frokost",
	"lunsj",
	"middag",
	"kveldsmat",
	"måltid",
	"frukt",
	"drikke",
	"kake",
	"internett",
	"wifi",
	"wi-fi",
]
const EXTRA_WORDS: ReadonlySet<string> = new Set(["te", "mat", "maten", "brus", "trådløst"])

function isExtra(word: string | undefined): boolean {
	if (word === undefined) return false
	return EXTRA_WORDS.has(word) || EXTRA_PREFIXES.some((p) => word.startsWith(p))
}

// Words after "for alle" that narrow it to a group again: "gratis for alle under 25 år".
const NARROWING: ReadonlySet<string> = new Set([
	"under",
	"over",
	"som",
	"mellom",
	"med",
	"fra",
	"i",
])

// "for" at position i names a group, unless it is a plain "for alle" ("for alle under 25 år"
// is a group again).
function forAGroup(ws: readonly string[], i: number): boolean {
	return !(ws[i + 1] === "alle" && !NARROWING.has(ws[i + 2] ?? ""))
}

// A free phrase that spans ws[start..end] is about the service itself only when no extra stands
// within two words on either side, and it is not followed by "for" and a group ("for barn",
// "for medlemmer"). "For alle" on its own is no group.
function freeForEveryone(ws: readonly string[], start: number, end: number): boolean {
	const near = [...ws.slice(Math.max(0, start - 2), start), ...ws.slice(end + 1, end + 3)]
	if (near.some(isExtra)) return false
	return ws[end + 1] !== "for" || !forAGroup(ws, end + 1)
}

// Words that make "gratis" a trial, a first session, a limit or a condition: "Gratis første
// time", "Gratis hvis du er student", "Gratis inntil 5 timer".
const FREE_LIMIT_WORDS: ReadonlySet<string> = new Set([
	"første",
	"time",
	"timer",
	"timen",
	"gang",
	"ganger",
	"hvis",
	"dersom",
	"når",
	"inntil",
	"opptil",
])
const FREE_LIMIT_PREFIXES = ["prøve", "maks", "medlem"]

// A sentence whose free phrase is limited: a digit, a limit word, a limiting word, "til og
// med" or "så lenge". Such a sentence is no free evidence and goes to me.
export function freeLimited(sentence: string, ws: readonly string[]): boolean {
	return /\d/.test(sentence) || freeLimitWords(ws)
}

// The word part of freeLimited, without the digit rule.
function freeLimitWords(ws: readonly string[]): boolean {
	if (limiting(ws)) return true
	if (ws.some((w) => FREE_LIMIT_WORDS.has(w) || FREE_LIMIT_PREFIXES.some((p) => w.startsWith(p)))) {
		return true
	}
	return ws.some(
		(w, i) =>
			(w === "til" && ws[i + 1] === "og" && ws[i + 2] === "med") ||
			(w === "så" && ws[i + 1] === "lenge")
	)
}

export function saysFree(quote: string): boolean {
	for (const sentence of sentences(quote)) {
		const ws = words(sentence)
		if (freeLimited(sentence, ws)) continue
		for (const [i, w] of ws.entries()) {
			const next = ws[i + 1]
			if (w === "gratis" && !negatedWithin(ws, i) && freeForEveryone(ws, i, i)) return true
			if (w === "koster" && next === "ingenting" && freeForEveryone(ws, i, i + 1)) return true
			if (w === "uten" && next === "egenandel" && freeForEveryone(ws, i, i + 1)) return true
		}
	}
	return false
}

// A price in kroner anywhere in the quote. Tested on the whole quote, because "kr." would
// otherwise end a sentence before its number.
const PRICE = /(?:\bkr\.?\s?\d|\bnok\s?\d|\d+(?:[.,]\d+)?\s?(?:kr\b|kroner\b|,-))/

export function saysFee(quote: string): boolean {
	if (PRICE.test(normaliseText(quote))) return true
	for (const sentence of sentences(quote)) {
		const ws = words(sentence)
		for (const [i, w] of ws.entries()) {
			if (w.startsWith("egenandel") && !negatedWithin(ws, i, 2)) return true
		}
	}
	return false
}

// Words that speak of a price even without a number: kr, kroner, egenandel (but not "uten
// egenandel"), koster (but not "koster ingenting"), pris*, and any word holding betal, avgift,
// gebyr, vederlag, kontingent or kostnad (but not kostnadsfri), so "Egenbetaling" and
// "Kursavgift" count too.
const PRICE_PARTS = ["betal", "avgift", "gebyr", "vederlag", "kontingent"]
function priceSignal(ws: readonly string[]): boolean {
	return ws.some(
		(w, i) =>
			w === "kr" ||
			w === "kroner" ||
			(w.startsWith("egenandel") && ws[i - 1] !== "uten") ||
			(w === "koster" && ws[i + 1] !== "ingenting") ||
			w.startsWith("pris") ||
			PRICE_PARTS.some((p) => w.includes(p)) ||
			(w.includes("kostnad") && !w.includes("kostnadsfri"))
	)
}

// Grounding of cost "free" reads every quote together: a price, a limit or a closure in any
// sentence of any quote means the value goes to me.
// A price with a number is caught by the digit rule in freeLimited. That rule skips a quote
// that is only a phone number or only an address (final fixes 3 F2), whose number limits
// nothing.
export function freeQualifiedIn(quotes: readonly string[]): boolean {
	return quotes.some((q) => {
		const numbersAllowed = phoneOnly(q) || addressOnly(q)
		return sentences(q).some((sentence) => {
			const ws = words(sentence)
			const limited = numbersAllowed ? freeLimitWords(ws) : freeLimited(sentence, ws)
			return priceSignal(ws) || limited || saysClosed(ws)
		})
	})
}

export function classifyCost(quotes: readonly string[]): Cost | undefined {
	const free = quotes.some(saysFree)
	const fee = quotes.some(saysFee)
	if (free && fee) return "partly"
	if (free) return "free"
	if (fee) return "paid"
	return undefined
}

export type AlwaysOpenReading = "yes" | "no" | "qualified"

const WEEKDAYS = ["mandag", "tirsdag", "onsdag", "torsdag", "fredag", "lørdag", "søndag"]
const MONTHS: ReadonlySet<string> = new Set([
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
])
// Closures, holidays and seasons. Matched by prefix, so stenger, helgen, høytider, juleaften
// and sommerferien all count. These qualify a claim from any sentence of the same quote.
const CLOSED_OR_SEASONAL = ["steng", "unntak", "helg", "høytid", "ferie", "sommer", "jul", "påske"]

function closedOrSeasonal(ws: readonly string[]): boolean {
	return ws.some((w) => w === "unntatt" || CLOSED_OR_SEASONAL.some((p) => w.startsWith(p)))
}

// Only within the claim's own sentence: days, months, "fra", "til" and any number other than
// the 24 in "24/7" or "24 timer", since a quote often carries the phone number or the hours.
function limitedInTime(sentence: string, ws: readonly string[]): boolean {
	return /\d/.test(sentence.replace(/24\/7|24 timer/g, " ")) || timeWords(ws)
}

// The word part of limitedInTime, without the digit rule.
function timeWords(ws: readonly string[]): boolean {
	return ws.some(
		(w) =>
			w === "fra" ||
			w === "til" ||
			MONTHS.has(w) ||
			w.startsWith("hverdag") ||
			WEEKDAYS.some((d) => w.startsWith(d))
	)
}

// Only within the claim's own sentence: a limiting word, or "for" and a group ("Døgnåpent
// for kvinner"). A plain "for alle" limits nothing.
function limitedToSome(ws: readonly string[]): boolean {
	return limiting(ws) || ws.some((w, i) => w === "for" && forAGroup(ws, i))
}

function claimsAlwaysOpen(sentence: string, ws: readonly string[]): boolean {
	for (const [i, w] of ws.entries()) {
		if (w.startsWith("døgnåpen") && !negatedWithin(ws, i, 2)) return true
	}
	return /hele døgnet|24\/7|24 timer i døgnet/.test(sentence) && !ws.includes("ikke")
}

// Yes only for a plain claim ("Døgnåpent.", "Vi svarer 24/7."). A claim with a closure, a
// season, a day, a month, "fra", "til", a number, a limiting word or a group next to it is
// qualified and goes to me.
export function readAlwaysOpen(quote: string): AlwaysOpenReading {
	const all = sentences(quote).map((sentence) => ({ sentence, ws: words(sentence) }))
	const claims = all.filter(({ sentence, ws }) => claimsAlwaysOpen(sentence, ws))
	if (claims.length === 0) return "no"
	if (all.some(({ ws }) => closedOrSeasonal(ws))) return "qualified"
	if (claims.some(({ sentence, ws }) => limitedInTime(sentence, ws))) return "qualified"
	if (claims.some(({ ws }) => limitedToSome(ws))) return "qualified"
	return "yes"
}

// Grounding of alwaysOpen reads every quote together: a closure, a season, a time limit, a
// limiting word or a group in any sentence of any quote means the value goes to me.
export function alwaysOpenQualifiedIn(quotes: readonly string[]): boolean {
	return quotes.some((q) =>
		sentences(q).some((sentence) => {
			const ws = words(sentence)
			return (
				closedOrSeasonal(ws) || limitedInTime(sentence, ws) || limitedToSome(ws) || saysClosed(ws)
			)
		})
	)
}

export function saysAlwaysOpen(quote: string): boolean {
	return readAlwaysOpen(quote) === "yes"
}

export type ReferralReading = "noneNeeded" | "needed" | "unclear" | "silent"

// Matches by prefix, so henvist, henvises, henvisninger and vedtaket all count.
const REFERRAL_WORD = /^(?:henvis|vedtak)/

// Words that say no referral is needed although they start like one: henvisningsfritt,
// vedtaksfrie, selvhenvisning. Checked before REFERRAL_WORD.
const NO_REFERRAL_WORD = /^(?:henvisningsfri|vedtaksfri|selvhenvis)/

// A no-referral word or "henvise deg selv" at position i.
function noReferralMarker(ws: readonly string[], i: number): boolean {
	const w = ws[i] ?? ""
	return (
		NO_REFERRAL_WORD.test(w) || (w === "henvise" && ws[i + 1] === "deg" && ws[i + 2] === "selv")
	)
}

// "Lavterskel..." (any word starting so), drop-in, the no-referral words and "henvise deg
// selv". The index of each one in the sentence.
function markerIndexes(ws: readonly string[]): number[] {
	const found: number[] = []
	for (const [i, w] of ws.entries()) {
		if (
			w.startsWith("lavterskel") ||
			w.startsWith("drop-in") ||
			(w === "drop" && ws[i + 1] === "in") ||
			noReferralMarker(ws, i)
		) {
			found.push(i)
		}
	}
	return found
}

// A marker reads noneNeeded only in a plain sentence. A limiting word ("Drop-in kun for
// innbyggere") or a negator anywhere in it ("Drop-in er ikke mulig", "ikke for alle") makes it
// unclear. One exception for a lavterskel or drop-in marker: the single negator right before
// the sentence's one referral word ("Drop-in, uten henvisning") is that no-referral phrase,
// not a stray negator. A no-referral marker gets no such exception.
function markerReading(
	ws: readonly string[],
	i: number,
	negatorIsNoReferral: boolean
): "noneNeeded" | "unclear" {
	if (limiting(ws)) return "unclear"
	if (!ws.some((w) => NEGATORS.has(w))) return "noneNeeded"
	return !noReferralMarker(ws, i) && negatorIsNoReferral ? "noneNeeded" : "unclear"
}

// A sentence's referral words, read on their own: needed with no negator, noneNeeded when one
// negator stands directly before the one referral word, otherwise unclear.
function referralWordReading(
	sentence: string,
	ws: readonly string[],
	referralAt: readonly number[]
): Exclude<ReferralReading, "silent"> | undefined {
	if (referralAt.length === 0) return undefined
	const negators = ws.filter((w) => NEGATORS.has(w)).length
	if (negators === 0) return "needed"
	const at = referralAt[0] ?? 0
	if (negators === 1 && referralAt.length === 1 && negatesNext(sentence, at - 1)) {
		// "Uten henvisning, men kun for innbyggere" limits the no-referral reading.
		return requiredAfter(ws, at) || limiting(ws) ? "unclear" : "noneNeeded"
	}
	return "unclear"
}

// True when word i is a negator and only spaces stand between it and word i + 1 in the
// sentence: "uten henvisning" counts, "Ikke, henvisning kreves" and "Ikke mulig, henvisning"
// do not.
function negatesNext(sentence: string, i: number): boolean {
	const spans = [...sentence.matchAll(/[\p{L}\p{N}-]+/gu)]
	const word = spans[i]
	const next = spans[i + 1]
	if (i < 0 || word === undefined || next === undefined || !NEGATORS.has(word[0])) return false
	const between = sentence.slice((word.index ?? 0) + word[0].length, next.index)
	return /^\s+$/.test(between)
}

// A requirement word after the referral word turns it back into a need: "Ingen henvisning
// kreves" reads as a claim I want to see myself.
function requiredAfter(ws: readonly string[], at: number): boolean {
	return ws
		.slice(at + 1)
		.some(
			(w, j, rest) =>
				w === "kreves" || w === "krever" || w === "påkrevd" || (w === "må" && rest[j + 1] === "ha")
		)
}

// A sentence that says the service has closed, ended or paused: "Drop-in-tilbudet er
// avviklet", "Tilbudet er avsluttet", "satt på pause".
export function saysClosed(ws: readonly string[]): boolean {
	return ws.some(
		(w, i) =>
			w === "avviklet" ||
			w === "nedlagt" ||
			w === "stengt" ||
			w === "stengte" ||
			w.startsWith("avslutt") ||
			w.startsWith("opphør") ||
			(w === "på" && ws[i + 1] === "pause") ||
			(w === "lagt" && ws[i + 1] === "ned") ||
			(w === "ikke" && ws[i + 1] === "lenger")
	)
}

// Any sentence of any quote that says the service closed or ended. "Drop-in hver tirsdag.
// Det ble avviklet i 2024." puts the closure in the next sentence, so no reading stays local.
export function closedIn(quotes: readonly string[]): boolean {
	return quotes.some((q) => sentences(q).some((sentence) => saysClosed(words(sentence))))
}

// Per sentence:
// - A lavterskel, drop-in or no-referral word means none is needed only when the sentence
//   holds no limiting word and no negator ("ikke et lavterskeltilbud", "Drop-in er ikke
//   mulig"). A lavterskel or drop-in word may stand beside one negated referral word
//   ("Drop-in, uten henvisning").
// - A lone referral word reads noneNeeded only when the sentence holds exactly one negator,
//   it stands directly before that word with only spaces between, and no requirement word
//   (kreves, krever, påkrevd, "må ha") follows the word. With no negator it reads needed.
// - Two negators, a negator out of place, a requirement after the word, or several referral
//   words next to any negator ("Krever ikke henvisning, men vedtak") are unclear.
// Quotes that read more than one way are unclear too, and so is any reading when a sentence of
// any quote says the service closed or ended.
export function readReferral(quotes: readonly string[]): ReferralReading {
	const readings = new Set<Exclude<ReferralReading, "silent">>()
	for (const quote of quotes) {
		for (const sentence of sentences(quote)) {
			const ws = words(sentence)
			const markers = markerIndexes(ws)
			const referralAt = ws.flatMap((w, i) =>
				REFERRAL_WORD.test(w) && !NO_REFERRAL_WORD.test(w) && !markers.includes(i) ? [i] : []
			)
			const referral = referralWordReading(sentence, ws, referralAt)
			// A noneNeeded referral reading means its one negator stands right before the referral
			// word ("uten henvisning"), so that negator is the no-referral phrase itself.
			const negatorIsNoReferral = referral === "noneNeeded"
			for (const i of markers) readings.add(markerReading(ws, i, negatorIsNoReferral))
			if (referral !== undefined) readings.add(referral)
		}
	}
	if (readings.size === 0) return "silent"
	if (readings.size > 1 || closedIn(quotes)) return "unclear"
	const reading = [...readings][0] ?? "silent"
	// The allowlist (below): noneNeeded only from plain claims with clean neighbours.
	return reading === "noneNeeded" && !plainLavterskel(quotes) ? "unclear" : reading
}

// The allowlist (final fixes 3). Two denylist waves kept finding new ways to a false yes, so a
// yes reading now needs plain text. Every sentence that speaks of the claim must be plain: at
// most eight words, each from that reading's short vocabulary. Every other sentence of every
// quote must hold no negator, qualifier, price, number or closure. The denylist readings above
// stay as a second net behind this. A false review is cheap; a false yes is a defect.

const MAX_CLAIM_WORDS = 8

// Words any plain claim may hold beside its claim words.
const NEUTRAL: ReadonlySet<string> = new Set([
	"er",
	"det",
	"vi",
	"du",
	"tilbudet",
	"telefonen",
	"chatten",
	"og",
	"alle",
	"hele",
	"kan",
	"komme",
])

// "for" only as a closing "for alle" ("Gratis for alle."). "For alle deltakere" names a group.
function closingForAlle(ws: readonly string[], i: number): boolean {
	return ws[i] === "for" && ws[i + 1] === "alle" && i + 2 === ws.length
}

// A question ("Er tilbudet gratis?") is never a plain claim.
function plain(sentence: string, ws: readonly string[], allowed: (i: number) => boolean): boolean {
	if (sentence.endsWith("?")) return false
	return ws.length > 0 && ws.length <= MAX_CLAIM_WORDS && ws.every((_, i) => allowed(i))
}

const FREE_WORDS: ReadonlySet<string> = new Set(["gratis", "samtalene", "å", "delta"])

// A word of a plain free claim. "koster" only in "koster ingenting", "uten" only in "uten
// egenandel", so no price and no negator gets in.
function freeWord(ws: readonly string[], i: number): boolean {
	const w = ws[i] ?? ""
	return (
		NEUTRAL.has(w) ||
		FREE_WORDS.has(w) ||
		closingForAlle(ws, i) ||
		(w === "koster" && ws[i + 1] === "ingenting") ||
		(w === "ingenting" && ws[i - 1] === "koster") ||
		(w === "uten" && ws[i + 1] === "egenandel") ||
		(w === "egenandel" && ws[i - 1] === "uten")
	)
}

// A sentence that speaks of cost being free, plainly or not: "Delvis gratis." and "Ikke
// gratis" speak of it too, so they must be plain as well.
function mentionsFree(ws: readonly string[]): boolean {
	return ws.some(
		(w) =>
			w.startsWith("gratis") ||
			w.startsWith("kostnadsfri") ||
			w === "ingenting" ||
			w.startsWith("egenandel")
	)
}

const OTHER_NEGATORS: ReadonlySet<string> = new Set([
	...NEGATORS,
	"aldri",
	"verken",
	"ingenting",
	"intet",
	"nei",
	"ikkje",
	"utan",
	"inga",
])
// Words that qualify a claim from a neighbouring sentence, on top of the denylist's own.
const QUALIFIER_WORDS: ReadonlySet<string> = new Set([
	"delvis",
	"etter",
	"ved",
	"utenom",
	"bortsett",
	"mindre",
	"gjelder",
	"frem",
	"under",
	"over",
	"mellom",
	"kl",
	"år",
	"uka",
	"berre",
	"må",
	"først",
	"kreves",
	"krever",
	"påkrevd",
])
const QUALIFIER_PREFIXES = [
	"avtale",
	"begrens",
	"redus",
	"natt",
	"kveld",
	"midlertid",
	"periode",
	"alder",
	"uke",
	"dag",
	"lukk",
	"romjul",
	"åpningstid",
	"varier",
	"søk",
	"krav",
	"nødvendig",
	"tildel",
	"fastleg",
]

function qualifies(ws: readonly string[]): boolean {
	return (
		freeLimitWords(ws) ||
		closedOrSeasonal(ws) ||
		timeWords(ws) ||
		ws.some((w, i) => w === "for" && forAGroup(ws, i)) ||
		ws.some((w) => QUALIFIER_WORDS.has(w) || QUALIFIER_PREFIXES.some((p) => w.startsWith(p)))
	)
}

// A neighbouring sentence blocks a yes when it holds a negator, a qualifier, a price, a
// closure or, unless its quote is only a phone number or an address, a number.
function blocksYes(sentence: string, ws: readonly string[], numbersAllowed: boolean): boolean {
	return (
		ws.some((w) => OTHER_NEGATORS.has(w)) ||
		qualifies(ws) ||
		priceSignal(ws) ||
		saysClosed(ws) ||
		(!numbersAllowed && /\d/.test(sentence))
	)
}

// A quote that is only a phone number, with at most a label: "Telefon: 62 00 00 00".
const PHONE_LABEL = /^(?:telefonnummer|telefon|tlf|mobil|ring|sms)\.?:?\s*/
function phoneOnly(quote: string): boolean {
	const rest = normaliseText(quote).replace(/\.$/, "").replace(PHONE_LABEL, "")
	return /^\+?[\d ]+$/.test(rest) && [3, 5, 6, 8].includes(phoneDigits(rest).length)
}

// A quote that is only an address, and nothing else: an optional label (Adresse,
// Besøksadresse, Postadresse, Oppmøte), a street name of one to three words that ends in a
// street word, a house number with an optional letter, then an optional postal code and a
// place name. Read with its capitals kept, so prose before the street ("Forbeholdt beboere på
// Storgata 5", "Dessverre utilgjengelig Storgata 5") and prose after the place never pass.
// A street is a compound with a street ending ("Storgata", "Øvre Storgate"), or one or two
// capitalised words and a separate street word ("Kongens gate"). "plass" stands alone too
// often ("Ledig plass 20") to count on its own.
const STREET_ENDING =
	"(?:gata|gate|gaten|veien|vegen|vei|veg|plassen|plass|torget|torg|bakken|stien|svingen|tunet|ringen|brygge|brygga|kaia|kaien)"
const STREET_WORD = "(?:gate|gata|gaten|vei|veien|veg|vegen|allé)"
const STREET_PREFIX = "(?:Øvre|Nedre|Store|Lille|Nordre|Søndre|Vestre|Østre|Gamle|Nye|Indre|Ytre)"
const NAME_WORD = "\\p{Lu}[\\p{L}'.-]*"
const STREET = `(?:(?:${STREET_PREFIX} )?\\p{Lu}[\\p{L}-]*?${STREET_ENDING}|(?:${NAME_WORD} ){1,2}${STREET_WORD})`
const PLACE = "\\p{Lu}[\\p{L}-]*(?: \\p{Lu}[\\p{L}-]*){0,2}"
const ADDRESS = new RegExp(
	`^(?:(?:[Aa]dresse|[Bb]esøksadresse|[Pp]ostadresse|[Oo]ppmøte(?:sted)?) ?:? ?)?${STREET} \\d{1,4} ?[A-Za-z]?(?:,? \\d{4} ${PLACE})?$`,
	"u"
)
function addressOnly(quote: string): boolean {
	const text = quote
		.normalize("NFC")
		.replace(/\u00AD/g, "")
		.replace(/\s+/g, " ")
		.trim()
		.replace(/\.$/, "")
	return ADDRESS.test(text)
}

// A neighbour sentence is plain only when its quote is only a phone number or only an
// address, or the sentence passes one of the three claim vocabularies (free, always-open,
// Lavterskel). The Lavterskel vocabulary holds every free word, so checking it covers free
// too. Anything else, "Ta kontakt med legen din." included, blocks a yes. The word list in
// blocksYes stays behind this as a second net.
function plainNeighbour(sentence: string, ws: readonly string[], exempt: boolean): boolean {
	if (exempt) return true
	if (plainAlwaysOpenWords(sentence, ws)) return true
	const hasMarker = markerIndexes(ws).length > 0
	return plain(sentence, ws, (i) => lavterskelWord(ws, i, hasMarker))
}

// Cost "free" reads yes only when every sentence that speaks of it is a plain free claim, and
// every other sentence is clean. A quote that is only a phone number or an address may hold
// its number. Grounding still runs the denylist behind this.
export function plainlyFree(quotes: readonly string[]): boolean {
	let claims = 0
	for (const quote of quotes) {
		const numbersAllowed = phoneOnly(quote) || addressOnly(quote)
		for (const sentence of sentences(quote)) {
			const ws = words(sentence)
			if (mentionsFree(ws)) {
				if (!plain(sentence, ws, (i) => freeWord(ws, i))) return false
				claims++
			} else if (
				!plainNeighbour(sentence, ws, numbersAllowed) ||
				blocksYes(sentence, ws, numbersAllowed)
			) {
				return false
			}
		}
	}
	return claims > 0
}

const ALWAYS_OPEN_WORDS: ReadonlySet<string> = new Set([
	"døgnåpen",
	"døgnåpent",
	"døgnåpne",
	"åpent",
	"åpen",
	"døgnet",
	"svarer",
	"legevakten",
])

function mentionsAlwaysOpen(sentence: string, ws: readonly string[]): boolean {
	return ws.some((w) => w.startsWith("døgn")) || /24\/7/.test(sentence)
}

// A plain always-open claim: "24/7" and "24 timer i døgnet" are its only numbers, and no
// negator, limit or group gets in.
function plainAlwaysOpenClaim(sentence: string, ws: readonly string[]): boolean {
	return claimsAlwaysOpen(sentence, ws) && plainAlwaysOpenWords(sentence, ws)
}

// The vocabulary half of a plain always-open claim, with "24/7" and "24 timer i døgnet" taken
// out first.
function plainAlwaysOpenWords(sentence: string, ws: readonly string[]): boolean {
	if (ws.length > MAX_CLAIM_WORDS) return false
	const rest = words(sentence.replace(/24\/7|24 timer i døgnet/g, " "))
	return plain(sentence, rest, (i) => {
		const w = rest[i] ?? ""
		return NEUTRAL.has(w) || ALWAYS_OPEN_WORDS.has(w) || closingForAlle(rest, i)
	})
}

// alwaysOpen reads yes only when every sentence that speaks of it is a plain claim, and every
// other sentence is clean. A number anywhere blocks it, a phone number included (ruling 35).
export function plainlyAlwaysOpen(quotes: readonly string[]): boolean {
	let claims = 0
	for (const quote of quotes) {
		for (const sentence of sentences(quote)) {
			const ws = words(sentence)
			if (mentionsAlwaysOpen(sentence, ws)) {
				if (!plainAlwaysOpenClaim(sentence, ws)) return false
				claims++
			} else if (!plainNeighbour(sentence, ws, false) || blocksYes(sentence, ws, false)) {
				return false
			}
		}
	}
	return claims > 0
}

const LAVTERSKEL_WORDS: ReadonlySet<string> = new Set([
	"trenger",
	"krever",
	"deg",
	"selv",
	"åpen",
	"hver",
	"tar",
	"imot",
	"et",
	"tilbud",
])

function mentionsLavterskel(ws: readonly string[]): boolean {
	return (
		markerIndexes(ws).length > 0 ||
		ws.some((w) => REFERRAL_WORD.test(w) || NO_REFERRAL_WORD.test(w)) ||
		mentionsFree(ws)
	)
}

// A negator in a plain Lavterskel claim stands right before a referral word that is no marker:
// "uten henvisning", "trenger ikke vedtak".
function negatesReferral(ws: readonly string[], i: number): boolean {
	const next = ws[i + 1] ?? ""
	return (
		NEGATORS.has(ws[i] ?? "") &&
		REFERRAL_WORD.test(next) &&
		!NO_REFERRAL_WORD.test(next) &&
		!noReferralMarker(ws, i + 1)
	)
}

// A word of a plain Lavterskel claim: the free words, the markers, the referral words, a
// negator right before a referral word, and a weekday only beside a marker ("Drop-in hver
// tirsdag.").
function lavterskelWord(ws: readonly string[], i: number, hasMarker: boolean): boolean {
	const w = ws[i] ?? ""
	return (
		freeWord(ws, i) ||
		LAVTERSKEL_WORDS.has(w) ||
		w.startsWith("lavterskel") ||
		w.startsWith("drop-in") ||
		(w === "drop" && ws[i + 1] === "in") ||
		(w === "in" && ws[i - 1] === "drop") ||
		NO_REFERRAL_WORD.test(w) ||
		REFERRAL_WORD.test(w) ||
		negatesReferral(ws, i) ||
		(hasMarker && WEEKDAYS.includes(w))
	)
}

// A noneNeeded reading holds only when every sentence that speaks of referral, a marker or a
// free cost is a plain claim, and every other sentence is clean. A quote that is only a phone
// number or an address may hold its number.
function plainLavterskel(quotes: readonly string[]): boolean {
	for (const quote of quotes) {
		const numbersAllowed = phoneOnly(quote) || addressOnly(quote)
		for (const sentence of sentences(quote)) {
			const ws = words(sentence)
			if (mentionsLavterskel(ws)) {
				const hasMarker = markerIndexes(ws).length > 0
				if (!plain(sentence, ws, (i) => lavterskelWord(ws, i, hasMarker))) return false
			} else if (
				!plainNeighbour(sentence, ws, numbersAllowed) ||
				blocksYes(sentence, ws, numbersAllowed)
			) {
				return false
			}
		}
	}
	return true
}
