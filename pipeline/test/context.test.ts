import { describe, expect, it } from "vitest"
import type { ManifestEntry } from "../src/io/pageCache.ts"
import { AllowList } from "../src/net/allowList.ts"
import { addressQuery } from "../src/registers/kartverket.ts"
import {
	buildLookups,
	contextFor,
	kartverketForm,
	resolveAddresses,
	resolveUrls,
} from "../src/verify/context.ts"
import { fakeGet } from "./netHelpers.ts"

const A = "https://www.eksempel.kommune.no/helsestasjon/"
const FINAL = "https://eksempel.kommune.no/helsestasjon/"
const entry: ManifestEntry = {
	url: A,
	finalUrl: FINAL,
	status: 200,
	contentType: "text/html",
	fetchedAt: "2026-11-06T09:00:00Z",
	contentHash: `sha256:${"0".repeat(64)}`,
	file: `${"a".repeat(32)}.html`,
	adapter: "fallback",
}
const html =
	"<html><body><main><h1>Eksempel helsestasjon</h1><p>Telefon: 62 00 00 00</p></main></body></html>"
const allowList = AllowList.restore([
	{ host: "www.eksempel.kommune.no", kind: "kommune", licence: "ownPage" },
])
const lookups = buildLookups({
	manifest: [entry],
	readHtml: () => html,
	allowList,
	validKommuner: new Set(["3405"]),
	addresses: new Map([
		["Storgata 1, 2609 Lillehammer", { addressId: "a1", kommune: "3405", text: "Storgata 1" }],
	]),
	checkedUrls: new Map([["eksempel.kommune.no/ny-side", 200]]),
})

describe("buildLookups", () => {
	it("allows the hosts and licences discover recorded, and the registers", () => {
		expect(lookups.allowedHosts.has("eksempel.kommune.no")).toBe(true)
		expect(lookups.allowedHosts.has("data.brreg.no")).toBe(true)
		expect(lookups.licence("eksempel.kommune.no")).toBe("ownPage")
	})

	it("lets robots pass only for a URL the crawler fetched, or a register's own host", () => {
		expect(lookups.robotsAllows(A)).toBe(true)
		expect(lookups.robotsAllows(FINAL)).toBe(true)
		expect(lookups.robotsAllows("https://www.eksempel.kommune.no/annet/")).toBe(false)
		expect(
			lookups.robotsAllows("https://data.brreg.no/enhetsregisteret/api/enheter/999999981")
		).toBe(true)
	})

	it("gives Nav no register pass: a Nav office page counts only when the crawler fetched it", () => {
		expect(lookups.robotsAllows("https://www.nav.no/kontor/nav-eksempel")).toBe(false)
	})

	it("gives the page text the rules read, for the URL and the final URL", () => {
		expect(lookups.pageText(FINAL)).toContain("Telefon: 62 00 00 00")
		expect(lookups.pageText(A)).toBe(lookups.pageText(FINAL))
		expect(lookups.pageText("https://www.eksempel.kommune.no/annet/")).toBeUndefined()
	})

	it("gives the manifest's status for a URL, compared normalised", () => {
		expect(lookups.urlStatus("https://eksempel.kommune.no/helsestasjon")).toBe(200)
		expect(lookups.urlStatus("https://www.eksempel.kommune.no/annet/")).toBeUndefined()
	})

	it("gives the status verify checked itself for a URL I typed in review", () => {
		expect(lookups.urlStatus("https://eksempel.kommune.no/ny-side/")).toBe(200)
	})

	it("answers addresses from the map filled before the gates run", () => {
		expect(lookups.findAddress("Storgata 1, 2609 Lillehammer")).toMatchObject({ addressId: "a1" })
		expect(lookups.findAddress("Storgata 2, 2609 Lillehammer")).toBeUndefined()
	})
})

describe("contextFor", () => {
	it("adds the unit's facts and peers", () => {
		const unit = {
			categories: [],
			isKrisesenter: false,
			ownHosts: new Set(["eksempel.kommune.no"]),
		}
		const ctx = contextFor(lookups, unit, [])
		expect(ctx.unit).toBe(unit)
		expect(ctx.peers).toEqual([])
	})
})

describe("resolveAddresses and kartverketForm", () => {
	it("asks Kartverket once per distinct address", async () => {
		const asked: string[] = []
		const body = JSON.stringify({
			adresser: [
				{ adresseid: "a1", adressetekst: "Storgata 1A", kommunenummer: "3405", postnummer: "2609" },
			],
		})
		const get = fakeGet({ [addressQuery("storgata 1a", "3405")]: { body } })
		const counting: typeof get = async (url, kind) => {
			asked.push(url)
			return get(url, kind)
		}
		const map = await resolveAddresses(
			counting,
			["Storgata 1 A, 2609 Lillehammer", "Storgata 1 A, 2609 Lillehammer"],
			"3405"
		)
		expect(asked).toHaveLength(1)
		const hit = map.get("Storgata 1 A, 2609 Lillehammer")
		expect(hit).toEqual({ addressId: "a1", kommune: "3405", text: "Storgata 1A" })
		expect(
			kartverketForm("Storgata 1 A, 2609 Lillehammer", hit ?? { addressId: "", kommune: "" })
		).toBe("Storgata 1A, 2609 Lillehammer")
	})
})

describe("resolveUrls", () => {
	it("asks once per distinct URL, compared normalised, and keeps what a failed fetch gave", async () => {
		const asked: string[] = []
		const get = fakeGet({ "https://www.eksempel.kommune.no/ny-side/": { body: "<html></html>" } })
		const counting: typeof get = async (url, kind) => {
			asked.push(url)
			return get(url, kind)
		}
		const map = await resolveUrls(counting, [
			"https://www.eksempel.kommune.no/ny-side/",
			"https://www.eksempel.kommune.no/ny-side",
			"https://www.eksempel.kommune.no/borte/",
		])
		expect(asked).toHaveLength(2)
		expect(map.get("eksempel.kommune.no/ny-side")).toBe(200)
		expect(map.get("eksempel.kommune.no/borte")).toBe(404)
	})
})
