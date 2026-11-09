import { foldNorwegian } from "../text/normalise.ts"

// Words that name a public role next to a number the kommune publishes as a unit's contact
// (spec, "Phone order" rank 2). Each word is added from a fetched page or from Varde's own data,
// never from memory, with its source. Task 6 of the PR 3 plan adds the ones fetched pages show.
export type RoleWord = { word: string; label: string }

export const ROLE_WORDS: readonly RoleWord[] = [
	// docs/seed-data-innlandet-ring.md, rows researched 2026-08 (kommune service pages).
	{ word: "avdelingsleder", label: "Avdelingsleder" },
	{ word: "virksomhetsleder", label: "Virksomhetsleder" },
	{ word: "barnevernleder", label: "Barnevernleder" },
	// docs/seed-data-lavterskel-innlandet.md (a frivilligsentral's contact block).
	{ word: "daglig leder", label: "Daglig leder" },
	// Seen next to a mobile on www.lillehammer.kommune.no, 09.11.2026.
	{ word: "teamleder", label: "Teamleder" },
]

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// A role word as a whole word, any case, with any spacing inside a two-word role. Built once.
const PATTERNS = ROLE_WORDS.map((r) => ({
	label: r.label,
	pattern: new RegExp(
		`(?<![\\p{L}\\p{N}])${r.word.split(" ").map(escapeRegExp).join("\\s+")}(?![\\p{L}\\p{N}])`,
		"iu"
	),
}))

// The first role word on the line, as the page writes it (a verbatim quote) and as Varde
// labels it. Lines are compared as written: role words have no æ, ø or å today; foldNorwegian
// keeps it that way for any that do.
export function findRoleWord(line: string): { label: string; quote: string } | undefined {
	for (const { label, pattern } of PATTERNS) {
		const m = pattern.exec(line)
		if (m !== null) return { label, quote: m[0] }
	}
	return undefined
}

// Folded single words of every role, for the name rules: "daglig leder" gives both words.
export const ROLE_WORD_PARTS: ReadonlySet<string> = new Set(
	ROLE_WORDS.flatMap((r) => r.word.split(" ").map(foldNorwegian))
)
