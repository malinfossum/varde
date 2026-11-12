import { DAY_WORDS } from "./names.ts"
import { foldNorwegian, MAX_LINE, normaliseText, quoteHasText } from "./normalise.ts"

export type HoursResult = { ok: true; text: string } | { ok: false; reason: string }

const DASH = "\u2013"
const UNREADABLE: HoursResult = { ok: false, reason: "a time the formatter cannot read" }

// One pattern, two alternatives, tried left to right at each place: a range first, then a single
// time. A range is "kl" (optional), a time with or without minutes, a dash or "til", and a second
// time. A single time always has minutes. Neither may sit inside a longer dotted run (a date or a
// dotted phone number), which the lookbehind and lookahead refuse. Text is collapsed to single
// spaces first, so every space in the pattern is a single optional one.
const TIMES =
	/(?<![\p{L}\d.:])(?:(kl\.? ?)?(\d{1,2})(?:[.:](\d{2}))? ?(?:-|\u2013|\u2014|til) ?(?:kl\.? ?)?(\d{1,2})(?:[.:](\d{2}))?(?!\d|[.:]\d)|(kl\.? ?)?(\d{1,2})[.:](\d{2})(?!\d|[.:]\d))/giu

const pad = (n: number) => String(n).padStart(2, "0")

// Hours 0 to 24 and minutes 0 to 59; 24 only as 24:00.
function clock(hours: string | undefined, minutes: string | undefined): string | undefined {
	const h = Number(hours)
	const m = minutes === undefined ? 0 : Number(minutes)
	if (!Number.isInteger(h) || h > 24 || m > 59 || (h === 24 && m !== 0)) return undefined
	return `${pad(h)}:${pad(m)}`
}

// Quarter hours. Months run 01 to 12, so a dotted pair without "kl" whose second part is no
// quarter hour ("17.05", "14.04") may be a date, and the formatter will not guess.
const QUARTERS: ReadonlySet<string> = new Set(["00", "15", "30", "45"])
// A count after a bare range: "13-20 år", "1-2 ganger". The range is text, not a time.
const COUNT_AFTER =
	/^ ?(?:år|ganger|gang|timer|time|minutter|min|uker|uke|dager|måneder|mnd|kr|plasser|%)(?!\p{L})/iu

// The last two words before a match, folded and without punctuation. Words split on spaces and
// dashes, so "Mandag-fredag 8-16" ends in "fredag". Only 40 characters are read: linear.
function wordsBefore(text: string, at: number): string[] {
	return text
		.slice(Math.max(0, at - 40), at)
		.split(/[\s\u2013\u2014-]+/)
		.map((w) => foldNorwegian(w.replace(/[^\p{L}]/gu, "")))
		.filter((w) => w !== "")
		.slice(-2)
}

export function formatHours(text: string): HoursResult {
	if (text.length > MAX_LINE) return UNREADABLE
	const collapsed = text.replace(/\s+/g, " ").trim()
	let failed = false
	const out = collapsed.replace(
		TIMES,
		(match, kl1, h1, m1, h2, m2, kl3, h3, m3, offset: number) => {
			const before = wordsBefore(collapsed, offset)
			const kl = kl1 !== undefined || kl3 !== undefined || before.includes("kl")
			const minutes = [m1, m2, m3].filter((m): m is string => m !== undefined)
			if (!kl && /\d\.\d/.test(match) && minutes.some((m) => !QUARTERS.has(m))) {
				failed = true
				return match
			}
			if (h1 !== undefined) {
				if (m1 === undefined && m2 === undefined) {
					// A bare range ("13-18") is a time only right after "kl" or a day name, and never
					// before a count: "1-2 ganger i uka" and "13-20 år" stay text.
					const afterDay = kl || before.some((w) => DAY_WORDS.has(w))
					if (!afterDay || COUNT_AFTER.test(collapsed.slice(offset + match.length))) return match
				}
				const from = clock(h1, m1)
				const to = clock(h2, m2)
				if (from === undefined || to === undefined) {
					failed = true
					return match
				}
				return `kl. ${from}${DASH}${to}`
			}
			const at = clock(h3, m3)
			if (at === undefined) {
				failed = true
				return match
			}
			return kl3 === undefined ? at : `kl. ${at}`
		}
	)
	return failed ? UNREADABLE : { ok: true, text: out }
}

const FORMATTED_TIME = /\d{2}:\d{2}(?:\u2013\d{2}:\d{2})?/g

// Whether the text holds a time or a time range the formatter reads.
export function hasTime(text: string): boolean {
	const formatted = formatHours(text)
	return formatted.ok && /\d{2}:\d{2}/.test(formatted.text)
}

const wordsOf = (text: string) =>
	normaliseText(text)
		.split(/[^\p{L}]+/u)
		.filter((w) => w.length >= 2 && w !== "kl")

// A value the formatter could not read is the raw text (the rule sends it to review), so it is
// grounded when it stands in the quotes as written. A formatted value is grounded when its times
// come from the formatted quotes in the same order, so two days cannot swap hours, and every word
// in it is a word of the quotes. A formatted value is never a verbatim substring of a raw quote
// ("08.00-15.30" against "kl. 08:00\u201315:30"), so the plain text check cannot ground it.
export function hoursGrounded(value: string, quotes: readonly string[]): boolean {
	if (quotes.some((q) => quoteHasText(q, value)) || quoteHasText(quotes.join(", "), value))
		return true
	const formatted = quotes.map(formatHours)
	if (formatted.some((f) => !f.ok)) return false
	const text = formatted.map((f) => (f.ok ? f.text : "")).join(" ")
	const times: readonly string[] = text.match(FORMATTED_TIME) ?? []
	let next = 0
	for (const t of value.match(FORMATTED_TIME) ?? []) {
		const found = times.indexOf(t, next)
		if (found === -1) return false
		next = found + 1
	}
	const words = new Set(wordsOf(text))
	return wordsOf(value).every((w) => words.has(w))
}

// The length the 200-character limit counts: Unicode code points of the stored text.
export function hoursLength(text: string): number {
	return [...text].length
}
