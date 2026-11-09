import { describe, expect, it } from "vitest"
import { addressCandidates } from "../../src/extract/fields/address.ts"

const block = (...lines: string[]) => [{ source: "heading" as const, lines }]
const values = (...lines: string[]) => addressCandidates(block(...lines)).map((c) => c.value)

describe("addressCandidates", () => {
	it("takes a line with a street and a four-digit postcode, without its label", () => {
		expect(addressCandidates(block("Besøksadresse: Storgata 1, 2609 Lillehammer"))).toEqual([
			{
				field: "address",
				value: "Storgata 1, 2609 Lillehammer",
				evidence: { kind: "quote", quotes: ["Besøksadresse: Storgata 1, 2609 Lillehammer"] },
				origin: "unitContact",
				block: 0,
			},
		])
	})

	it("joins a street line and a postcode line", () => {
		expect(addressCandidates(block("Storgata 1 A", "2609 Lillehammer"))).toMatchObject([
			{
				value: "Storgata 1 A, 2609 Lillehammer",
				evidence: { quotes: ["Storgata 1 A", "2609 Lillehammer"] },
			},
		])
	})

	it("lets Besøksadresse win over Postadresse, and never takes a Postboks", () => {
		expect(
			values(
				"Postadresse: Kirkegata 2, 2609 Lillehammer",
				"Besøksadresse: Storgata 1, 2609 Lillehammer"
			)
		).toEqual(["Storgata 1, 2609 Lillehammer"])
		expect(values("Postboks 1, 2601 Lillehammer")).toEqual([])
		expect(
			values("Postadresse: Postboks 1, 2601 Lillehammer", "Storgata 1, 2609 Lillehammer")
		).toEqual(["Storgata 1, 2609 Lillehammer"])
	})

	it("takes nothing without a postcode, and nothing from a bare postcode line", () => {
		expect(values("Storgata 1")).toEqual([])
		expect(values("2609 Lillehammer")).toEqual([])
	})

	it("never builds an address from a line that holds a phone number or a role word", () => {
		expect(values("Kari Nordmann 900 00 000", "2609 Lillehammer")).toEqual([])
		expect(values("Telefon 62 00 00 00", "2609 Lillehammer")).toEqual([])
		expect(values("Kari Nordmann 900 00 000, 2609 Lillehammer")).toEqual([])
		expect(values("Avdelingsleder rom 12", "2609 Lillehammer")).toEqual([])
	})
})
