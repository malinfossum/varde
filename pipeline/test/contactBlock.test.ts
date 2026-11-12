import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { CMS_BOXES, type CmsBox } from "../src/extract/cmsBoxes.ts"
import { contactBlocks, hoursLines } from "../src/extract/contactBlock.ts"
import { readUnitPage } from "../src/extract/page.ts"

const page = (name: string) =>
	readFileSync(new URL(`./fixtures/pages/${name}`, import.meta.url), "utf8")
const K = "https://www.eksempel.kommune.no/helse/helsestasjon/"
const TEST_BOXES: readonly CmsBox[] = [
	{ adapter: "acos", kind: "contact", tag: "aside", className: "testboks" },
	{ adapter: "acos", kind: "hours", tag: "div", className: "testtider" },
]
const acos = (main: string) =>
	`<!DOCTYPE html><html lang="nb"><head><meta charset="utf-8"><meta name="acos-cmscontext" content="w1" /></head><body><main class="main">${main}</main></body></html>`

describe("contactBlocks", () => {
	it("takes the lines under a Kontakt heading until the next heading, named by the heading above it", () => {
		const blocks = contactBlocks(readUnitPage(page("kontakt-heading.html"), K, []))
		expect(blocks).toEqual([
			{
				source: "heading",
				heading: "Eksempel helsestasjon",
				lines: ["Telefon:", "62 00 00 00", "E-post: helsestasjon@eksempel.kommune.no"],
			},
		])
	})

	it("takes a CMS contact box first", () => {
		const blocks = contactBlocks(readUnitPage(page("test-box.html"), K, TEST_BOXES))
		expect(blocks[0]).toEqual({ source: "cms", lines: ["Kontakt oss", "Telefon: 62 00 00 00"] })
	})

	it("gives each block of a shared page the heading that names its service", () => {
		const blocks = contactBlocks(readUnitPage(page("shared-page.html"), K, []))
		expect(blocks.map((b) => [b.heading, b.lines])).toEqual([
			["Eksempel helsestasjon sentrum", ["Telefon: 62 00 00 01"]],
			["Eksempel helsestasjon nord", ["Telefon: 62 00 00 02"]],
			["Eksempel helsestasjon sør", ["Telefon: 62 00 00 03"]],
		])
	})

	it("keeps the lines under a deeper heading, and is named by the nearest higher heading", () => {
		const html = acos(
			"<h1>Eksempel helsestasjon</h1><h2>Om tjenesten</h2><p>Vi har drop-in.</p>" +
				"<h2>Kontakt</h2><h3>Telefon</h3><p>62 00 00 00</p><h3>Besøksadresse</h3><p>Storgata 1, 2609 Lillehammer</p>" +
				"<h2>Les mer</h2><p>Vaksiner for barn.</p>"
		)
		expect(contactBlocks(readUnitPage(html, K, []))).toEqual([
			{
				source: "heading",
				heading: "Eksempel helsestasjon",
				lines: ["Telefon", "62 00 00 00", "Besøksadresse", "Storgata 1, 2609 Lillehammer"],
			},
		])
	})

	it("finds a heading block on a fallback page too", () => {
		const html =
			"<html><body><main><h1>Eksempel</h1><h2>Kontaktinformasjon:</h2><p>Tlf 62 00 00 00</p></main></body></html>"
		const blocks = contactBlocks(readUnitPage(html, K, []))
		expect(blocks).toEqual([{ source: "heading", heading: "Eksempel", lines: ["Tlf 62 00 00 00"] }])
	})
})

describe("hoursLines", () => {
	it("takes the CMS hours box first, then the lines under an Åpningstider heading", () => {
		expect(hoursLines(readUnitPage(page("test-box.html"), K, TEST_BOXES))).toEqual({
			source: "cms",
			lines: ["Mandag 08.00-15.30"],
		})
		expect(hoursLines(readUnitPage(page("kontakt-heading.html"), K, []))).toEqual({
			source: "heading",
			lines: ["Mandag til fredag 08.00-15.30"],
		})
	})

	it("is undefined when the page has neither", () => {
		expect(hoursLines(readUnitPage(page("shared-page.html"), K, []))).toBeUndefined()
	})
})

describe("the recorded CMS boxes", () => {
	it("finds every recorded box in its fixture", () => {
		for (const box of CMS_BOXES) {
			const p = readUnitPage(page(`${box.adapter}-${box.kind}-box.html`), K)
			if (box.kind === "contact") expect(contactBlocks(p)[0]?.source, box.adapter).toBe("cms")
			else expect(hoursLines(p)?.source, box.adapter).toBe("cms")
		}
	})
})
