import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { navHoursCandidate, pageHoursCandidate } from "../../src/extract/fields/hours.ts"
import { readUnitPage } from "../../src/extract/page.ts"
import type { NavOffice } from "../../src/registers/nav.ts"

const D = "\u2013"
const page = (name: string) =>
	readFileSync(new URL(`../fixtures/pages/${name}`, import.meta.url), "utf8")
const K = "https://www.eksempel.kommune.no/helse/helsestasjon/"
const office = (hours: NavOffice["hours"]): NavOffice => ({
	enhetNr: "0399",
	name: "Nav Eksempel",
	status: "Aktiv",
	hours,
	receptions: 1,
})

describe("pageHoursCandidate", () => {
	it("formats the lines under Åpningstider into house style, quoting them as written", () => {
		expect(pageHoursCandidate(readUnitPage(page("kontakt-heading.html"), K, []))).toEqual({
			field: "openingHours",
			value: `Mandag til fredag kl. 08:00${D}15:30`,
			evidence: { kind: "quote", quotes: ["Mandag til fredag 08.00-15.30"] },
			origin: "unitPage",
		})
	})

	it("sends a time it cannot read to review, unformatted", () => {
		const html =
			"<html><body><main><h1>X</h1><h2>Åpningstider</h2><p>Mandag 08.00-25.00</p></main></body></html>"
		expect(pageHoursCandidate(readUnitPage(html, K, []))).toMatchObject({
			value: "Mandag 08.00-25.00",
			review: "a time the formatter cannot read",
		})
	})

	it("sends hours over 200 characters to review", () => {
		const long = Array.from(
			{ length: 5 },
			(_, i) => `<p>Uke ${i + 1}: mandag og onsdag 08.00-15.30</p>`
		).join("")
		const html = `<html><body><main><h1>X</h1><h2>Åpningstider</h2>${long}</main></body></html>`
		expect(pageHoursCandidate(readUnitPage(html, K, []))?.review).toBe(
			"the hours are longer than 200 characters"
		)
	})
})

describe("navHoursCandidate", () => {
	it("builds the hours from Nav's office data, as register evidence", () => {
		const c = navHoursCandidate(
			office([
				{ day: "Mandag", from: "10:00", to: "14:00", closed: false, appointmentOnly: false },
				{ day: "Tirsdag", closed: true, appointmentOnly: false },
				{ date: "2026-12-24", from: "10:00", to: "12:00", closed: false, appointmentOnly: false },
			])
		)
		expect(c).toEqual({
			field: "openingHours",
			value: `Mandag kl. 10:00${D}14:00`,
			evidence: { kind: "register", register: "nav", recordId: "0399" },
			origin: "register",
		})
	})

	it("sends appointment-only hours to review", () => {
		const c = navHoursCandidate(
			office([{ day: "Mandag", from: "10:00", to: "14:00", closed: false, appointmentOnly: true }])
		)
		expect(c?.review).toBe("Nav lists appointment-only hours")
	})

	const noted = (note: string) =>
		navHoursCandidate(
			office([
				{ day: "Mandag", from: "10:00", to: "14:00", closed: false, appointmentOnly: false, note },
			])
		)

	// Notes as Nav wrote them on the office pages fetched 18.11.2026.
	it.each([
		"Åpent for planlagt/avtalt timeavtale 9 - 15",
		"Åpent for planlagte og avtalte samtaler 09 - 15",
		"Åpent for avtalte møter kl 09.00-15.30",
		"Timeavtaler i tidsrommet 08.00-15.30.",
		"Timeavtalar 10.00-14.00,",
		"Avtalte brukarmøter 9-15",
		"Open for avtalte møter kl. 09.00 - 14:00",
		"Åpent for timeavtaler.",
		"Timeavtaler også utenom åpningstiden",
		"Timeavtaler gjennomføres etter avtale kl 9 - 15",
	])("publishes the drop-in hours when the note only names booked appointments: %s", (note) => {
		const c = noted(note)
		expect(c?.value).toBe(`Mandag kl. 10:00${D}14:00`)
		expect(c?.review).toBeUndefined()
	})

	it.each([
		"Åpent for selvbetjening 09:00-14:30",
		"Tilgang til selvbetjeningsløsningene hver dag mellom 0900 - 1500",
		"Åpent for bruk av selvhjelpsløsninger mellom kl 9-15",
		"Åpent for planlagte samtaler 08:00-15:30. Selvbetjeningssone åpen mandag – fredag 08:00-15:00",
	])("publishes the drop-in hours when the note names self-service times: %s", (note) => {
		expect(noted(note)?.review).toBeUndefined()
	})

	it.each(["-", " ", "–"])("reads a note with no word or number in it as no note: '%s'", (note) => {
		expect(noted(note)?.review).toBeUndefined()
	})

	it.each([
		"Ring først",
		"Drop-in",
		"9 - 15",
		"Åpent fra 9 - 15",
		"Åpent publikumsmottak fra 9 - 15",
		"Kun åpent for forhåndsavtalte timeavtaler 08.00-15.30.",
		"Stengt 12-13, timeavtaler 9-15",
		"Åpent pr. telefon 9-15 og avtalte timeavtaler 8-15.",
		"Kontakt oss for avtale",
		"Meld behov på automat utenfor mottak",
	])("sends any other note to review: %s", (note) => {
		expect(noted(note)?.review).toBe("Nav lists a note on the hours")
	})

	it("sends an office with more than one reception to review, with or without an appointment note", () => {
		const hours = {
			day: "Mandag",
			from: "10:00",
			to: "14:00",
			closed: false,
			appointmentOnly: false,
		}
		expect(navHoursCandidate({ ...office([hours]), receptions: 2 })?.review).toBe(
			"Nav lists more than one reception"
		)
		expect(
			navHoursCandidate({
				...office([{ ...hours, note: "Åpent for timeavtaler." }]),
				receptions: 2,
			})?.review
		).toBe("Nav lists more than one reception")
	})

	it("is undefined when Nav lists no open day", () => {
		expect(navHoursCandidate(office([]))).toBeUndefined()
	})
})
