import { describe, expect, it } from "vitest"
import { PLACE_MISMATCH, placePart } from "../src/text/address.ts"
import { kartverketForm } from "../src/verify/context.ts"

const mismatch = { review: PLACE_MISMATCH }

describe("placePart", () => {
	it("keeps the postcode and the poststed in the page's own spelling", () => {
		expect(placePart("Storgata 3, 2999 Eksempelby", "2999", "EKSEMPELBY")).toEqual({
			place: ", 2999 Eksempelby",
		})
		expect(placePart("Storgata 3, 2999 EKSEMPELBY", "2999", "EKSEMPELBY")).toEqual({
			place: ", 2999 EKSEMPELBY",
		})
	})

	it("cuts a trailing name", () => {
		expect(placePart("Storgata 3, 2999 Eksempelby Kari Nordmann", "2999", "EKSEMPELBY")).toEqual({
			place: ", 2999 Eksempelby",
		})
		expect(placePart("Storgata 3, 2999 Eksempelby, Kari Nordmann", "2999", "EKSEMPELBY")).toEqual({
			place: ", 2999 Eksempelby",
		})
	})

	it("cuts a trailing Telefon, and the full stop after the poststed", () => {
		expect(placePart("Storgata 3, 2999 Eksempelby Telefon", "2999", "EKSEMPELBY")).toEqual({
			place: ", 2999 Eksempelby",
		})
		expect(
			placePart("Storgata 3, 2999 Eksempelby. Telefon 62 00 00 00", "2999", "EKSEMPELBY")
		).toEqual({ place: ", 2999 Eksempelby" })
	})

	it("reads a poststed of two words, with any spacing between the words", () => {
		const two = "NORDRE EKSEMPELBY"
		expect(placePart("Storgata 3, 2999 Nordre Eksempelby Kari Nordmann", "2999", two)).toEqual({
			place: ", 2999 Nordre Eksempelby",
		})
		expect(placePart("Storgata 3,  2999 Nordre  Eksempelby", "2999", two)).toEqual({
			place: ", 2999 Nordre Eksempelby",
		})
	})

	it("sends a hyphenated spelling of a two-word poststed to review", () => {
		expect(placePart("Storgata 3, 2999 Nordre-Eksempelby", "2999", "NORDRE EKSEMPELBY")).toEqual(
			mismatch
		)
	})

	it("sends a different postcode, a different place or a longer word to review", () => {
		expect(placePart("Storgata 3, 2998 Eksempelby", "2999", "EKSEMPELBY")).toEqual(mismatch)
		expect(placePart("Storgata 3, 2999 Annenby", "2999", "EKSEMPELBY")).toEqual(mismatch)
		expect(placePart("Storgata 3, 2999 Eksempelbyen", "2999", "EKSEMPELBY")).toEqual(mismatch)
		expect(placePart("Storgata 3, 2999", "2999", "EKSEMPELBY")).toEqual(mismatch)
		expect(placePart("Storgata 3, Eksempelby", "2999", "EKSEMPELBY")).toEqual(mismatch)
	})

	it("sends a floor line before the postcode to review", () => {
		expect(placePart("Storgata 3, 2. etasje, 2999 Eksempelby", "2999", "EKSEMPELBY")).toEqual(
			mismatch
		)
	})

	it("sends an answer with no poststed or no postcode to review", () => {
		expect(placePart("Storgata 3, 2999 Eksempelby", "2999", undefined)).toEqual(mismatch)
		expect(placePart("Storgata 3, 2999 Eksempelby", undefined, "EKSEMPELBY")).toEqual(mismatch)
	})

	it("has nothing to keep when the value has no comma", () => {
		expect(placePart("Storgata 3", "2999", "EKSEMPELBY")).toBeUndefined()
	})
})

describe("kartverketForm", () => {
	const hit = {
		addressId: "a3",
		kommune: "3405",
		text: "Storgata 3",
		postcode: "2999",
		poststed: "EKSEMPELBY",
	}

	it("stores Kartverket's street text and the place part it confirms", () => {
		expect(kartverketForm("Storgata 3, 2999 Eksempelby Kari Nordmann", hit)).toEqual({
			value: "Storgata 3, 2999 Eksempelby",
		})
	})

	it("stores the street text alone, with the review reason, when the place is not Kartverket's", () => {
		expect(
			kartverketForm("Storgata 3, 2999 Nordre-Eksempelby", {
				...hit,
				poststed: "NORDRE EKSEMPELBY",
			})
		).toEqual({ value: "Storgata 3", review: PLACE_MISMATCH })
		const noPoststed = { addressId: "a3", kommune: "3405", text: "Storgata 3", postcode: "2999" }
		expect(kartverketForm("Storgata 3, 2999 Eksempelby Kari Nordmann", noPoststed)).toEqual({
			value: "Storgata 3",
			review: PLACE_MISMATCH,
		})
	})

	it("stores the street text alone for a value with no comma", () => {
		expect(kartverketForm("Storgata 3", hit)).toEqual({ value: "Storgata 3" })
	})

	it("keeps the value when the hit has no street text", () => {
		expect(
			kartverketForm("Storgata 3, 2999 Eksempelby", { addressId: "a3", kommune: "3405" })
		).toEqual({ value: "Storgata 3, 2999 Eksempelby" })
	})
})
