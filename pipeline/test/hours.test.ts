import { describe, expect, it } from "vitest"
import { formatHours, hasTime, hoursGrounded, hoursLength } from "../src/text/hours.ts"

const D = "\u2013"
const ok = (text: string) => ({ ok: true, text })

describe("formatHours: each input style and its house style", () => {
	const table: [string, string][] = [
		["13.00-18.00", `kl. 13:00${D}18:00`],
		["Mandag 13-18", `Mandag kl. 13:00${D}18:00`],
		["kl 13.00 - 18.00", `kl. 13:00${D}18:00`],
		["Hverdager 08.00 til 15.30", `Hverdager kl. 08:00${D}15:30`],
		["Kveld og natt 15.00-08.00", `Kveld og natt kl. 15:00${D}08:00`],
		["Fra kl 08.00", "Fra kl. 08:00"],
		["Mandag 08-15.30", `Mandag kl. 08:00${D}15:30`],
		["  Tirsdag   10.00\u201312.00 ", `Tirsdag kl. 10:00${D}12:00`],
		["Åpent til 24.00", "Åpent til 24:00"],
		["Mandag-fredag 8-16", `Mandag-fredag kl. 08:00${D}16:00`],
		// An age range is no time, even on a line with a day name; the opening hours after it are.
		["For ungdom 13-20 år, tirsdag 14-17", `For ungdom 13-20 år, tirsdag kl. 14:00${D}17:00`],
	]
	for (const [input, output] of table) {
		it(`${input.trim()} becomes ${output}`, () => expect(formatHours(input)).toEqual(ok(output)))
	}

	it("leaves hours already in house style unchanged, so a second run changes nothing", () => {
		const done = `Mandag kl. 08:00${D}15:30, fredag kl. 10:00${D}12:00`
		expect(formatHours(done)).toEqual(ok(done))
		const once = formatHours("Mandag 08.00-15.30")
		expect(once.ok && formatHours(once.text)).toEqual(once)
	})

	it("keeps day names, other words, dates and phone numbers as the page wrote them", () => {
		expect(formatHours("Stengt 27.10.2026")).toEqual(ok("Stengt 27.10.2026"))
		expect(formatHours("Tlf 61.13.20.00")).toEqual(ok("Tlf 61.13.20.00"))
		expect(formatHours("1-2 ganger i uka")).toEqual(ok("1-2 ganger i uka"))
		expect(formatHours("Helsestasjon 0 til 5 år")).toEqual(ok("Helsestasjon 0 til 5 år"))
		// A day name on the line no longer makes every bare range a time: only one right after it.
		expect(formatHours("Mandag: samtale 1-2 ganger i uka")).toEqual(
			ok("Mandag: samtale 1-2 ganger i uka")
		)
		expect(formatHours("Tirsdag, barn 0-5 år")).toEqual(ok("Tirsdag, barn 0-5 år"))
		expect(formatHours("Mandag: gruppe for 8-10 klasse")).toEqual(
			ok("Mandag: gruppe for 8-10 klasse")
		)
	})

	it("refuses a time it cannot read, rather than storing it half tidied", () => {
		for (const bad of ["Åpent 25.00", "Åpent 13.75", "Mandag 08.00-24.30"]) {
			expect(formatHours(bad)).toEqual({ ok: false, reason: "a time the formatter cannot read" })
		}
	})

	it("refuses a date without its year, which reads like a time", () => {
		// Months run 01 to 12 and quarter hours are 00, 15, 30 and 45, so a dotted pair without
		// "kl" whose second part is no quarter hour may be a date: review, never a time.
		for (const bad of ["Stengt 17.05", "Påske 14.04-17.04", "Stengt 24.12"]) {
			expect(formatHours(bad), bad).toEqual({
				ok: false,
				reason: "a time the formatter cannot read",
			})
		}
		expect(formatHours("kl. 08.10")).toEqual(ok("kl. 08:10"))
	})

	it("reads a line of 1,999 characters fast, and refuses one over 2,000", () => {
		// Under the cap, so the pattern itself runs (a 1 MB line would stop at the cap).
		const started = performance.now()
		formatHours("1.1-".repeat(499).concat("1.1"))
		expect(performance.now() - started).toBeLessThan(1000)
		expect(formatHours(`Mandag 08.00-15.30 ${"x".repeat(1990)}`).ok).toBe(false)
	})
})

describe("hasTime", () => {
	it("sees a time or a range, not a bare count", () => {
		expect(hasTime("kl. 08:00")).toBe(true)
		expect(hasTime("Mandag 13-18")).toBe(true)
		expect(hasTime("1-2 ganger i uka")).toBe(false)
	})
})

describe("hoursGrounded", () => {
	it("grounds a formatted value in its raw quote", () => {
		expect(hoursGrounded(`Hverdager kl. 08:00${D}15:30`, ["Hverdager 08.00-15.30"])).toBe(true)
		expect(hoursGrounded(`kl. 08:00${D}15:30`, ["Telefon 62 00 00 00 (08.00-15.30)"])).toBe(true)
	})

	it("refuses a time or a word the quote does not hold", () => {
		expect(hoursGrounded(`Hverdager kl. 08:00${D}16:00`, ["Hverdager 08.00-15.30"])).toBe(false)
		expect(hoursGrounded(`Helger kl. 08:00${D}15:30`, ["Hverdager 08.00-15.30"])).toBe(false)
		expect(hoursGrounded(`kl. 08:00${D}15:30`, ["Åpent 25.00-15.30"])).toBe(false)
	})

	it("grounds the raw text of hours the formatter could not read, so the rule's review reaches me", () => {
		expect(hoursGrounded("Åpent 25.00", ["Åpent 25.00"])).toBe(true)
		expect(
			hoursGrounded("Stengt 17.05, Mandag 08.00-15.30", ["Stengt 17.05", "Mandag 08.00-15.30"])
		).toBe(true)
	})

	it("needs the times in the order the quotes give them, so two days cannot swap hours", () => {
		const quote = "Mandag 08.00-15.30, fredag 10.00-12.00"
		expect(hoursGrounded(`Mandag kl. 08:00${D}15:30, fredag kl. 10:00${D}12:00`, [quote])).toBe(
			true
		)
		expect(hoursGrounded(`Mandag kl. 10:00${D}12:00, fredag kl. 08:00${D}15:30`, [quote])).toBe(
			false
		)
	})
})

describe("hoursLength", () => {
	it("counts code points, not UTF-16 units", () => {
		expect(hoursLength("Åpent \u{1F600}")).toBe(7)
	})
})
