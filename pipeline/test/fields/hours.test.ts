import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { navHoursCandidate, pageHoursCandidate } from "../../src/extract/fields/hours.ts"
import { readUnitPage } from "../../src/extract/page.ts"
import type { NavOffice } from "../../src/registers/nav.ts"

const D = "–"
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

	it("sends hours with a note, or an office with more than one reception, to review", () => {
		const noted = navHoursCandidate(
			office([
				{
					day: "Mandag",
					from: "10:00",
					to: "14:00",
					closed: false,
					appointmentOnly: false,
					note: "Ring først",
				},
			])
		)
		expect(noted?.review).toBe("Nav lists a note on the hours")
		const two = navHoursCandidate({
			...office([
				{ day: "Mandag", from: "10:00", to: "14:00", closed: false, appointmentOnly: false },
			]),
			receptions: 2,
		})
		expect(two?.review).toBe("Nav lists more than one reception")
	})

	it("is undefined when Nav lists no open day", () => {
		expect(navHoursCandidate(office([]))).toBeUndefined()
	})
})
