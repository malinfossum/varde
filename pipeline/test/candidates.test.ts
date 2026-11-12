import { describe, expect, it } from "vitest"
import type { UnitGroup } from "../src/curate/include.ts"
import type { ExtractedCandidate, ExtractedPage } from "../src/schema/extraction.ts"
import { switchboardPhone, unitCandidates, withCost } from "../src/verify/candidates.ts"

const URL_A = "https://www.eksempel.kommune.no/helsestasjon/"
const phone = (value: string, rank: 1 | 2 | 3, block = 0, role?: string): ExtractedCandidate => ({
	field: "phone",
	value,
	evidence: { kind: "quote", quotes: [value] },
	origin: "unitContact",
	rank,
	block,
	...(role === undefined ? {} : { role }),
})
const page = (
	candidates: ExtractedCandidate[],
	blocks: ExtractedPage["blocks"] = [{ source: "heading", lines: [] }]
): ExtractedPage => ({
	url: URL_A,
	finalUrl: URL_A,
	fetchedAt: "2026-11-06T09:00:00Z",
	adapter: "acos",
	fallback: false,
	blocks,
	candidates,
	lavterskelQuotes: [],
})
const group = (p: ExtractedPage, over: Partial<UnitGroup> = {}): UnitGroup => ({
	unitId: "org:999999991",
	pages: [p],
	name: "Eksempel helsestasjon",
	matchName: "EKSEMPEL HELSESTASJON",
	categories: ["familie-og-barn"],
	isKrisesenter: false,
	inclusion: {
		status: "auto",
		reason: "x",
		suggestedCategories: ["familie-og-barn"],
		providerType: "offentlig",
	},
	...over,
})
const base = { kommune: "3405", sharers: new Map(), kommunePages: [], places: ["Lillehammer"] }

describe("unitCandidates: the phone order", () => {
	it("picks rank 1 over rank 2, and compares only rank 1 numbers as peers", () => {
		const p = page([phone("62 00 00 00", 1), phone("900 00 000", 2, 0, "Avdelingsleder")])
		const { chosen, peers } = unitCandidates({ ...base, group: group(p) })
		expect(chosen.find((c) => c.candidate.field === "phone")?.candidate.value).toBe("62 00 00 00")
		expect(peers.filter((c) => c.field === "phone").map((c) => c.value)).toEqual(["62 00 00 00"])
	})

	it("takes the Brreg switchboard before a page's rank 3", () => {
		const p = page([phone("62 00 00 07", 3, 0, "Sentralbord")])
		const { chosen } = unitCandidates({
			...base,
			group: group(p),
			switchboard: { phone: "62 00 00 05", orgNumber: "999999981" },
		})
		expect(chosen.find((c) => c.candidate.field === "phone")?.candidate).toMatchObject({
			value: "62 00 00 05",
			role: "Sentralbord",
		})
	})

	it("writes Brreg's raw switchboard the way a page writes a landline", () => {
		const p = page([])
		const { chosen } = unitCandidates({
			...base,
			group: group(p),
			switchboard: { phone: "+47 62000005", orgNumber: "999999981" },
		})
		expect(chosen.find((c) => c.candidate.field === "phone")?.candidate.value).toBe("62 00 00 05")
		expect(switchboardPhone("0047 62 00 00 05")).toBe("62 00 00 05")
	})
})

describe("unitCandidates: a shared page", () => {
	it("keeps the block naming the unit, skips a block naming another, and reviews the rest", () => {
		const blocks: ExtractedPage["blocks"] = [
			{ source: "heading", heading: "Eksempel helsestasjon", lines: [] },
			{ source: "heading", heading: "Eksempel familievern", lines: [] },
			{ source: "heading", lines: [] },
		]
		const p = page(
			[phone("62 00 00 01", 1, 0), phone("62 00 00 02", 1, 1), phone("62 00 00 03", 1, 2)],
			blocks
		)
		const me = group(p)
		const other = group(p, { unitId: "org:999999992", matchName: "EKSEMPEL FAMILIEVERN" })
		const sharers = new Map([[URL_A, [me, other]]])
		const { chosen, peers } = unitCandidates({ ...base, group: me, sharers })
		const pick = chosen.find((c) => c.candidate.field === "phone")
		expect(pick?.candidate.value).toBe("62 00 00 01")
		expect(pick?.review).toBeUndefined()
		expect(peers.filter((c) => c.field === "phone").map((c) => c.value)).toEqual([
			"62 00 00 01",
			"62 00 00 03",
		])
	})
})

describe("withCost", () => {
	const lav = {
		candidate: {
			kommune: "3405",
			unitId: "org:999999991",
			field: "lowThreshold" as const,
			value: false,
			sourceUrl: "https://www.eksempel.kommune.no/tilbud/",
			evidence: { kind: "quote" as const, quotes: ["Du trenger ikke henvisning."] },
			origin: "unitPage" as const,
			personNames: [],
			fetchedAt: "2026-11-06T09:00:00Z",
		},
	}

	it("reads the Lavterskel value again under the unit's own accepted cost", () => {
		expect(withCost(lav, "free").candidate.value).toBe(true)
		expect(withCost(lav, "partly").candidate.value).toBe(true)
		expect(withCost(lav, "paid").candidate.value).toBe(false)
		expect(withCost(lav, undefined).candidate.value).toBe(false)
	})

	it("returns any other proposal as it is", () => {
		const phone = { candidate: { ...lav.candidate, field: "phone" as const, value: "62 00 00 00" } }
		expect(withCost(phone, "free")).toBe(phone)
	})
})
