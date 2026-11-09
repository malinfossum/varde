import { describe, expect, it } from "vitest"
import { findPhones, isMobileDigits } from "../src/text/phone.ts"

const texts = (line: string) => findPhones(line).map((h) => h.text)

describe("findPhones", () => {
	it("finds the shapes Norwegian pages write", () => {
		expect(texts("Telefon: 62 00 00 00")).toEqual(["62 00 00 00"])
		expect(texts("Mobil 900 00 000")).toEqual(["900 00 000"])
		expect(texts("Ring 62000000 i dag")).toEqual(["62000000"])
		expect(texts("Tlf. 6200 0000")).toEqual(["6200 0000"])
		expect(texts("Fra utlandet: +47 62 00 00 00")).toEqual(["+47 62 00 00 00"])
		expect(texts("Ring 113 ved fare")).toEqual(["113"])
		expect(texts("Hjelpetelefon 116 123")).toEqual(["116 123"])
	})

	it("marks a short number, so the phone rule can ask for a label beside it", () => {
		const shape = (line: string) => findPhones(line).map((h) => [h.text, h.short])
		expect(shape("Ring 113 ved fare")).toEqual([["113", true]])
		expect(shape("Storgata 110, 2317 Hamar")).toEqual([["110", true]])
		expect(shape("Telefon: 62 00 00 00")).toEqual([["62 00 00 00", false]])
		expect(shape("Telefon 62.00.00.00")).toEqual([["62.00.00.00", false]])
	})

	it("finds dot-grouped numbers in the two shapes no time or date has", () => {
		expect(texts("Telefon 62.00.00.00")).toEqual(["62.00.00.00"])
		expect(texts("Telefon 620.00.000")).toEqual(["620.00.000"])
		expect(findPhones("Telefon 62.00.00.00")[0]?.digits).toBe("62000000")
	})

	it("never reads a dotted run outside the Nkom plan as a number", () => {
		expect(texts("Ref. 12.34.56.78")).toEqual([])
	})

	it("never reads a time, a date, a postcode or a post box as a number", () => {
		expect(texts("Åpent 08.00-15.30")).toEqual([])
		expect(texts("Stengt 27.10.2026")).toEqual([])
		expect(texts("Storgata 1, 2317 Hamar")).toEqual([])
		expect(texts("Klokka 08:00:00")).toEqual([])
		expect(texts("Postboks 4000 2306 Hamar")).toEqual([])
		expect(texts("Pb. 4000 2306 Hamar")).toEqual([])
		expect(texts("Tlf. 6200 0000 Hamar")).toEqual(["6200 0000"])
	})

	it("finds the number after a postcode in the same run of digits", () => {
		expect(texts("2317 62 00 00 00")).toEqual(["62 00 00 00"])
	})

	it("cuts a run before its first dotted group, so an opening time never hides the number", () => {
		expect(texts("Telefon 62 00 00 00 08.00-15.30")).toEqual(["62 00 00 00"])
		expect(texts("Telefon 62.00.00.00 08.00-15.30")).toEqual(["62.00.00.00"])
		// The time is not the last group of a number: the run stops before "08.00".
		expect(texts("Tid 62 00 00 08.00-15.30")).toEqual([])
	})

	it("finds two numbers on one line, in order", () => {
		expect(texts("Telefon 62 00 00 00, faks 62 00 00 01")).toEqual(["62 00 00 00", "62 00 00 01"])
	})

	it("reads a line of 1,999 characters fast, and skips one over 2,000", () => {
		// Under the cap, so the patterns themselves run (a 1 MB line would stop at the cap).
		for (const near of [
			`${"1.".repeat(999)}1`,
			`${"1 ".repeat(999)}1`,
			`${"+47 ".repeat(499)}123`,
		]) {
			const started = performance.now()
			findPhones(near)
			expect(performance.now() - started).toBeLessThan(1000)
		}
		expect(texts(`${"x".repeat(1970)} Telefon 62 00 00 00`)).toEqual(["62 00 00 00"])
		expect(texts(`${"x".repeat(1990)} Telefon 62 00 00 00`)).toEqual([])
	})
})

describe("isMobileDigits", () => {
	it("knows a mobile by its first digit 4 or 9 and eight digits", () => {
		expect(isMobileDigits("90000000")).toBe(true)
		expect(isMobileDigits("40000000")).toBe(true)
		expect(isMobileDigits("62000000")).toBe(false)
		expect(isMobileDigits("900")).toBe(false)
	})
})
