import { describe, expect, it } from "vitest"
import { findRoleWord } from "../src/extract/roleWords.ts"
import { capitalisedRuns, midSentenceWords, possibleNames } from "../src/text/names.ts"

// "Gran" is a KLASS kommune name that is also a surname, which is why it is here.
const ctx = {
	unitName: "Eksempel helsestasjon",
	places: ["Lillehammer", "Nord-Odal", "Oslo", "Gran"],
}

describe("possibleNames", () => {
	it("finds a name, a three-part name and a hyphenated name as whole runs", () => {
		expect(possibleNames("Kari Nordmann treffes her.", ctx)).toEqual(["Kari Nordmann"])
		// "Ring" is a label word, so it ends the run and is no part of the name.
		expect(possibleNames("Ring Kari Anne Nordmann i dag.", ctx)).toEqual(["Kari Anne Nordmann"])
		expect(possibleNames("Kontakt Anne-Marie Nordmann.", ctx)).toEqual(["Anne-Marie Nordmann"])
	})

	it("leaves out role words, label words, places, days, months and the unit's own name", () => {
		const line = "Telefon: Avdelingsleder Eksempel Helsestasjon Lillehammer Nord-Odal Mandag Januar"
		expect(possibleNames(line, ctx)).toEqual([])
	})

	it("keeps a run whole when one word in it may be a name, so no part of a name is stored", () => {
		expect(possibleNames("Kari Mandag Nordmann", ctx)).toEqual(["Kari Mandag Nordmann"])
		expect(possibleNames("Kontakt Kari Gran i dag", ctx)).toEqual(["Kari Gran"])
	})

	it("reads Tor, Mai and August as given names when they are capitalised", () => {
		expect(possibleNames("Tor Nordmann svarer", ctx)).toEqual(["Tor Nordmann"])
		expect(possibleNames("Ring Tor på telefon", ctx)).toEqual(["Tor"])
		expect(possibleNames("Kontakt August Nordmann", ctx)).toEqual(["August Nordmann"])
	})

	it("exempts a word of the unit's name only beside another one", () => {
		const own = { unitName: "Kari Nordmann psykologtjeneste", places: [] }
		expect(possibleNames("Ring Kari på telefon", own)).toEqual(["Kari"])
		expect(possibleNames("Eksempel Helsestasjon har drop-in", ctx)).toEqual([])
	})

	it("reads label words in their definite form, with -nummer, and day ranges with a hyphen", () => {
		for (const line of [
			"Telefonnummer: 62 00 00 00",
			"Sentralbordet 62 00 00 00",
			"Servicetorget",
			"Åpningstid: hverdager",
			"Mandag-fredag 08.00-15.30",
			"Man-fre 08.00-15.30",
		]) {
			expect(possibleNames(line, ctx), line).toEqual([])
		}
		expect(possibleNames("Tor-Erik svarer", ctx)).toEqual(["Tor-Erik"])
	})

	it("redacts too much on purpose: any other capitalised word counts", () => {
		expect(possibleNames("Tilbudet er gratis.", ctx)).toEqual(["Tilbudet"])
	})

	it("finishes on a 1 MB line well within a second", () => {
		const line = "Aa ".repeat(350_000)
		const started = performance.now()
		possibleNames(line, ctx)
		expect(performance.now() - started).toBeLessThan(1000)
	})
})

describe("capitalisedRuns", () => {
	it("finds two or more capitalised words that are not days, months, labels or roles", () => {
		expect(capitalisedRuns("Mandag kl. 10:00\u201312:00 hos Kari Nordmann")).toEqual([
			"Kari Nordmann",
		])
		expect(capitalisedRuns("Hverdager kl. 09:00\u201315:00")).toEqual([])
		expect(capitalisedRuns("Mandag Tirsdag kl. 10:00\u201312:00")).toEqual([])
		expect(capitalisedRuns("Mandag kl. 10:00\u201312:00 hos Tor Nordmann")).toEqual([
			"Tor Nordmann",
		])
	})
})

describe("midSentenceWords", () => {
	it("gives the capitalised words that do not open a sentence", () => {
		expect(midSentenceWords("Åpent hos Kari mandag kl. 10:00")).toEqual(["Kari"])
		expect(midSentenceWords("Helsestasjonen er åpen. Mandag kl. 10:00")).toEqual([])
		expect(midSentenceWords("Åpningstider: Mandag kl. 10:00")).toEqual([])
	})
})

describe("findRoleWord", () => {
	it("finds a role word as written, and labels it as Varde shows it", () => {
		expect(findRoleWord("Avdelingsleder: 900 00 000")).toEqual({
			label: "Avdelingsleder",
			quote: "Avdelingsleder",
		})
		expect(findRoleWord("kontakt daglig leder på 900 00 000")).toEqual({
			label: "Daglig leder",
			quote: "daglig leder",
		})
	})

	it("needs the whole word", () => {
		expect(findRoleWord("Avdelingslederen sitt kontor")).toBeUndefined()
		expect(findRoleWord("Telefon 62 00 00 00")).toBeUndefined()
	})
})
