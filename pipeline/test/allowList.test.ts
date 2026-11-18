import { describe, expect, it } from "vitest"
import { AllowList, wwwTwin } from "../src/net/allowList.ts"
import { isUnsafeHost } from "../src/sources/hosts.ts"
import { asHttpsUrl, foldNorwegian, httpsHost } from "../src/text/normalise.ts"

describe("AllowList", () => {
	it("starts with the registers and catalogues, each with its licence", () => {
		const list = new AllowList()
		expect(list.licence("data.brreg.no")).toBe("nlod")
		expect(list.licence("data.ssb.no")).toBe("ccBy")
		expect(list.licence("api.kartverket.no")).toBe("ccBy")
		expect(list.get("www.ssb.no")).toEqual({
			host: "www.ssb.no",
			kind: "register",
			licence: "ccBy",
		})
		expect(list.licence("www.nav.no")).toBe("ownPage")
		expect(list.licence("dinutvei.no")).toBe("pending")
		expect(list.licence("frivilligsentral.no")).toBe("pending")
		expect(list.licence("kirkensbymisjon.no")).toBe("ownPage")
		expect(list.has("api.aimcms.no")).toBe(false)
		// NKLM's file link redirects to www.norceresearch.no; no other subdomain is allowed.
		expect(list.get("www.norceresearch.no")).toEqual({
			host: "www.norceresearch.no",
			kind: "register",
			licence: "granted",
		})
		expect(list.licence("nklm.norceresearch.no")).toBe("granted")
		expect(list.has("norceresearch.no")).toBe(false)
		expect(list.has("other.norceresearch.no")).toBe(false)
	})

	it("adds the www twin, since kommune sites redirect between the two", () => {
		const list = new AllowList([])
		list.add("www.lillehammer.kommune.no", "kommune", "ownPage")
		expect(list.has("lillehammer.kommune.no")).toBe(true)
		expect(list.has("WWW.Lillehammer.kommune.no")).toBe(true)
		expect(wwwTwin("lillehammer.kommune.no")).toBe("www.lillehammer.kommune.no")
	})

	it("gives a register no www twin, but keeps a catalogue's", () => {
		const list = new AllowList()
		for (const bare of ["www.data.brreg.no", "www.data.ssb.no", "ssb.no", "nav.no"]) {
			expect(list.has(bare)).toBe(false)
		}
		expect(list.has("www.api.kartverket.no")).toBe(false)
		expect(list.get("www.dinutvei.no")).toMatchObject({ kind: "catalogue", licence: "pending" })
		const empty = new AllowList([])
		empty.add("data.register.no", "register", "nlod")
		expect(empty.entries().map((e) => e.host)).toEqual(["data.register.no"])
	})

	it("restores kommuner and providers from a hosts file, never a register or a catalogue", () => {
		const list = AllowList.restore([
			{ host: "data.brreg.no", kind: "register", licence: "nlod" },
			{ host: "www.stray-register.no", kind: "register", licence: "nlod" },
			{ host: "www.stray-catalogue.no", kind: "catalogue", licence: "ownPage" },
			{ host: "www.lillehammer.kommune.no", kind: "kommune", licence: "ownPage" },
			{ host: "www.leverandor.no", kind: "provider", licence: "ownPage" },
		])
		expect(list.has("www.stray-register.no")).toBe(false)
		expect(list.has("stray-register.no")).toBe(false)
		expect(list.has("www.stray-catalogue.no")).toBe(false)
		expect(list.get("data.brreg.no")).toMatchObject({ kind: "register", licence: "nlod" })
		expect(list.get("dinutvei.no")).toMatchObject({ kind: "catalogue", licence: "pending" })
		expect(list.get("lillehammer.kommune.no")).toMatchObject({ kind: "kommune" })
		expect(list.get("leverandor.no")).toMatchObject({ kind: "provider" })
		const fixed = new AllowList().entries()
		expect(list.entries().filter((e) => e.kind === "register")).toEqual(
			fixed.filter((e) => e.kind === "register")
		)
		expect(list.entries().filter((e) => e.kind === "catalogue")).toEqual(
			fixed.filter((e) => e.kind === "catalogue")
		)
	})

	it("keeps the first entry for a host, so a catalogue never turns into a provider", () => {
		const list = new AllowList()
		list.add("frivilligsentral.no", "provider", "ownPage")
		expect(list.get("frivilligsentral.no")).toMatchObject({ kind: "catalogue", licence: "pending" })
	})

	it("keys licences by exact host, not by registrable domain", () => {
		const list = new AllowList()
		list.add("hamar.frivilligsentral.no", "provider", "ownPage")
		expect(list.licence("hamar.frivilligsentral.no")).toBe("ownPage")
		expect(list.licence("frivilligsentral.no")).toBe("pending")
	})

	it("refuses a public suffix, an IP address and a social network as a provider", () => {
		const list = new AllowList([])
		expect(list.add("kommune.no", "provider", "ownPage")).toBe(false)
		expect(list.add("10.0.0.1", "provider", "ownPage")).toBe(false)
		expect(list.add("www.facebook.com", "provider", "ownPage")).toBe(false)
		expect(list.add("m.facebook.com", "provider", "ownPage")).toBe(false)
		expect(list.entries()).toEqual([])
	})

	it("refuses an unsafe domain for every kind, its www twin and its subdomains", () => {
		const list = new AllowList([])
		expect(list.add("www.moderne.no", "provider", "ownPage")).toBe(false)
		expect(list.add("moderne.no", "kommune", "ownPage")).toBe(false)
		expect(list.add("shop.climateact.org", "catalogue", "pending")).toBe(false)
		expect(
			AllowList.restore([
				{ host: "www.amaderjalsha.com", kind: "provider", licence: "ownPage" },
			]).has("www.amaderjalsha.com")
		).toBe(false)
		expect(list.entries()).toEqual([])
	})

	it("refuses one unsafe site on a shared platform and keeps its neighbors", () => {
		const list = new AllowList([])
		expect(list.add("hamarjazz.blogspot.com", "provider", "ownPage")).toBe(false)
		expect(list.add("www.hamarjazz.blogspot.com", "provider", "ownPage")).toBe(false)
		expect(isUnsafeHost("HamarJazz.blogspot.com.")).toBe(true)
		expect(list.entries()).toEqual([])
		expect(list.add("example.blogspot.com", "provider", "ownPage")).toBe(true)
		expect(isUnsafeHost("nothamarjazz.blogspot.com")).toBe(false)
	})

	it("refuses the spam domains found by hand in the weak tier", () => {
		const list = new AllowList([])
		expect(list.add("www.bylan.net", "provider", "ownPage")).toBe(false)
		expect(list.add("www.theworlddrum.com", "provider", "ownPage")).toBe(false)
		expect(list.entries()).toEqual([])
	})
})

