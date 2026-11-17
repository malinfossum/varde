import { mkdirSync, mkdtempSync, readdirSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { describe, expect, it } from "vitest"
import { LockFile } from "../src/schema/lock.ts"
import { formatSweep, runSweep, SWEEP_HEADER, sweepLocks } from "../src/score/sweep.ts"
import { isKnownWord } from "../src/text/names.ts"
import { acceptedField, allGatesPass, T, testInputs } from "./helpers.ts"

const URL = "https://www.eksempel.kommune.no/helsestasjon/"
const ID = "org:999990001"

// A fictional lock: a name left in a phone quote, one after a [navn] marker, a sentence opener,
// a day, a role word and a place, and a dropped field.
const LOCK = LockFile.parse({
	kommune: "3405",
	inputs: testInputs(),
	units: [
		{
			unitId: ID,
			sources: [{ kind: "page", ref: URL }],
			fields: {
				name: acceptedField({
					value: "Eksempel Helsestasjon",
					sourceUrl: URL,
					evidence: { kind: "quote", quotes: ["Eksempel Helsestasjon"] },
				}),
				phone: acceptedField({
					sourceUrl: URL,
					role: "Avdelingsleder",
					evidence: {
						kind: "quote",
						quotes: [
							"Ring Kari Nordmann på 62 00 00 00, eller Kari på sms. Helsestasjonen er åpen.",
							"kontakt Avdelingsleder på 62 00 00 00",
						],
					},
				}),
				openingHours: acceptedField({
					value: "Åpent hver Mandag i Eksempelby",
					sourceUrl: URL,
					evidence: { kind: "quote", quotes: ["Åpent hver Mandag i Eksempelby"] },
				}),
				email: acceptedField({
					value: "post@eksempel.kommune.no",
					sourceUrl: URL,
					evidence: {
						kind: "quote",
						quotes: ["E-post til [navn] Nordmann: post@eksempel.kommune.no"],
					},
				}),
				phoneHours: {
					status: "dropped",
					sourceUrl: URL,
					fetchedAt: T,
					verifiedAt: T,
					gates: allGatesPass(),
					reason: "safety: person name left after redaction",
				},
			},
		},
	],
})

const line = (field: string, where: "value" | "role" | "quote", word: string) => ({
	kommune: "3405",
	unitId: ID,
	field,
	where,
	word,
})

describe("isKnownWord", () => {
	it("knows days, months, labels, roles and places, and not a name", () => {
		const places = ["Eksempelby", "Nord-Eksempel"]
		for (const word of [
			"Mandag",
			"Januar",
			"Telefonnummer",
			"Avdelingsleder",
			"Eksempelby",
			"Nord-Eksempel",
			"Eksempel",
		]) {
			expect(isKnownWord(word, places), word).toBe(true)
		}
		for (const word of ["Kari", "Nordmann", "Tor", "Helsestasjon"]) {
			expect(isKnownWord(word, places), word).toBe(false)
		}
	})
})

describe("sweepLocks", () => {
	it("lists each name left in a value or quote once, sorted, and nothing else", () => {
		expect(sweepLocks([LOCK], ["Eksempelby"])).toEqual([
			line("email", "quote", "Nordmann"),
			line("name", "quote", "Helsestasjon"),
			line("name", "value", "Helsestasjon"),
			line("phone", "quote", "Kari"),
			line("phone", "quote", "Nordmann"),
		])
	})

	it("lists a kommune name when it does not know the place", () => {
		expect(sweepLocks([LOCK], [])).toContainEqual(line("openingHours", "value", "Eksempelby"))
	})

	it("prints one line per word, then a count", () => {
		expect(formatSweep(sweepLocks([LOCK], ["Eksempelby"]))).toBe(
			[
				`3405 ${ID} email quote: Nordmann`,
				`3405 ${ID} name quote: Helsestasjon`,
				`3405 ${ID} name value: Helsestasjon`,
				`3405 ${ID} phone quote: Kari`,
				`3405 ${ID} phone quote: Nordmann`,
				"5 words to read.",
			].join("\n")
		)
	})
})

describe("runSweep", () => {
	const write = (path: string, value: unknown) => {
		mkdirSync(dirname(path), { recursive: true })
		writeFileSync(path, `${JSON.stringify(value, null, "\t")}\n`)
	}
	const files = (dir: string) => readdirSync(dir, { recursive: true }).map(String).sort()

	it("reads places from the curated files when there is no discover cache, and writes no file", () => {
		const root = mkdtempSync(join(tmpdir(), "varde-sweep-"))
		write(join(root, "data", "lock", "3405.json"), LOCK)
		write(join(root, "data", "curated", "3405-eksempelby.json"), {
			kommune: "3405",
			name: "Eksempelby",
			units: [],
		})
		const before = files(root)
		const out = runSweep(root, join(root, ".cache"), ["3405"])
		expect(files(root)).toEqual(before)
		expect(out.split("\n")[0]).toBe(SWEEP_HEADER)
		expect(out).not.toContain("Eksempelby")
		expect(out.endsWith("5 words to read.")).toBe(true)
	})

	it("says so when it has no place names", () => {
		const root = mkdtempSync(join(tmpdir(), "varde-sweep-"))
		write(join(root, "data", "lock", "3405.json"), LOCK)
		const out = runSweep(root, join(root, ".cache"), [])
		expect(out.split("\n")[1]).toBe(
			"No place names found (no discover files, no curated files), so kommune names are listed too."
		)
		expect(out).toContain(`3405 ${ID} openingHours value: Eksempelby`)
	})
})
