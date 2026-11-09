import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
	addressQuery,
	findAddress,
	parseAddressSearch,
	pickAddress,
} from "../src/registers/kartverket.ts"
import { splitAddress } from "../src/text/address.ts"
import { fakeGet } from "./netHelpers.ts"

const record = (adresseid: string, adressetekst = "Storgata 1", postnummer = "2609") => ({
	adressetekst,
	adresseid,
	kommunenummer: "3405",
	kommunenavn: "LILLEHAMMER",
	postnummer,
	poststed: "LILLEHAMMER",
})
const search = (...adresser: ReturnType<typeof record>[]) => ({
	metadata: { totaltAntallTreff: adresser.length },
	adresser,
})
const records = (...adresser: ReturnType<typeof record>[]) =>
	parseAddressSearch(search(...adresser)) ?? []

const radhus = JSON.parse(
	readFileSync(new URL("./fixtures/kartverket/radhus.json", import.meta.url), "utf8")
)

describe("pickAddress: a house letter", () => {
	it("matches the recorded rådhus answer, with a space before the letter or without", () => {
		const r = radhus.adresser[0]
		const spaced = String(r.adressetekst).replace(/(\d)(\p{L})$/u, "$1 $2")
		const hit = pickAddress(records(r), `${spaced}, ${r.postnummer} ${r.poststed}`)
		expect(hit).toEqual({ addressId: r.adresseid, kommune: r.kommunenummer, text: r.adressetekst })
	})

	it("reads Storgata 1 A as Storgata 1A, and gives Kartverket's text", () => {
		const hit = pickAddress(records(record("a1", "Storgata 1A")), "Storgata 1 A, 2609 Lillehammer")
		expect(hit).toEqual({ addressId: "a1", kommune: "3405", text: "Storgata 1A" })
	})

	it("never reads Storgata 1 as Storgata 1A, nor Storgata 1 og 2 as a letter", () => {
		expect(
			pickAddress(records(record("a1", "Storgata 1A")), "Storgata 1, 2609 Lillehammer")
		).toBeUndefined()
		expect(
			pickAddress(records(record("a1", "Storgata 1A")), "Storgata 1 og 2, 2609 Lillehammer")
		).toBeUndefined()
	})
})

describe("splitAddress", () => {
	it("takes the street before the first comma and the postcode after it", () => {
		expect(splitAddress("Storgata 1, 2. etasje, 2609 LILLEHAMMER")).toEqual({
			street: "storgata 1",
			postcode: "2609",
		})
		expect(splitAddress("Storgata 1")).toEqual({ street: "storgata 1" })
		expect(splitAddress("Rådhuset, 2609 Lillehammer")).toBeUndefined()
	})
})

describe("Kartverket address search", () => {
	it("builds the search URL", () => {
		expect(addressQuery("Storgata 1", "3405")).toBe(
			"https://api.kartverket.no/adresser/v1/sok?sok=Storgata+1&kommunenummer=3405&treffPerSide=10"
		)
	})

	it("accepts exactly one address", () => {
		expect(pickAddress(records(record("100000001")), "Storgata 1, 2609 Lillehammer")).toEqual({
			addressId: "100000001",
			kommune: "3405",
			text: "Storgata 1",
		})
	})

	it("refuses two different addresses for the same text, and a wrong postcode", () => {
		const two = records(record("100000001"), record("100000002"))
		expect(pickAddress(two, "Storgata 1, 2609 Lillehammer")).toBeUndefined()
		expect(
			pickAddress(records(record("100000001")), "Storgata 1, 2615 Lillehammer")
		).toBeUndefined()
	})

	it("refuses a body that is not a search result", () => {
		expect(parseAddressSearch({ feil: "x" })).toBeUndefined()
	})

	it("looks an address up through get()", async () => {
		const get = fakeGet({
			[addressQuery("storgata 1", "3405")]: { body: JSON.stringify(search(record("100000001"))) },
		})
		expect(await findAddress(get, "Storgata 1, 2609 Lillehammer", "3405")).toEqual({
			addressId: "100000001",
			kommune: "3405",
			text: "Storgata 1",
		})
	})
})
