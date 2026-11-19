import { MAX_HOURS } from "../../gates/validity.ts"
import type { NavOffice } from "../../registers/nav.ts"
import { MAX_QUOTE } from "../../schema/common.ts"
import type { ExtractedCandidate } from "../../schema/extraction.ts"
import { formatHours, hoursLength } from "../../text/hours.ts"
import { hoursLines } from "../contactBlock.ts"
import type { UnitPage } from "../page.ts"

const collapse = (text: string) => text.replace(/\s+/g, " ").trim()

// What a note on an open day may be about and still leave the drop-in hours as they stand: when
// booked appointments run, or when the self-service zone is open (ruled 19.11.2026). The words
// come from the 108 notes on the 259 office pages fetched 18.11.2026.
const NOTE_SUBJECTS = new Set([
	"timeavtale",
	"timeavtaler",
	"timeavtalar",
	"avtale",
	"avtaler",
	"avtalt",
	"avtalte",
	"forhåndsavtale",
	"forhåndsavtalte",
	"samtaler",
	"møter",
	"brukarmøter",
	"selvbetjening",
	"selvbetjeningsløsningene",
	"selvbetjeningssone",
	"selvhjelpsløsninger",
])
// The words Nav puts around them. "kun", "stengt", "telefon", "publikumsmottak" and "drop-in" are
// left out on purpose: a note with any word outside the two lists goes to me.
const NOTE_FILLERS = new Set([
	"åpent",
	"åpen",
	"open",
	"for",
	"og",
	"kl",
	"fra",
	"til",
	"mellom",
	"i",
	"tidsrommet",
	"planlagt",
	"planlagte",
	"fysiske",
	"kontoret",
	"har",
	"betjener",
	"betjenes",
	"gjennomføres",
	"avholdes",
	"skjer",
	"etter",
	"alle",
	"dager",
	"hver",
	"dag",
	"hverdager",
	"mandag",
	"fredag",
	"bruk",
	"av",
	"tilgang",
	"kan",
	"benyttes",
	"også",
	"utenom",
	"åpningstiden",
])

// True when a note says something the drop-in hours do not cover. A note with no letter or digit
// ("-") is no note. Times and punctuation are skipped; every word left must be a known one, and
// one of them must name appointments or self-service.
function noteNeedsReview(note: string | undefined): boolean {
	if (note === undefined || !/[\p{L}\p{N}]/u.test(note)) return false
	const words = note
		.toLowerCase()
		.split(/[^\p{L}]+/u)
		.filter((w) => w !== "")
	const known = words.every((w) => NOTE_SUBJECTS.has(w) || NOTE_FILLERS.has(w))
	return !(known && words.some((w) => NOTE_SUBJECTS.has(w)))
}

// Nav's own office data (licence ownPage, register evidence): the open days in its order, each
// through the formatter. Special dates and closed days are left out. The value is the drop-in
// window (fra/til). A note that only names appointment or self-service times is left out of it;
// any other note ("kun timeavtale", a closure) sends the hours to me, and so does an office with
// more than one reception: parseNavOffice reads the first one's hours only.
export function navHoursCandidate(office: NavOffice): ExtractedCandidate | undefined {
	const open = office.hours.filter(
		(h) =>
			h.date === undefined &&
			!h.closed &&
			h.day !== undefined &&
			h.from !== undefined &&
			h.to !== undefined
	)
	const formatted = open.map((h) => formatHours(`${h.day} ${h.from}-${h.to}`))
	if (formatted.length === 0 || formatted.some((f) => !f.ok)) return undefined
	const c: ExtractedCandidate = {
		field: "openingHours",
		value: formatted.map((f) => (f.ok ? f.text : "")).join(", "),
		evidence: { kind: "register", register: "nav", recordId: office.enhetNr },
		origin: "register",
	}
	if (open.some((h) => h.appointmentOnly))
		return { ...c, review: "Nav lists appointment-only hours" }
	if (open.some((h) => noteNeedsReview(h.note)))
		return { ...c, review: "Nav lists a note on the hours" }
	return office.receptions > 1 ? { ...c, review: "Nav lists more than one reception" } : c
}

// The CMS hours box, else the lines under an Åpningstider heading. Every line is a quote, so a
// line too long to quote gives no candidate.
export function pageHoursCandidate(page: UnitPage): ExtractedCandidate | undefined {
	const found = hoursLines(page)
	if (found === undefined || found.lines.some((l) => l.length > MAX_QUOTE)) return undefined
	const quotes = found.lines
	const formatted = quotes.map(formatHours)
	const base = {
		field: "openingHours" as const,
		evidence: { kind: "quote" as const, quotes },
		origin: "unitPage" as const,
	}
	if (formatted.some((f) => !f.ok)) {
		return {
			...base,
			value: collapse(quotes.join(", ")),
			review: "a time the formatter cannot read",
		}
	}
	const value = collapse(formatted.map((f) => (f.ok ? f.text : "")).join(", "))
	return hoursLength(value) > MAX_HOURS
		? { ...base, value, review: `the hours are longer than ${MAX_HOURS} characters` }
		: { ...base, value }
}
