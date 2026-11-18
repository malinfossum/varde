import { describe, expect, it } from "vitest"
import { suspectReason } from "../src/check/suspectSites.ts"

// Every name, number and site is fictional.
const unit = {
	name: "EKSEMPEL PARKINSONFORENING OSLO",
	orgNumber: "999999991",
	website: "https://www.eksempel-parkinson.no/",
}
const page = (html: string, finalUrl = unit.website) => ({ finalUrl, html })

describe("suspectReason", () => {
	it("passes a page that names the unit by one distinctive word, or by its org number", () => {
		expect(suspectReason(unit, page("<h1>Parkinsonforeningen i Oslo</h1>"))).toBeUndefined()
		expect(suspectReason(unit, page("<p>Org.nr. 999 999 991</p>"))).toBeUndefined()
	})

	it("calls a page with three gambling words spam, but not one with a single word", () => {
		const spam = "<title>Beste casino 2026</title><p>Casino bonus. Nettcasino og slot.</p>"
		expect(suspectReason(unit, page(spam))).toBe("spam")
		const once = "<h1>Eksempel parkinsonforening</h1><p>Filmkveld: Casino (1995)</p>"
		expect(suspectReason(unit, page(once))).toBeUndefined()
	})

	it("finds spam before it trusts the unit's name, since a hacked page keeps its old title", () => {
		const hacked = "<title>Eksempel parkinsonforening</title><p>casino casino betting</p>"
		expect(suspectReason(unit, page(hacked))).toBe("spam")
	})

	it("calls a page in an unexpected language spam at one gambling word, though it names the unit", () => {
		const hijacked =
			'<html lang="id"><title>Eksempel Parkinsonforening Hoki88</title><p>Daftar dan login. Agen sbobet resmi.</p></html>'
		expect(suspectReason(unit, page(hijacked))).toBe("spam")
	})

	it("passes a page in an unexpected language that names the unit and sells nothing", () => {
		const diaspora =
			'<html lang="es"><h1>Eksempel Parkinsonforening</h1><p>Bienvenidos a nuestra asociación.</p></html>'
		expect(suspectReason(unit, page(diaspora))).toBeUndefined()
	})

	it("notes a redirect to another domain, and a page in an unexpected language", () => {
		expect(suspectReason(unit, page("<p>x</p>", "https://annet.example/"))).toBe("leftDomain")
		expect(suspectReason(unit, page('<html lang="id"><p>Toko online</p></html>'))).toBe(
			"foreignLanguage"
		)
		expect(suspectReason(unit, page('<html lang="nb"><p>Velkommen</p></html>'))).toBe(
			"namesNeither"
		)
	})

	it("ignores words inside scripts and generic words of the name", () => {
		const html = '<script>var casino = "casino casino"</script><p>Velkommen til Oslo forening</p>'
		expect(suspectReason(unit, page(html))).toBe("namesNeither")
	})
})
