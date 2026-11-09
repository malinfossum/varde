import { describe, expect, it } from "vitest"
import { lavterskelQuotes } from "../../src/extract/fields/lavterskel.ts"

describe("lavterskelQuotes", () => {
	it("collects the sentences that hold a cost or referral phrase, verbatim", () => {
		expect(
			lavterskelQuotes([
				"Eksempel helsestasjon",
				"Helsestasjonen er gratis. Du trenger ikke henvisning. Vi har vaksiner.",
				"Egenandel kr 350 per time.",
			])
		).toEqual([
			"Helsestasjonen er gratis.",
			"Du trenger ikke henvisning.",
			"Egenandel kr 350 per time.",
		])
	})

	it("collects from the whole page, once each, and skips lines over 2,000 characters", () => {
		expect(
			lavterskelQuotes([
				"Drop-in hver tirsdag.",
				"Drop-in hver tirsdag.",
				`${"Gratis. ".repeat(300)}`,
			])
		).toEqual(["Drop-in hver tirsdag."])
	})
})
