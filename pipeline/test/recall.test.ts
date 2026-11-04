import { describe, expect, it } from "vitest"
import type { KeyRow } from "../src/answerKey/schema.ts"
import type { DiscoveredUnit, DiscoverReport, KommuneDiscovery } from "../src/discover/types.ts"
import { type Found, matchRecall, namesMatch } from "../src/recall/match.ts"
import { inert, recall, renderRecall } from "../src/recall/report.ts"
import { normaliseUrl } from "../src/text/normalise.ts"

const L = "https://lillehammer.kommune.no"

function row(
	over: Omit<Partial<KeyRow>, "fields"> & { fields?: Partial<KeyRow["fields"]> } = {}
): KeyRow {
	const { fields, ...rest } = over
	return {
		id: 1,
		kommune: "3405",
		national: false,
		servedKommuner: [],
		parentId: null,
		name: "Helsestasjonen i Lillehammer",
		nameEn: "Lillehammer health centre",
		categories: ["familie-og-barn"],
		...rest,
		fields: {
			phone: null,
			address: "Storgata 1, 2609 Lillehammer",
			email: null,
			website: null,
			chatUrl: null,
			openingHours: null,
			cost: null,
			costNote: null,
			alwaysOpen: false,
			lowThreshold: false,
			...fields,
		},
	}
}

const unit: DiscoveredUnit = {
	orgNumber: "999999991",
	name: "LILLEHAMMER KOMMUNE HELSESTASJON",
	orgForm: "BEDR",
	address: "Storgata 1, 2609 LILLEHAMMER",
	kommune: "3405",
	register: "underenheter",
}

const found = (over: Partial<Found> = {}): Found => ({
	units: [unit],
	urls: new Set(),
	kommuneHosts: new Set(["lillehammer.kommune.no"]),
	...over,
})

describe("matchRecall: one case per rule", () => {
	it("finds a service by org number", () => {
		expect(matchRecall(row({ fields: { address: null } }), found(), "999999991")).toBe("orgNumber")
	})

	it("finds a service by name and address, Brreg's capitals and a definite ending included", () => {
		expect(namesMatch("LILLEHAMMER KOMMUNE HELSESTASJON", "Helsestasjonen i Lillehammer")).toBe(
			true
		)
		expect(matchRecall(row(), found())).toBe("nameAndAddress")
	})

	it("finds a service by its own website", () => {
		const r = row({ fields: { address: null, website: "https://www.eksempel.no/tilbud/" } })
		expect(
			matchRecall(r, found({ urls: new Set([normaliseUrl("https://eksempel.no/tilbud")]) }))
		).toBe("website")
	})
})

describe("matchRecall: misses", () => {
	it("needs both the name and the address", () => {
		expect(
			matchRecall(row({ fields: { address: "Storgata 2, 2609 Lillehammer" } }), found())
		).toBeUndefined()
		expect(matchRecall(row({ name: "Barnevernet i Lillehammer" }), found())).toBeUndefined()
	})

	it("never counts a kommune's front page as found", () => {
		const r = row({ fields: { address: null, website: "https://www.lillehammer.kommune.no/" } })
		expect(
			matchRecall(
				r,
				found({ urls: new Set([normaliseUrl("https://www.lillehammer.kommune.no/")]) })
			)
		).toBeUndefined()
	})
})

describe("recall over the key", () => {
	const kommune: KommuneDiscovery = {
		kommune: "3405",
		name: "Lillehammer",
		discoveredAt: "2026-11-03T12:00:00Z",
		site: {
			host: "www.lillehammer.kommune.no",
			sitemap: "probe",
			sitemapUrls: 2,
			servicePages: 1,
			kept: 1,
			truncated: false,
		},
		brregComplete: true,
		allSitemapUrls: [`${L}/helse/helsestasjonen/`, `${L}/barnehage/x/`],
		units: [unit],
		pages: [{ url: `${L}/helse/helsestasjonen/`, from: "sitemap" }],
	}
	const report: DiscoverReport = {
		ranAt: "2026-11-03T12:30:00Z",
		date: "2026-11-03",
		only: ["3405"],
		kommuner: ["3405"],
		renumberings: [],
		nameMismatches: [],
		problems: ["catalogue frivilligsentral: 0 rows, not complete"],
		hosts: [{ host: "frivilligsentral.no", requests: 1, stopped: "visitTime" }],
		notFetched: [],
	}
	const key = {
		frozenOn: "2026-10-29",
		source: "https://varde.pages.dev/data/resources.nb.json",
		rows: [
			row({ id: 1 }),
			row({ id: 2, name: "Barnehagen", fields: { address: null, website: `${L}/barnehage/x/` } }),
			row({
				id: 3,
				name: "Eksempel frivilligsentral",
				fields: { address: null, website: "https://lillehammer.frivilligsentral.no/" },
			}),
			row({
				id: 4,
				name: "Registeret",
				fields: { address: null, website: "https://frivilligsentral.no/x" },
			}),
			row({ id: 5, name: "Ny side", fields: { address: null, website: `${L}/helse/ny-side/` } }),
			row({
				id: 7,
				name: "Ugyldig nettside",
				fields: { address: null, website: "ikke en `adresse`" },
			}),
			row({
				id: 6,
				name: "Hjelpetelefonen",
				kommune: null,
				national: true,
				fields: { address: null },
			}),
		],
	}
	const result = recall({
		key,
		kommuner: [kommune],
		national: { discoveredAt: "2026-11-03T12:00:00Z", pages: [], catalogues: [], navOffices: 0 },
		report,
		hosts: [
			{ host: "www.lillehammer.kommune.no", kind: "kommune", licence: "ownPage" },
			{ host: "lillehammer.kommune.no", kind: "kommune", licence: "ownPage" },
			{ host: "frivilligsentral.no", kind: "catalogue", licence: "pending" },
		],
	})

	it("counts what it found, by rule and by kind of row", () => {
		expect(result).toMatchObject({
			total: 7,
			found: 1,
			byRule: { orgNumber: 0, nameAndAddress: 1, website: 0 },
			kommuneRows: { total: 6, found: 1 },
			nationalRows: { total: 1, found: 0 },
		})
	})

	it("gives each miss its likely reason", () => {
		expect(result.misses.map((m) => [m.id, m.reason])).toEqual([
			[2, "in the sitemap, but the path words filtered it out"],
			[3, "`lillehammer.frivilligsentral.no` was not found by any register, sitemap or catalogue"],
			[4, "`frivilligsentral.no` was skipped: outside its Visit-time window"],
			[5, "not in the sitemap of `lillehammer.kommune.no`"],
			[7, "the key's website is not a valid URL"],
			[6, "national row: no website in the key, and no unit matched by name and address"],
		])
	})

	it("renders the headline against the bar, and every name as inert text", () => {
		const md = renderRecall(result)
		expect(md).toContain(
			"Found **1 of 7** answer-key services (14.3%). The pilot bar is 9 in 10: 7 of 7."
		)
		expect(md).toContain("on 03.11.2026")
		expect(md).toContain("| 2 Barnehagen | 3405 |")
		expect(md).toContain("- `frivilligsentral.no`: outside its Visit-time window")
		expect(inert("Kafé | Møteplassen @varde <img> `x` *y*")).toBe(
			"Kafé \\| Møteplassen &#64;varde \\<img\\> \\`x\\` \\*y\\*"
		)
	})
})
