import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import {
	kommuneSites,
	kommuneSitesQuery,
	namedQuery,
	parseBrregPage,
	readBrreg,
	unitsQuery,
} from "../src/registers/brreg.ts"
import { fakeGet } from "./netHelpers.ts"

const fixture = (name: string): unknown =>
	JSON.parse(readFileSync(new URL(`./fixtures/brreg/${name}`, import.meta.url), "utf8"))

describe("parseBrregPage", () => {
	it("reads a service unit: org number, name, form, code, address, kommune, site, parent", () => {
		const page = parseBrregPage(fixture("units.json"), "underenheter")
		expect(page?.units).toEqual([
			{
				orgNumber: "999999991",
				name: "LILLEHAMMER KOMMUNE HELSESTASJON",
				orgForm: "BEDR",
				naeringskode: "86.942",
				address: "Storgata 1, 2609 LILLEHAMMER",
				kommune: "3405",
				website: "https://www.lillehammer.kommune.no/helsestasjon/",
				parent: "999999981",
				register: "underenheter",
			},
		])
		expect(page?.totalPages).toBe(1)
	})

	it("drops a sole proprietor, a closed unit and an invalid one, and keeps no phone or email", () => {
		const page = parseBrregPage(fixture("units.json"), "underenheter")
		expect(page?.skipped).toBe(3)
		const kept = JSON.stringify(page)
		for (const personal of [
			"KARI NORDMANN",
			"999999992",
			"62 00 00 00",
			"900 00 000",
			"kari.nordmann",
		]) {
			expect(kept).not.toContain(personal)
		}
	})

	it("refuses a body that is not a Brreg page", () => {
		expect(parseBrregPage({ feil: "x" }, "enheter")).toBeUndefined()
	})

	it("maps each kommune to its own site", () => {
		const page = parseBrregPage(fixture("komm.json"), "enheter")
		expect(kommuneSites(page?.units ?? [])).toEqual(
			new Map([
				["3405", "https://www.lillehammer.kommune.no/"],
				["0301", "https://www.oslo.kommune.no/"],
			])
		)
	})
})

describe("Brreg queries", () => {
	it("asks for exactly what discover needs", () => {
		expect(kommuneSitesQuery(0)).toBe(
			"https://data.brreg.no/enhetsregisteret/api/enheter?organisasjonsform=KOMM&size=100&page=0"
		)
		expect(unitsQuery("underenheter", "3405", ["88.995", "86.942"])(2)).toBe(
			"https://data.brreg.no/enhetsregisteret/api/underenheter?kommunenummer=3405&naeringskode=88.995,86.942&size=100&page=2"
		)
		expect(namedQuery("3405", "legevakt")(0)).toBe(
			"https://data.brreg.no/enhetsregisteret/api/underenheter?kommunenummer=3405&navn=legevakt&size=100&page=0"
		)
	})
})

describe("readBrreg", () => {
	const unit = (org: string) => ({
		organisasjonsnummer: org,
		navn: `EKSEMPEL ${org}`,
		organisasjonsform: { kode: "BEDR" },
	})
	const page = (orgs: string[], totalPages: number) =>
		JSON.stringify({ _embedded: { underenheter: orgs.map(unit) }, page: { totalPages } })
	const query = (p: number) => `https://data.brreg.no/x?page=${p}`

	it("reads every page", async () => {
		const get = fakeGet({
			[query(0)]: { body: page(["999999901"], 2) },
			[query(1)]: { body: page(["999999902"], 2) },
		})
		const read = await readBrreg(get, "underenheter", query)
		expect(read.complete).toBe(true)
		expect(read.units.map((u) => u.orgNumber)).toEqual(["999999901", "999999902"])
	})

	it("says so when a page is missing or is not JSON", async () => {
		const missing = await readBrreg(
			fakeGet({ [query(0)]: { body: page(["999999901"], 2) } }),
			"underenheter",
			query
		)
		expect(missing).toMatchObject({ complete: false, units: [{ orgNumber: "999999901" }] })
		const broken = await readBrreg(
			fakeGet({ [query(0)]: { body: "<html>" } }),
			"underenheter",
			query
		)
		expect(broken.complete).toBe(false)
	})

	it("is complete when a kommune has no such unit at all", async () => {
		const empty = JSON.stringify({ page: { totalPages: 0 } })
		expect(
			await readBrreg(fakeGet({ [query(0)]: { body: empty } }), "underenheter", query)
		).toEqual({
			units: [],
			complete: true,
			skipped: 0,
		})
	})
})
