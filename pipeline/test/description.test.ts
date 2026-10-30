import { describe, expect, it } from "vitest"
import { checkDraft, descriptionGate, numberInText } from "../src/gates/description.ts"

const VALUES = [
	"Rusteamet Hamar",
	"62 00 00 00",
	"Storgata 1, 2317 Hamar",
	"hverdager 08.00\u201315.30",
	"postmottak@hamar.kommune.no",
	"https://www.hamar.kommune.no/rusteamet/",
	"Egenandel kr 350 per time",
	"Hamar",
]

const NB =
	"Rusteamet Hamar gir råd om rus. Ring 62 00 00 00 hverdager 08.00\u201315.30, eller kom til Storgata 1 i Hamar."
const EN =
	"Rusteamet Hamar gives advice on substance use. Call 62 00 00 00 on weekdays 08.00\u201315.30, or visit Storgata 1 in Hamar."

describe("numberInText", () => {
	it("matches whole digit groups only", () => {
		expect(numberInText("08.00", "hverdager 08.00-15.30")).toBe(true)
		expect(numberInText("9", "hverdager 09.00-15.30")).toBe(false)
		expect(numberInText("62000000", "62 00 00 00")).toBe(true)
	})

	it("rejects a glued partial of a phone number", () => {
		expect(numberInText("6200", "62 00 00 00")).toBe(false)
	})
})

describe("description gate", () => {
	it("passes drafts whose every fact is in the lock file", () => {
		expect(descriptionGate({ nb: NB, en: EN }, VALUES)).toEqual({ pass: true, unmatched: [] })
	})

	it("rejects a phone number that is not in the lock file", () => {
		const nb = NB.replace("62 00 00 00", "62 99 99 99")
		expect(descriptionGate({ nb, en: EN }, VALUES).pass).toBe(false)
	})

	it("rejects an English draft that rewrites a time", () => {
		const en = EN.replace("08.00", "8:00")
		expect(checkDraft(en, VALUES)).toContain("8:00")
	})

	it("rejects a price the lock file does not have", () => {
		expect(checkDraft("Det koster kr 200 per time.", VALUES)).toContain("200")
	})

	it("rejects a name the lock file does not have", () => {
		expect(checkDraft("Tilbudet drives sammen med Blå Kors.", VALUES)).toEqual(["Blå", "Kors"])
	})

	it("rejects a link or email the lock file does not have", () => {
		expect(checkDraft("Skriv til kari.nordmann@hamar.kommune.no.", VALUES)).toHaveLength(1)
		expect(checkDraft("Se www.example.no for mer.", VALUES)).toHaveLength(1)
		expect(checkDraft("Skriv til postmottak@hamar.kommune.no.", VALUES)).toEqual([])
	})

	it("rejects a name that only matches the start of a longer word", () => {
		expect(checkDraft("Tilbudet ligger i Ham sentrum.", VALUES)).toEqual(["Ham"])
		expect(checkDraft("Kom til Stor og ring oss.", VALUES)).toEqual(["Stor"])
		expect(checkDraft("Kom til Storgata i Hamar.", VALUES)).toEqual([])
	})

	it("lets weekday and month names through", () => {
		expect(checkDraft("Open Monday to Friday, closed in July.", VALUES)).toEqual([])
	})

	it("rejects a number glued from part of a phone number", () => {
		expect(checkDraft("Det koster 6200 kr.", VALUES)).toEqual(["6200"])
		expect(checkDraft("Kode 0000 brukes.", VALUES)).toEqual(["0000"])
	})
})
