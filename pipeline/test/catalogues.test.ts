import { describe, expect, it } from "vitest"
import {
	FRIVILLIGSENTRAL_REGISTER,
	findInFrivilligsentralRegister,
	findInWpPage,
	runCatalogue,
	wpQuery,
} from "../src/discover/catalogues.ts"
import { fakeGet } from "./netHelpers.ts"

// Shapes from the live APIs on 03.11.2026; every value is fictional.
const dinutveiItem = {
	id: 1,
	link: "https://dinutvei.no/hjelpetilbud/eksempel-krisesenter/",
	content: {
		rendered: [
			"<p>Eksempel krisesenter, Storgata 1, 2609 Lillehammer. Telefon 62 00 00 00.</p>",
			'<p><a href="https://www.krisesenter-eksempel.no/#kontakt">Nettside</a>',
			'<a href="https://dinutvei.no/annet/">Mer på dinutvei</a>',
			'<a href="https://www.nkvts.no/x">NKVTS</a>',
			'<a href="https://www.facebook.com/eksempel">Facebook</a>',
			'<a href="mailto:post@krisesenter-eksempel.no">E-post</a>',
			'<a href="tel:+4762000000">Ring</a> <a href="/relativ/">Relativ</a></p>',
		].join(""),
	},
	acf: { adresse: "Storgata 1, 2609 Lillehammer", fylker: ["Innlandet"] },
}

const register = `<table><thead><tr><th>Navn</th><th>Kommune</th><th>E-post</th><th>Telefon</th><th>NL</th><th>Daglig leder</th></tr></thead><tbody>
<tr><td><a href="/sentral?eksempel&amp;Id=1">Eksempel frivilligsentral</a></td><td>Lillehammer</td><td><a href="mailto:post@eksempel.frivilligsentral.no">post@eksempel.frivilligsentral.no</a></td><td>900 00 000</td><td>Ja</td><td>Kari Nordmann</td></tr>
<tr><td><a href="https://eksempel.frivilligsentral.no/">Eksempel frivilligsentral</a></td><td>Lillehammer</td><td></td><td></td><td></td><td></td></tr>
<tr><td><a href="/sentral?annen&amp;Id=2">Annen frivilligsentral</a></td><td>Gjøvik</td><td></td><td></td><td></td><td>Kari Nordmann</td></tr>
</tbody></table>`

describe("findInWpPage", () => {
	it("takes only the provider's own site from a dinutvei entry", () => {
		const found = findInWpPage("dinutvei", [dinutveiItem])
		expect(found).toEqual({ rows: 1, urls: ["https://www.krisesenter-eksempel.no/"] })
		const out = JSON.stringify(found)
		for (const text of ["Storgata", "62 00 00 00", "Innlandet"]) expect(out).not.toContain(text)
	})

	it("takes the entry's own link from Konfliktrådet and Kirkens Bymisjon", () => {
		const items = [
			{ id: 1, link: "https://konfliktraadet.no/ditt_konfliktrad/konfliktradet-eksempel/" },
			{ id: 2 },
		]
		expect(findInWpPage("konfliktraadet", items)).toEqual({
			rows: 2,
			urls: ["https://konfliktraadet.no/ditt_konfliktrad/konfliktradet-eksempel/"],
		})
	})

	it("refuses a body that is not a WordPress list", () => {
		expect(findInWpPage("bymisjon", { code: "rest_no_route" })).toBeUndefined()
	})

	it("asks WordPress for as few fields as it needs", () => {
		expect(wpQuery("dinutvei", 2)).toBe(
			"https://dinutvei.no/wp-json/wp/v2/help?per_page=100&page=2&_fields=id,link,content"
		)
		expect(wpQuery("bymisjon", 1)).toBe(
			"https://kirkensbymisjon.no/wp-json/wp/v2/tilbud?per_page=100&page=1&_fields=id,link"
		)
	})
})

describe("findInFrivilligsentralRegister", () => {
	it("takes a sentral's own site from its row, and no name, phone or email", () => {
		const found = findInFrivilligsentralRegister(register)
		expect(found).toEqual({ rows: 3, urls: ["https://eksempel.frivilligsentral.no/"] })
		const out = JSON.stringify(found)
		for (const text of ["Kari", "900 00 000", "post@"]) expect(out).not.toContain(text)
	})
})

describe("runCatalogue", () => {
	it("reads every page WordPress says there is", async () => {
		const get = fakeGet({
			[wpQuery("konfliktraadet", 1)]: {
				body: JSON.stringify([{ id: 1, link: "https://konfliktraadet.no/a/" }]),
				headers: { "x-wp-totalpages": "2" },
			},
			[wpQuery("konfliktraadet", 2)]: {
				body: JSON.stringify([{ id: 2, link: "https://konfliktraadet.no/b/" }]),
				headers: { "x-wp-totalpages": "2" },
			},
		})
		expect(await runCatalogue(get, "konfliktraadet")).toEqual({
			name: "konfliktraadet",
			rows: 2,
			findings: [
				{ catalogue: "konfliktraadet", url: "https://konfliktraadet.no/a/" },
				{ catalogue: "konfliktraadet", url: "https://konfliktraadet.no/b/" },
			],
			complete: true,
		})
	})

	it("says so when a page is missing", async () => {
		const get = fakeGet({
			[wpQuery("bymisjon", 1)]: { body: "[]", headers: { "x-wp-totalpages": "2" } },
		})
		expect((await runCatalogue(get, "bymisjon")).complete).toBe(false)
	})

	it("says so when the page count header cannot be read", async () => {
		const get = fakeGet({
			[wpQuery("bymisjon", 1)]: {
				body: JSON.stringify([{ id: 1, link: "https://kirkensbymisjon.no/a/" }]),
				headers: { "x-wp-totalpages": "abc" },
			},
		})
		expect((await runCatalogue(get, "bymisjon")).complete).toBe(false)
	})

	it("says so when the header is missing on a full page", async () => {
		const full = Array.from({ length: 100 }, (_, i) => ({
			id: i + 1,
			link: `https://kirkensbymisjon.no/${i}/`,
		}))
		const get = fakeGet({ [wpQuery("bymisjon", 1)]: { body: JSON.stringify(full) } })
		expect((await runCatalogue(get, "bymisjon")).complete).toBe(false)
	})

	it("accepts a missing header on a short page as the last page", async () => {
		const get = fakeGet({
			[wpQuery("bymisjon", 1)]: {
				body: JSON.stringify([{ id: 1, link: "https://kirkensbymisjon.no/a/" }]),
			},
		})
		expect((await runCatalogue(get, "bymisjon")).complete).toBe(true)
	})

	it("reports a register with no rows as a failure, never a silent zero", async () => {
		const get = fakeGet({
			[FRIVILLIGSENTRAL_REGISTER]: {
				body: "<html><body>Ny side</body></html>",
				contentType: "text/html",
			},
		})
		expect(await runCatalogue(get, "frivilligsentral")).toEqual({
			name: "frivilligsentral",
			rows: 0,
			findings: [],
			complete: false,
		})
	})
})