describe("URL helpers", () => {
	it("gives the host of a plain https URL only", () => {
		expect(httpsHost("https://WWW.Hamar.kommune.no/x")).toBe("www.hamar.kommune.no")
		expect(httpsHost("http://www.hamar.kommune.no/")).toBeUndefined()
		expect(httpsHost("https://www.hamar.kommune.no:8443/")).toBeUndefined()
		expect(httpsHost("https://kari@www.hamar.kommune.no/")).toBeUndefined()
		expect(httpsHost("https://127.0.0.1/")).toBeUndefined()
		expect(httpsHost("https://kommune.no/")).toBeUndefined()
		expect(httpsHost("ikke en adresse")).toBeUndefined()
	})

	it("turns Brreg's web address into an https URL", () => {
		expect(asHttpsUrl("www.lillehammer.kommune.no/")).toBe("https://www.lillehammer.kommune.no/")
		expect(asHttpsUrl("http://www.eksempel.no")).toBe("https://www.eksempel.no/")
		expect(asHttpsUrl("  ")).toBeUndefined()
		expect(asHttpsUrl("ikke en nettside")).toBeUndefined()
	})

	it("folds Norwegian letters", () => {
		expect(foldNorwegian("Møteplassen på Ærøy, Åsnes, kafé")).toBe(
			"moteplassen pa aeroy, asnes, kafe"
		)
	})
})
