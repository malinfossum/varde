// The pilot (spec, "PR 4: pilot run", "The pilot list"): Oslo and the 46 Innlandet kommuner, 47
// in all. The Innlandet codes are KLASS classification 131 codesAt 2026-10-28, read 13.11.2026.
// A kommune change in KLASS after that date changes this list by hand, in its own PR.
export const PILOT: readonly string[] = Object.freeze([
	"0301",
	"3401",
	"3403",
	"3405",
	"3407",
	"3411",
	"3412",
	"3413",
	"3414",
	"3415",
	"3416",
	"3417",
	"3418",
	"3419",
	"3420",
	"3421",
	"3422",
	"3423",
	"3424",
	"3425",
	"3426",
	"3427",
	"3428",
	"3429",
	"3430",
	"3431",
	"3432",
	"3433",
	"3434",
	"3435",
	"3436",
	"3437",
	"3438",
	"3439",
	"3440",
	"3441",
	"3442",
	"3443",
	"3446",
	"3447",
	"3448",
	"3449",
	"3450",
	"3451",
	"3452",
	"3453",
	"3454",
])

// The 8 kommuner the answer key covers. Pass-mark rules 1, 3 and 4 are scored on these; rule 5
// samples the other 39.
export const KEY_KOMMUNER: readonly string[] = Object.freeze([
	"0301",
	"3403",
	"3405",
	"3407",
	"3411",
	"3412",
	"3413",
	"3420",
])

// The pilot kommuner whose robots.txt blocks ClaudeBot (checked 13.11.2026): Hamar, Løten, Stange,
// Nord-Odal, Sør-Odal, Grue and Våler (Innlandet's 3419). Their page text, extraction files, lock
// values and quotes never go to an AI company.
export const CLAUDEBOT_BLOCKED: readonly string[] = Object.freeze([
	"3403",
	"3412",
	"3413",
	"3414",
	"3415",
	"3417",
	"3419",
])

// A kommune number (four digits) or a county prefix (two digits).
const SELECTION = /^\d{2}(?:\d{2})?$/

// --only as every stage reads it: kommune numbers and county prefixes separated by commas, and the
// word "pilot" for the 47 above. Entries may be mixed and repeated ("pilot,0301"); each counts
// once, in the place it first stood. No --only gives [] (every kommune). undefined means an entry
// is none of these, and the command prints its usage.
export function parseOnly(raw: string | undefined): string[] | undefined {
	const entries = (raw ?? "")
		.split(",")
		.map((p) => p.trim())
		.filter((p) => p !== "")
	const out: string[] = []
	for (const entry of entries) {
		if (entry === "pilot") out.push(...PILOT)
		else if (SELECTION.test(entry)) out.push(entry)
		else return undefined
	}
	return [...new Set(out)]
}

// Whether a selection takes this kommune. An empty selection takes every kommune.
export function selects(only: readonly string[], kommune: string): boolean {
	return only.length === 0 || only.some((p) => kommune.startsWith(p))
}
