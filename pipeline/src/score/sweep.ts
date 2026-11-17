import { join } from "node:path"
import { DiscoverError } from "../discover/discover.ts"
import { readDiscovery } from "../discover/files.ts"
import { readJsonDir } from "../io/files.ts"
import { selects } from "../pilot/list.ts"
import { FIELD_NAMES } from "../schema/common.ts"
import { CuratedFile } from "../schema/curated.ts"
import { evidenceQuotes, type LockFile } from "../schema/lock.ts"
import { isKnownWord, midSentenceWords } from "../text/names.ts"
import { readAllLocks } from "./load.ts"
import { compareText } from "./sample.ts"

export const SWEEP_HEADER = "Read this list yourself. Do not paste it into an AI session."

export type SweepLine = {
	kommune: string
	unitId: string
	field: string
	where: "value" | "role" | "quote"
	word: string
}

// Every capitalised word left in a field's value, role and quotes that does not open a sentence
// and is not a word Varde knows, once per kommune, unit, field, place and word. A dropped field
// holds no text. The "[navn]" marker is lower case, so it is never a word here, and the word
// after it still counts as mid-sentence.
export function sweepLocks(locks: readonly LockFile[], places: readonly string[]): SweepLine[] {
	const lines = new Map<string, SweepLine>()
	for (const lock of locks) {
		for (const unit of lock.units) {
			for (const field of FIELD_NAMES) {
				const f = unit.fields[field]
				if (f === undefined || f.status === "dropped") continue
				const texts: [SweepLine["where"], string][] = []
				if (typeof f.value === "string") texts.push(["value", f.value])
				if (f.role !== undefined) texts.push(["role", f.role])
				for (const q of f.evidence === undefined ? [] : evidenceQuotes(f.evidence))
					texts.push(["quote", q])
				for (const [where, text] of texts) {
					for (const word of midSentenceWords(text)) {
						if (isKnownWord(word, places)) continue
						const line = { kommune: lock.kommune, unitId: unit.unitId, field, where, word }
						lines.set([lock.kommune, unit.unitId, field, where, word].join("\u0000"), line)
					}
				}
			}
		}
	}
	return [...lines.values()].sort(
		(a, b) =>
			compareText(a.kommune, b.kommune) ||
			compareText(a.unitId, b.unitId) ||
			compareText(a.field, b.field) ||
			compareText(a.where, b.where) ||
			compareText(a.word, b.word)
	)
}

export function formatSweep(lines: readonly SweepLine[]): string {
	return [
		...lines.map((l) => `${l.kommune} ${l.unitId} ${l.field} ${l.where}: ${l.word}`),
		`${lines.length} words to read.`,
	].join("\n")
}

// Place names from discover's files when the cache has them; else from the curated files, which
// hold each kommune's KLASS name and are committed beside the locks.
export function sweepPlaces(root: string, cacheDir: string): string[] {
	try {
		return readDiscovery(join(cacheDir, "discover")).kommuner.map((k) => k.name)
	} catch (err) {
		if (!(err instanceof DiscoverError)) throw err
	}
	return readJsonDir(join(root, "data", "curated")).flatMap((f) => {
		const parsed = CuratedFile.safeParse(f.data)
		return parsed.success ? [parsed.data.name] : []
	})
}

// What the sweep command prints. It reads only, and returns the text: no file is written.
export function runSweep(root: string, cacheDir: string, only: readonly string[]): string {
	const places = sweepPlaces(root, cacheDir)
	const note =
		places.length === 0
			? [
					"No place names found (no discover files, no curated files), so kommune names are listed too.",
				]
			: []
	const locks = readAllLocks(root).filter((lock) => selects(only, lock.kommune))
	return [SWEEP_HEADER, ...note, formatSweep(sweepLocks(locks, places))].join("\n")
}
