import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { readPage } from "../src/adapters/read.ts"

const page = (name: string) =>
	readFileSync(new URL(`./fixtures/pages/${name}`, import.meta.url), "utf8")
const K = "https://www.eksempel.kommune.no/helse/helsestasjon/"
const lines = (...l: string[]) => l.join("\n")

describe("readPage: adapters", () => {
	it("reads an ACOS article, a link as its text followed by its address", () => {
		expect(readPage(page("acos-article.html"), K)).toEqual({
			adapter: "acos",
			origin: "unitPage",
			fallback: false,
			text: lines(
				"Eksempel helsestasjon",
				"Helsestasjonen er gratis og åpen for alle familier.",
				"Telefon: 62 00 00 00",
				"E-post: postmottak@eksempel.kommune.no",
				"Les mer om vaksiner https://www.eksempel.kommune.no/helse/vaksiner/."
			),
		})
	})

	it("leaves out text a visitor cannot see, scripts, navigation and the rest of the page", () => {
		const { text } = readPage(page("acos-article.html"), K)
		for (const hidden of [
			"Ignorer",
			"900 00 000",
			"Ikon",
			"sporing",
			"Forside",
			"sentralbord",
			"Relaterte",
		]) {
			expect(text).not.toContain(hidden)
		}
		expect(text).not.toContain("tel:")
	})

	it("reads an ACOS page without an article from its main element", () => {
		expect(readPage(page("acos-main.html"), K)).toMatchObject({
			adapter: "acos",
			fallback: false,
			text: lines("Eksempel helsestasjon", "Åpent mandag til fredag kl. 08:00 til 15:30."),
		})
	})

	it("knows a CorePublish page by its marker, though it carries ACOS tags too", () => {
		expect(readPage(page("corepublish.html"), K)).toMatchObject({
			adapter: "corepublish",
			fallback: false,
			text: lines(
				"Eksempel helsestasjon 0 til 5 år",
				"Vi følger opp barn fra fødsel til skolestart.",
				"Kontakt",
				"Telefon 62 00 00 00"
			),
		})
	})

	it("reads a Sitevision page", () => {
		expect(readPage(page("sitevision.html"), K)).toMatchObject({
			adapter: "sitevision",
			fallback: false,
			text: lines("Eksempel helsestasjon", "Drop-in hver tirsdag."),
		})
	})
})

describe("readPage: site rules", () => {
	const SONDRE_LAND =
		"https://www.sondre-land.kommune.no/publisert-innhold/helse-omsorg-velferd/legevakt/"

	it("reads Søndre Land by its rule, with or without www", () => {
		const expected = {
			adapter: "siteRule",
			fallback: false,
			text: lines("Eksempel legevakt", "Ring legevakten ved akutt sykdom."),
		}
		expect(readPage(page("sondre-land.html"), SONDRE_LAND)).toMatchObject(expected)
		expect(readPage(page("sondre-land.html"), SONDRE_LAND.replace("www.", ""))).toMatchObject(
			expected
		)
	})

	it("reads Oslo by its rule", () => {
		expect(
			readPage(page("oslo.html"), "https://www.oslo.kommune.no/helse-og-omsorg/legevakt/")
		).toMatchObject({
			adapter: "siteRule",
			fallback: false,
			text: lines("Eksempel legevakt", "Telefon: 62 00 00 00"),
		})
	})

	it("never applies a site rule on another host", () => {
		expect(readPage(page("sondre-land.html"), K)).toEqual({
			adapter: "fallback",
			origin: "unitPage",
			fallback: true,
			text: "",
		})
	})
})

describe("readPage: the fallback", () => {
	it("falls back to <main>, marked, for a site it does not know", () => {
		expect(readPage(page("unknown.html"), K)).toEqual({
			adapter: "fallback",
			origin: "unitPage",
			fallback: true,
			text: lines("Eksempel frivilligsentral", "Åpen kafé hver onsdag."),
		})
	})

	it("falls back, marked, when a known CMS's element is gone", () => {
		expect(readPage(page("sitevision-redesign.html"), K)).toMatchObject({
			adapter: "fallback",
			fallback: true,
			text: lines("Eksempel ny mal", "Innhold."),
		})
	})

	it("gives empty text when the main element or an ancestor is hidden", () => {
		const body = "<main><p>Skjult tekst for en modell.</p></main>"
		for (const html of [
			`<html><body><div hidden>${body}</div></body></html>`,
			`<html><body><div aria-hidden="true">${body}</div></body></html>`,
			`<html><body><div style="display: none">${body}</div></body></html>`,
			`<html><body><main style="visibility:hidden"><p>Skjult tekst for en modell.</p></main></body></html>`,
			`<html><body><main hidden><p>Skjult tekst for en modell.</p></main></body></html>`,
		]) {
			expect(readPage(html, K), html).toMatchObject({ adapter: "fallback", text: "" })
		}
		expect(readPage(`<html><body><div>${body}</div></body></html>`, K).text).toBe(
			"Skjult tekst for en modell."
		)
	})

	it("gives empty text, marked, for a page with no main element", () => {
		expect(readPage(page("nomain.html"), K)).toEqual({
			adapter: "fallback",
			origin: "unitPage",
			fallback: true,
			text: "",
		})
	})
})
