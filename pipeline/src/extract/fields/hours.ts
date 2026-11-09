import { MAX_HOURS } from "../../gates/validity.ts"
import type { NavOffice } from "../../registers/nav.ts"
import { MAX_QUOTE } from "../../schema/common.ts"
import type { ExtractedCandidate } from "../../schema/extraction.ts"
import { formatHours, hoursLength } from "../../text/hours.ts"
import { hoursLines } from "../contactBlock.ts"
import type { UnitPage } from "../page.ts"

const collapse = (text: string) => text.replace(/\s+/g, " ").trim()

// Nav's own office data (licence ownPage, register evidence): the open days in its order, each
// through the formatter. Special dates and closed days are left out. A note on an open day
// ("kun timeavtale", a closure) is not in the value, so it sends the hours to me, and so does
// an office with more than one reception: parseNavOffice reads the first one's hours only.
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
	if (open.some((h) => h.note !== undefined && h.note.trim() !== ""))
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
