import { fold } from "./match.ts"

export type HintEntry = { id: string; keywords: string[]; href: string }

// Starter map — one entry whose destination is unambiguously right. New entries go through
// the same verification discipline as seed data (spec: Contextual wayfinding hints).
export const hintEntries: HintEntry[] = [
	{
		id: "helsenorge",
		keywords: ["fastlege", "frikort", "resept", "helsenorge", "legetime", "kjernejournal"],
		href: "https://www.helsenorge.no",
	},
]

export function findHint(query: string): HintEntry | null {
	const folded = fold(query.trim())
	if (folded.length < 2) return null
	return (
		hintEntries.find((entry) => entry.keywords.some((keyword) => folded.includes(fold(keyword)))) ??
		null
	)
}
