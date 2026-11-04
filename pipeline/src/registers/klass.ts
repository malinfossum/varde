import { z } from "zod"

// SSB KLASS classification 131 (kommuner), CC BY 4.0.
export const KLASS_131 = "https://data.ssb.no/api/klass/v1/classifications/131"
export const codesAtQuery = (date: string) => `${KLASS_131}/codesAt?date=${date}`
export const changesQuery = (from: string, to: string) =>
	`${KLASS_131}/changes?from=${from}&to=${to}`

export type KlassKommune = { code: string; name: string }
export type KlassChange = {
	oldCode: string
	oldName: string
	newCode: string
	newName: string
	changeOccurred: string
}

const Codes = z.object({ codes: z.array(z.object({ code: z.string(), name: z.string() })) })
const Changes = z.object({
	codeChanges: z.array(
		z.object({
			oldCode: z.string(),
			oldName: z.string(),
			newCode: z.string(),
			newName: z.string(),
			changeOccurred: z.string(),
		})
	),
})

// KLASS writes Sami and Kven names after the Norwegian one: "Oslo - Oslove".
export function norwegianName(name: string): string {
	return name.split(" - ")[0]?.trim() ?? name
}

// The kommuner valid on the date. 9999 ("Uoppgitt") is not a kommune.
export function parseCodesAt(json: unknown): KlassKommune[] | undefined {
	const parsed = Codes.safeParse(json)
	if (!parsed.success) return undefined
	return parsed.data.codes
		.filter((c) => /^\d{4}$/.test(c.code) && c.code !== "9999")
		.map((c) => ({ code: c.code, name: norwegianName(c.name) }))
}

export function parseChanges(json: unknown): KlassChange[] | undefined {
	const parsed = Changes.safeParse(json)
	return parsed.success ? parsed.data.codeChanges : undefined
}

// A merged, split or renumbered kommune changes its number; a new name alone does not. Each
// renumbering becomes a review item that maps the old files to the new number (spec,
// "Kommune changes"). PR 2 lists them in the run report; no data files exist yet.
export function renumberings(changes: readonly KlassChange[]): KlassChange[] {
	return changes.filter((c) => c.oldCode !== c.newCode)
}

// Checks a table of kommune names and numbers against KLASS. Messages name the kommune and
// the code only: both are public.
export function kommuneNameMismatches(
	numbers: Readonly<Record<string, string>>,
	kommuner: readonly KlassKommune[]
): string[] {
	const byCode = new Map(kommuner.map((k) => [k.code, k.name]))
	return Object.entries(numbers).flatMap(([name, code]) => {
		const klassName = byCode.get(code)
		if (klassName === undefined) return [`${name}: ${code} is not a kommune in KLASS`]
		return klassName === name ? [] : [`${name}: KLASS names ${code} ${klassName}`]
	})
}
