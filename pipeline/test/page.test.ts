import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import type { CmsBox } from "../src/extract/cmsBoxes.ts"
import { allLines, readUnitPage } from "../src/extract/page.ts"

const page = (name: string) =>
	readFileSync(new URL(`./fixtures/pages/${name}`, import.meta.url), "utf8")
const K = "https://www.eksempel.kommune.no/helse/helsestasjon/"
const TEST_BOXES: readonly CmsBox[] = [
	{ adapter: "acos", kind: "contact", tag: "aside", className: "testboks" },
	{ adapter: "acos", kind: "hours", tag: "div", className: "testtider" },
]
// An ACOS page around the markup a test gives. (Kept per file: importing it from another test
// file would run that file's tests twice.)
const acos = (main: string) =>
	`<!DOCTYPE html><html lang="nb"><head><meta charset="utf-8"><meta name="acos-cmscontext" content="w1" /></head><body><main class="main">${main}</main></body></html>`

describe("readUnitPage", () => {
	it("marks headings with their level and keeps every other line as mainText writes it", () => {
		const p = readUnitPage(page("kontakt-heading.html"), K, [])
		expect(p.adapter).toBe("acos")
		expect(p.main.slice(0, 4)).toEqual([
			{ text: "Eksempel helsestasjon", heading: 1 },
			{ text: "Helsestasjonen er gratis, og du trenger ikke henvisning." },
			{ text: "Kontakt oss", heading: 2 },
			{ text: "Telefon:" },
		])
	})

	it("adds a box outside main to the page text, and leaves out what a visitor cannot see", () => {
		const p = readUnitPage(page("test-box.html"), K, TEST_BOXES)
		expect(p.boxes.map((b) => [b.kind, b.inMain])).toEqual([
			["contact", false],
			["hours", false],
		])
		expect(p.text).toContain("Telefon: 62 00 00 00")
		expect(p.text).toContain("Mandag 08.00-15.30")
		expect(p.text).not.toContain("900 00 000")
		expect(allLines(p)).toContain("Telefon: 62 00 00 00")
	})

	it("keeps a heading's level when its markup has line breaks inside", () => {
		const p = readUnitPage(
			acos(
				"<h1>\n  Eksempel helsestasjon\n</h1><h2>\n\tKontakt oss\n</h2><p>Telefon: 62 00 00 00</p>"
			),
			K,
			[]
		)
		expect(p.main).toEqual([
			{ text: "Eksempel helsestasjon", heading: 1 },
			{ text: "Kontakt oss", heading: 2 },
			{ text: "Telefon: 62 00 00 00" },
		])
	})

	it("never lets page text forge a heading", () => {
		// A raw NUL at the start of a block, the marker textLines puts on a heading.
		const p = readUnitPage(
			acos("<h1>Eksempel</h1><p>\u00002\u0000Kontakt</p><p>Telefon: 62 00 00 00</p>"),
			K,
			[]
		)
		expect(p.main.slice(1)).toEqual([{ text: "2Kontakt" }, { text: "Telefon: 62 00 00 00" }])
	})

	it("strips invisible characters from every line", () => {
		const p = readUnitPage(
			acos("<h1>Eksempel\u202E helsestasjon</h1><p>Telefon:\u200B 62 00 00 00</p>"),
			K,
			[]
		)
		expect(p.main).toEqual([
			{ text: "Eksempel helsestasjon", heading: 1 },
			{ text: "Telefon: 62 00 00 00" },
		])
		expect(p.text).not.toMatch(/[\u200B\u202E]/)
	})

	it("reads no box on a fallback page", () => {
		const p = readUnitPage(page("unknown.html"), K, TEST_BOXES)
		expect(p.fallback).toBe(true)
		expect(p.boxes).toEqual([])
	})
})
