import { fitsNumberPlan } from "../gates/validity.ts"
import { MAX_LINE, phoneDigits, undotPhones } from "./normalise.ts"

// short: a 3, 5 or 6 digit number (113, 116 123). A house number or a price has the same
// shape, so the phone rule (extract/fields/phone.ts) takes one only beside a phone label.
export type PhoneHit = { text: string; digits: string; index: number; short: boolean }

// A run of digits with single spaces or dots between them, with an optional country code. Each
// repetition takes one digit, and the separator before it is optional, so nothing overlaps.
const RUN = /(?<![\d+])(?:\+47[ \u00A0]?|0047[ \u00A0]?)?\d(?:[ \u00A0.]?\d)*(?!\d)/g
const COUNTRY = /^(?:\+47|0047)[ \u00A0]?/
const DOTTED_SHAPE = /^(?:\d{2}\.\d{2}\.\d{2}\.\d{2}|\d{3}\.\d{2}\.\d{3})$/

// Group lengths Norwegian pages write an eight-digit number in. Anything else ("2317 62 00")
// is not read as one number.
const EIGHT = new Set(["8", "2,2,2,2", "3,2,3", "4,4"])

export function isMobileDigits(digits: string): boolean {
	return /^[49]\d{7}$/.test(digits)
}

type Group = { digits: string; start: number; end: number }

function groups(run: string): Group[] {
	return [...run.matchAll(/\d+/g)].map((m) => ({
		digits: m[0],
		start: m.index,
		end: m.index + m[0].length,
	}))
}

// A post box line: "Postboks 4000 2306 Hamar" holds a box number and a postcode, which read
// together as the 4-4 shape of a mobile.
const POSTBOX = /(?<!\p{L})(?:postboks|pb)(?!\p{L})/iu
const BEFORE_PLACE = /^[ \u00A0]\p{Lu}/u

// The numbers in one space-grouped run, scanning group by group. At most four groups make one
// number, so this is linear in the run's length. On a post box line a last group of four digits
// before a place name is the postcode, never part of a number.
function spaced(run: string, offset: number, prefix: string, postcodeLast: boolean): PhoneHit[] {
	const gs = groups(run)
	if (postcodeLast && gs.at(-1)?.digits.length === 4) gs.pop()
	const hits: PhoneHit[] = []
	let i = 0
	while (i < gs.length) {
		let found: { end: number; digits: string } | undefined
		for (let n = 1; n <= 4 && i + n <= gs.length; n++) {
			const part = gs.slice(i, i + n)
			const digits = part.map((g) => g.digits).join("")
			const shape = part.map((g) => g.digits.length).join(",")
			const whole = i === 0 && i + n === gs.length
			const eight = digits.length === 8 && EIGHT.has(shape)
			// Short numbers (1xx, 116xxx, 0xxxx) only when they are the whole run.
			const short =
				whole &&
				digits.length !== 8 &&
				(shape === "3" || shape === "5" || shape === "3,3" || shape === "6")
			if ((eight || short) && fitsNumberPlan(digits)) found = { end: i + n, digits }
			if (found !== undefined) break
		}
		if (found === undefined) {
			i++
			continue
		}
		const first = gs[i]
		const last = gs[found.end - 1]
		if (first !== undefined && last !== undefined) {
			const lead = i === 0 ? prefix : ""
			hits.push({
				text: `${lead}${run.slice(first.start, last.end)}`,
				digits: found.digits,
				index: offset + first.start - lead.length,
				short: found.digits.length !== 8,
			})
		}
		i = found.end
	}
	return hits
}

// Every phone number on a line, in order, as the page writes it. A line over MAX_LINE is skipped.
export function findPhones(line: string): PhoneHit[] {
	if (line.length > MAX_LINE) return []
	const hits: PhoneHit[] = []
	for (const m of line.matchAll(RUN)) {
		const raw = m[0]
		const prefix = COUNTRY.exec(raw)?.[0] ?? ""
		const run = raw.slice(prefix.length)
		const runAt = m.index + prefix.length
		const postcodeLast =
			POSTBOX.test(line.slice(0, m.index)) && BEFORE_PLACE.test(line.slice(m.index + raw.length))
		// The run is cut at every space-separated piece that holds a dot. A dotted piece counts
		// only as a whole, in one of the two phone shapes and in the plan ("62 00 00 00 08.00"
		// yields the number and drops the time). The pieces between are read as spaced groups.
		const pieces = [...run.matchAll(/[^ \u00A0]+/g)]
		let from = 0
		let lead = prefix
		const flush = (to: number, last: boolean) => {
			const part = run.slice(from, to).replace(/[ \u00A0]+$/, "")
			if (/\d/.test(part)) {
				hits.push(...spaced(part, runAt + from, lead, last && postcodeLast))
				lead = ""
			}
		}
		for (const piece of pieces) {
			if (!piece[0].includes(".")) continue
			flush(piece.index, false)
			const text = piece[0]
			const digits = phoneDigits(undotPhones(text))
			if (DOTTED_SHAPE.test(text) && fitsNumberPlan(digits)) {
				hits.push({
					text: `${lead}${text}`,
					digits,
					index: runAt + piece.index - lead.length,
					short: false,
				})
			}
			lead = ""
			from = piece.index + text.length
		}
		flush(run.length, true)
	}
	return hits.map((h) => ({ ...h, digits: phoneDigits(h.text) }))
}
