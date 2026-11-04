import { describe, expect, it } from "vitest"
import { isNavOfficeUrl, parseNavOffice } from "../src/registers/nav.ts"

// The shape of officeNorgData on a nav.no office page (03.11.2026), with a fictional office.
function officePage(data: unknown): string {
	const next = {
		props: { pageProps: { content: { data: { officeNorgData: { _selected: "data", data } } } } },
	}
	return `<!DOCTYPE html><html lang="no"><body><main><h1>Nav Eksempel</h1></main><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(next)}</script></body></html>`
}

const office = {
	enhetNr: "0999",
	navn: "Nav Eksempel",
	status: "Aktiv",
	organisasjonsnummer: "999999970",
	beliggenhet: {
		gatenavn: "Storgata",
		husnummer: "1",
		postnummer: "2609",
		poststed: "LILLEHAMMER",
		hideLocation: false,
	},
	brukerkontakt: {
		publikumsmottak: [
			{
				besoeksadresse: {
					gatenavn: "Storgata",
					husnummer: "1",
					husbokstav: "B",
					postnummer: "2609",
					poststed: "LILLEHAMMER",
				},
				aapningstider: [
					{ dag: "Mandag", fra: "10:00", til: "14:00", stengt: "false", kunTimeavtale: "false" },
					{ dag: "Tirsdag", stengt: "false", kunTimeavtale: "true", kommentar: "Kun timeavtale" },
					{ dato: "2026-12-24", stengt: "true" },
				],
			},
		],
	},
	type: "LOKAL",
	checksum: "x",
}

describe("parseNavOffice", () => {
	it("reads the office, its visiting address and its hours", () => {
		expect(parseNavOffice(officePage(office))).toEqual({
			enhetNr: "0999",
			name: "Nav Eksempel",
			status: "Aktiv",
			orgNumber: "999999970",
			visitingAddress: "Storgata 1B, 2609 LILLEHAMMER",
			hours: [
				{ day: "Mandag", from: "10:00", to: "14:00", closed: false, appointmentOnly: false },
				{ day: "Tirsdag", closed: false, appointmentOnly: true, note: "Kun timeavtale" },
				{ date: "2026-12-24", closed: true, appointmentOnly: false },
			],
			receptions: 1,
		})
	})

	it("reads one reception given as an object, and booleans given as booleans", () => {
		const single = {
			...office,
			brukerkontakt: {
				publikumsmottak: { aapningstider: [{ dag: "Onsdag", stengt: true, kunTimeavtale: false }] },
			},
		}
		expect(parseNavOffice(officePage(single))?.hours).toEqual([
			{ day: "Onsdag", closed: true, appointmentOnly: false },
		])
	})

	it("keeps no address when Nav hides the office's location", () => {
		const hidden = { ...office, beliggenhet: { ...office.beliggenhet, hideLocation: true } }
		expect(parseNavOffice(officePage(hidden))?.visitingAddress).toBeUndefined()
	})

	it("gives nothing for a page without office data, or with broken data", () => {
		expect(parseNavOffice("<html><body><main>Kontor</main></body></html>")).toBeUndefined()
		expect(parseNavOffice('<script id="__NEXT_DATA__">{ ikke json</script>')).toBeUndefined()
		expect(parseNavOffice(officePage({ navn: "uten enhetNr" }))).toBeUndefined()
	})
})

describe("isNavOfficeUrl", () => {
	it("knows an office page from other nav.no pages", () => {
		expect(isNavOfficeUrl("https://www.nav.no/kontor/nav-lillehammer-gausdal")).toBe(true)
		expect(isNavOfficeUrl("https://www.nav.no/kontor/nav-hamar/")).toBe(true)
		expect(isNavOfficeUrl("https://www.nav.no/kontor")).toBe(false)
		expect(isNavOfficeUrl("https://www.nav.no/no/person")).toBe(false)
		expect(isNavOfficeUrl("http://www.nav.no/kontor/nav-hamar")).toBe(false)
	})
})
