import {
	existsSync,
	mkdirSync,
	mkdtempSync,
	readFileSync,
	renameSync,
	writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { PassThrough } from "node:stream"
import { describe, expect, it } from "vitest"
import { checkData } from "../src/check/dataCheck.ts"
import { SaveError } from "../src/curate/write.ts"
import type { DiscoveredUnit, KommuneDiscovery } from "../src/discover/types.ts"
import { extractScope } from "../src/extract/extract.ts"
import { PageCache } from "../src/io/pageCache.ts"
import { AllowList } from "../src/net/allowList.ts"
import type { Fetched, Get } from "../src/net/crawler.ts"
import { addressQuery } from "../src/registers/kartverket.ts"
import { readKommuneFiles } from "../src/review/queue.ts"
import { runReview } from "../src/review/session.ts"
import type { CuratedFile } from "../src/schema/curated.ts"
import { PLACE_MISMATCH } from "../src/text/address.ts"
import type { VerifyCounts } from "../src/verify/verify.ts"
import {
	formatUnfinished,
	formatVerifySummary,
	lockPath,
	readCuratedFile,
	VerifyError,
	verifyAndWrite,
	verifyEach,
	verifyKommune,
} from "../src/verify/verify.ts"
import { fakeGet } from "./netHelpers.ts"

const K = "https://www.eksempel.kommune.no"
const NOW = "2026-11-06T10:00:00Z"
const D = "\u2013"
const html = (body: string) =>
	`<html><head><meta name="acos-cmscontext" content="x"></head><body><main class="main">${body}</main></body></html>`
// The default unit: a barneverntjeneste (SN 88.991), one of the codes that include by rule.
// A helsestasjon goes to review, so it cannot show an automatic include.
const BV = `${K}/barnevern/`
const H1 = "<h1>Eksempel barneverntjeneste</h1>"
const UNIT_PAGE = html(
	[
		H1,
		"<p>Barneverntjenesten er gratis, og du trenger ikke henvisning.</p>",
		"<h2>Kontakt</h2>",
		"<p>Telefon: 62 00 00 00</p>",
		'<p>E-post: <a href="mailto:barnevern@eksempel.kommune.no">barnevern@eksempel.kommune.no</a></p>',
		"<p>Besøksadresse: Storgata 1, 2609 Lillehammer</p>",
		"<h2>Åpningstider</h2>",
		"<p>Mandag 08.00-15.30</p>",
	].join("")
)
const unit = (over: Partial<DiscoveredUnit> = {}): DiscoveredUnit => ({
	orgNumber: "999999991",
	name: "EKSEMPEL KOMMUNE BARNEVERNTJENESTE",
	orgForm: "BEDR",
	naeringskode: "88.991",
	address: "Storgata 1, 2609 LILLEHAMMER",
	kommune: "3405",
	website: BV,
	register: "underenheter",
	...over,
})
const answer = (
	decisions: CuratedFile["units"][number]["decisions"],
	over: Partial<CuratedFile["units"][number]> = {}
) => ({
	unitId: "org:999999991",
	name: "Eksempel barneverntjeneste",
	include: true,
	sources: { orgNumber: "999999991", pages: [BV] },
	categories: ["familie-og-barn" as const],
	providerType: "offentlig" as const,
	decisions,
	...over,
})
const address = (
	id: string,
	text: string,
	postnummer = "2609",
	poststed: string | null = "LILLEHAMMER"
) => ({
	body: JSON.stringify({
		adresser: [
			{
				adresseid: id,
				adressetekst: text,
				kommunenummer: "3405",
				postnummer,
				...(poststed === null ? {} : { poststed }),
			},
		],
	}),
})
const KARTVERKET = {
	[addressQuery("storgata 1", "3405")]: address("a1", "Storgata 1"),
	[addressQuery("storgata 2", "3405")]: address("a2", "Storgata 2"),
}
const kartverket = fakeGet(KARTVERKET)
const fetched = (url: string, body: string, fetchedAt = "2026-11-06T09:00:00Z"): Fetched => ({
	ok: true,
	url,
	finalUrl: url,
	status: 200,
	contentType: "text/html",
	headers: {},
	body,
	fetchedAt,
})

function setup(o: {
	pages: Record<string, string>
	units?: DiscoveredUnit[]
	curated?: CuratedFile
	switchboard?: { phone: string; orgNumber: string }
	get?: Get
	// Pages fetched again after extract ran, so the extraction file is older than the cache.
	refetched?: Record<string, string>
}) {
	const dir = mkdtempSync(join(tmpdir(), "varde-verify-"))
	const cache = new PageCache(join(dir, "pages"))
	for (const [url, body] of Object.entries(o.pages))
		cache.put(fetched(url, body), { adapter: "acos" })
	const places = ["Lillehammer"]
	const kommune: KommuneDiscovery = {
		kommune: "3405",
		name: "Lillehammer",
		discoveredAt: NOW,
		site: {
			host: "www.eksempel.kommune.no",
			sitemap: "probe",
			sitemapUrls: 1,
			servicePages: 1,
			kept: 1,
			truncated: false,
		},
		brregComplete: true,
		allSitemapUrls: [],
		units: o.units ?? [],
		pages: Object.keys(o.pages).map((url) => ({ url, from: "sitemap" as const })),
		...(o.switchboard === undefined ? {} : { switchboard: o.switchboard }),
	}
	const { file } = extractScope(
		"3405",
		Object.keys(o.pages),
		cache,
		{ places, kommuneHost: "www.eksempel.kommune.no" },
		NOW
	)
	for (const [url, body] of Object.entries(o.refetched ?? {})) {
		cache.put(fetched(url, body, "2026-11-06T11:00:00Z"), { adapter: "acos" })
	}
	const input = {
		kommune,
		extraction: file,
		manifest: cache.entries(),
		readHtml: (e: Parameters<typeof cache.read>[0]) => cache.read(e),
		allowList: AllowList.restore([
			{ host: "www.eksempel.kommune.no", kind: "kommune", licence: "ownPage" },
		]),
		validKommuner: new Set(["3405"]),
		places,
		get: o.get ?? kartverket,
		...(o.curated === undefined ? {} : { curated: o.curated }),
		now: NOW,
	}
	return { dir, input }
}

describe("verifyKommune", () => {
	it("includes a clear unit by itself and accepts every value that passes the five gates", async () => {
		const { input } = setup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		const { lock, curated, counts } = await verifyKommune(input)
		const [u] = lock.units
		expect(u?.unitId).toBe("org:999999991")
		expect(u?.inclusion?.status).toBe("auto")
		const status = Object.fromEntries(
			Object.entries(u?.fields ?? {}).map(([k, f]) => [k, [f?.status, f?.value]])
		)
		expect(status).toMatchObject({
			name: ["accepted", "Eksempel barneverntjeneste"],
			website: ["accepted", BV],
			phone: ["accepted", "62 00 00 00"],
			email: ["accepted", "barnevern@eksempel.kommune.no"],
			address: ["accepted", "Storgata 1, 2609 Lillehammer"],
			openingHours: ["accepted", `Mandag kl. 08:00${D}15:30`],
		})
		expect(u?.fields.address?.addressId).toBe("a1")
		expect(u?.fields.phone?.origin).toBe("unitContact")
		expect(curated.units).toMatchObject([
			{
				unitId: "org:999999991",
				include: true,
				categories: ["familie-og-barn"],
				providerType: "offentlig",
			},
		])
		expect(counts).toMatchObject({
			units: 1,
			auto: 1,
			inclusionReview: 0,
			pagesStale: 0,
			answersUnsettled: 0,
		})
	})

	it("keeps a role mobile with its role, and no name anywhere in the lock", async () => {
		const page = html(`${H1}<h2>Kontakt</h2><p>Avdelingsleder Kari Nordmann 900 00 000</p>`)
		const { input } = setup({ pages: { [BV]: page }, units: [unit({ address: undefined })] })
		const { lock } = await verifyKommune(input)
		expect(lock.units[0]?.fields.phone).toMatchObject({
			status: "accepted",
			value: "900 00 000",
			role: "Avdelingsleder",
		})
		expect(JSON.stringify(lock)).not.toMatch(/Kari|Nordmann/)
	})

	it("redacts a name in the website quote of a page with no h1", async () => {
		const page = html(
			"<p>Publisert av Kari Nordmann</p><h2>Kontakt</h2><p>Telefon: 62 00 00 00</p>"
		)
		const { input } = setup({ pages: { [BV]: page }, units: [unit({ address: undefined })] })
		const { lock } = await verifyKommune(input)
		expect(lock.units[0]?.fields.website).toMatchObject({ status: "accepted", value: BV })
		expect(JSON.stringify(lock)).not.toMatch(/Kari|Nordmann/)
	})

	it("accepts an address Kartverket knows without the mobile that follows it on the page", async () => {
		const page = html(
			`${H1}<h2>Kontakt</h2><p>Besøksadresse: Storgata 1, 2609 Lillehammer. Telefon 900 00 000</p>`
		)
		const { input } = setup({ pages: { [BV]: page }, units: [unit({ address: undefined })] })
		const { lock } = await verifyKommune(input)
		expect(lock.units[0]?.fields.address).toMatchObject({
			status: "accepted",
			value: "Storgata 1, 2609 Lillehammer",
			addressId: "a1",
		})
		expect(lock.units[0]?.fields.address?.value).not.toContain("900")
	})

	it("sends two different service numbers on one rank to review", async () => {
		const page = html(`${H1}<h2>Kontakt</h2><p>Telefon: 62 00 00 00</p><p>Telefon: 62 00 00 02</p>`)
		const { input } = setup({ pages: { [BV]: page }, units: [unit({ address: undefined })] })
		const { lock } = await verifyKommune(input)
		expect(lock.units[0]?.fields.phone).toMatchObject({
			status: "review",
			reason: expect.stringContaining("agreement"),
		})
	})

	it("uses the kommune's Brreg switchboard, labelled, only when ranks 1 and 2 are empty", async () => {
		const page = html(`${H1}<p>Vi har drop-in.</p>`)
		const { input } = setup({
			pages: { [BV]: page },
			units: [unit({ address: undefined })],
			switchboard: { phone: "62 00 00 05", orgNumber: "999999981" },
		})
		const { lock } = await verifyKommune(input)
		expect(lock.units[0]?.fields.phone).toMatchObject({
			status: "accepted",
			value: "62 00 00 05",
			role: "Sentralbord",
			evidence: { kind: "register", register: "brreg", recordId: "999999981" },
			sourceUrl: "https://data.brreg.no/enhetsregisteret/api/enheter/999999981",
		})
	})

	it("never includes a page two register units match, and sends its contact values to review", async () => {
		const page = html(`${H1}<h2>Kontakt</h2><p>Telefon: 62 00 00 00</p>`)
		const units = [
			unit({ address: undefined }),
			unit({
				orgNumber: "999999992",
				name: "EKSEMPEL KOMMUNE BARNEVERNTJENESTE NORD",
				address: undefined,
			}),
		]
		const { input } = setup({ pages: { [BV]: page }, units })
		const { lock, curated } = await verifyKommune(input)
		expect(lock.units.map((u) => [u.inclusion?.status, u.fields.phone?.status])).toEqual([
			["review", "review"],
			["review", "review"],
		])
		expect(lock.units[0]?.fields.phone?.reason).toContain("the page is shared by 2 units")
		expect(curated.units).toEqual([])
	})

	it("on a page listing three services, accepts for each unit only the block whose heading names it", async () => {
		const hub = `${K}/helsestasjoner/`
		const page = readFileSync(new URL("./fixtures/pages/shared-page.html", import.meta.url), "utf8")
		const units = ["SENTRUM", "NORD", "SØR"].map((part, i) =>
			unit({
				orgNumber: `99999999${i + 1}`,
				name: `EKSEMPEL HELSESTASJON ${part}`,
				naeringskode: "86.942",
				website: hub,
				address: undefined,
			})
		)
		const { input } = setup({ pages: { [hub]: page }, units })
		const { lock } = await verifyKommune(input)
		expect(
			lock.units.map((u) => [u.unitId, u.fields.phone?.status, u.fields.phone?.value])
		).toEqual([
			["org:999999991", "accepted", "62 00 00 01"],
			["org:999999992", "accepted", "62 00 00 02"],
			["org:999999993", "accepted", "62 00 00 03"],
		])
		expect(lock.units.every((u) => u.inclusion?.status === "review")).toBe(true)
		expect(lock.units[0]?.fields.name?.status).toBe("review")
	})

	it("applies my answers: accept and edit become my decision, reject drops the value", async () => {
		const page = html(
			`${H1}<h2>Kontakt</h2><p>Telefon: 62 00 00 00</p><p>E-post: post@eksempel.kommune.no</p>`
		)
		const units = [
			unit({ address: undefined }),
			unit({
				orgNumber: "999999992",
				name: "EKSEMPEL KOMMUNE BARNEVERNTJENESTE NORD",
				address: undefined,
			}),
		]
		const curated: CuratedFile = {
			kommune: "3405",
			name: "Lillehammer",
			units: [
				answer([
					{
						field: "phone",
						value: "62 00 00 00",
						sourceUrl: BV,
						decision: "edit",
						editedValue: "62 00 00 09",
						decidedOn: "2026-11-06",
					},
					{
						field: "email",
						value: "post@eksempel.kommune.no",
						sourceUrl: BV,
						decision: "reject",
						decidedOn: "2026-11-06",
					},
				]),
				answer(
					[
						{
							field: "phone",
							value: "62 00 00 00",
							sourceUrl: BV,
							decision: "accept",
							decidedOn: "2026-11-06",
						},
					],
					{
						unitId: "org:999999992",
						name: "Eksempel barneverntjeneste nord",
						sources: { orgNumber: "999999992", pages: [BV] },
					}
				),
			],
		}
		const { input } = setup({ pages: { [BV]: page }, units, curated })
		const { lock } = await verifyKommune(input)
		const [first, second] = lock.units
		expect(first?.fields.phone).toMatchObject({
			status: "accepted",
			value: "62 00 00 09",
			evidence: { kind: "decision", decidedOn: "2026-11-06" },
		})
		expect(first?.fields.email).toMatchObject({
			status: "dropped",
			reason: "my decision of 06.11.2026: rejected",
		})
		expect(second?.fields.phone).toMatchObject({ status: "accepted", value: "62 00 00 00" })
	})

	it("still runs the validity gate on my edit", async () => {
		const page = html(`${H1}<h2>Kontakt</h2><p>Telefon: 62 00 00 00</p>`)
		const decisions = [
			{
				field: "phone" as const,
				value: "62 00 00 00",
				sourceUrl: BV,
				decision: "edit" as const,
				editedValue: "12345",
				decidedOn: "2026-11-06",
			},
		]
		const curated: CuratedFile = {
			kommune: "3405",
			name: "Lillehammer",
			units: [answer(decisions)],
		}
		const { input } = setup({
			pages: { [BV]: page },
			units: [unit({ address: undefined })],
			curated,
		})
		const { lock } = await verifyKommune(input)
		expect(lock.units[0]?.fields.phone).toMatchObject({
			status: "dropped",
			reason: expect.stringContaining("validity"),
		})
	})

	it("copies the role I typed into an edited mobile, so the safety gate passes it", async () => {
		const page = html(`${H1}<h2>Kontakt</h2><p>Telefon: 62 00 00 00</p>`)
		const decisions = [
			{
				field: "phone" as const,
				value: "62 00 00 00",
				sourceUrl: BV,
				decision: "edit" as const,
				editedValue: "900 00 009",
				role: "Avdelingsleder",
				decidedOn: "2026-11-06",
			},
		]
		const curated: CuratedFile = {
			kommune: "3405",
			name: "Lillehammer",
			units: [answer(decisions)],
		}
		const { input } = setup({
			pages: { [BV]: page },
			units: [unit({ address: undefined })],
			curated,
		})
		const { lock } = await verifyKommune(input)
		expect(lock.units[0]?.fields.phone).toMatchObject({
			status: "accepted",
			value: "900 00 009",
			role: "Avdelingsleder",
		})
	})

	it("resolves my edited address through Kartverket, so the edit is accepted with its address id", async () => {
		const decisions = [
			{
				field: "address" as const,
				value: "Storgata 1, 2609 Lillehammer",
				sourceUrl: BV,
				decision: "edit" as const,
				editedValue: "Storgata 2, 2609 Lillehammer",
				decidedOn: "2026-11-06",
			},
		]
		const curated: CuratedFile = {
			kommune: "3405",
			name: "Lillehammer",
			units: [answer(decisions)],
		}
		const { input } = setup({ pages: { [BV]: UNIT_PAGE }, units: [unit()], curated })
		const { lock } = await verifyKommune(input)
		expect(lock.units[0]?.fields.address).toMatchObject({
			status: "accepted",
			value: "Storgata 2, 2609 Lillehammer",
			addressId: "a2",
		})
	})

	it("checks my edited website through the crawler, so a URL that answers 200 is accepted", async () => {
		const mine = `${K}/barnevern/kontakt/`
		const decisions = [
			{
				field: "website" as const,
				value: BV,
				sourceUrl: BV,
				decision: "edit" as const,
				editedValue: mine,
				decidedOn: "2026-11-06",
			},
		]
		const curated: CuratedFile = {
			kommune: "3405",
			name: "Lillehammer",
			units: [answer(decisions)],
		}
		const get = fakeGet({
			...KARTVERKET,
			[mine]: { body: "<html></html>", contentType: "text/html" },
		})
		const { input } = setup({ pages: { [BV]: UNIT_PAGE }, units: [unit()], curated, get })
		const { lock } = await verifyKommune(input)
		expect(lock.units[0]?.fields.website).toMatchObject({ status: "accepted", value: mine })
		expect(lock.units[0]?.fields.website?.gates.find((g) => g.gate === "validity")).toEqual({
			gate: "validity",
			pass: true,
		})
	})

	it("counts an answer that did not settle the field, and keeps it in review", async () => {
		const page = html(`${H1}<h2>Kontakt</h2><p>Telefon: 900 00 000</p>`)
		const decisions = [
			{
				field: "phone" as const,
				value: "900 00 000",
				sourceUrl: BV,
				decision: "accept" as const,
				decidedOn: "2026-11-06",
			},
		]
		const curated: CuratedFile = {
			kommune: "3405",
			name: "Lillehammer",
			units: [answer(decisions)],
		}
		const { input } = setup({
			pages: { [BV]: page },
			units: [unit({ address: undefined })],
			curated,
		})
		const { lock, counts } = await verifyKommune(input)
		expect(lock.units[0]?.fields.phone).toMatchObject({
			status: "review",
			evidence: { kind: "decision" },
			reason: expect.stringContaining("role label"),
		})
		expect(counts.answersUnsettled).toBe(1)
	})

	it("lets my accept settle a Lavterskel question the rule leaves open", async () => {
		const page = html(
			`${H1}<p>Du trenger ikke henvisning for å komme hit.</p><h2>Kontakt</h2><p>Telefon: 62 00 00 00</p>`
		)
		const asked = await verifyKommune(
			setup({ pages: { [BV]: page }, units: [unit({ address: undefined })] }).input
		)
		expect(asked.lock.units[0]?.fields.lowThreshold).toMatchObject({
			status: "review",
			value: false,
		})
		const decisions = [
			{
				field: "lowThreshold" as const,
				value: false,
				sourceUrl: BV,
				decision: "accept" as const,
				decidedOn: "2026-11-06",
			},
		]
		const curated: CuratedFile = {
			kommune: "3405",
			name: "Lillehammer",
			units: [answer(decisions)],
		}
		const { input } = setup({
			pages: { [BV]: page },
			units: [unit({ address: undefined })],
			curated,
		})
		const { lock, counts } = await verifyKommune(input)
		expect(lock.units[0]?.fields.lowThreshold).toMatchObject({
			status: "accepted",
			value: false,
			evidence: { kind: "decision" },
		})
		expect(counts.answersUnsettled).toBe(0)
	})

	it("keeps my edit in review when it contradicts the Lavterskel rule's own answer", async () => {
		const page = html(
			`${H1}<p>Du må ha henvisning fra fastlegen.</p><h2>Kontakt</h2><p>Telefon: 62 00 00 00</p>`
		)
		const asked = await verifyKommune(
			setup({ pages: { [BV]: page }, units: [unit({ address: undefined })] }).input
		)
		expect(asked.lock.units[0]?.fields.lowThreshold).toMatchObject({
			status: "accepted",
			value: false,
		})
		const decisions = [
			{
				field: "lowThreshold" as const,
				value: false,
				sourceUrl: BV,
				decision: "edit" as const,
				editedValue: true,
				decidedOn: "2026-11-06",
			},
		]
		const curated: CuratedFile = {
			kommune: "3405",
			name: "Lillehammer",
			units: [answer(decisions)],
		}
		const { input } = setup({
			pages: { [BV]: page },
			units: [unit({ address: undefined })],
			curated,
		})
		const { lock, counts } = await verifyKommune(input)
		expect(lock.units[0]?.fields.lowThreshold).toMatchObject({
			status: "review",
			value: true,
			reason: expect.stringContaining("the Lavterskel rule says no"),
		})
		expect(counts.answersUnsettled).toBe(1)
	})

	it("takes no values from a page fetched again after extract ran, my accepted answer included", async () => {
		const decisions = [
			{
				field: "phone" as const,
				value: "62 00 00 00",
				sourceUrl: BV,
				decision: "accept" as const,
				decidedOn: "2026-11-06",
			},
		]
		const curated: CuratedFile = {
			kommune: "3405",
			name: "Lillehammer",
			units: [answer(decisions)],
		}
		const changed = html(`${H1}<h2>Kontakt</h2><p>Telefon: 62 00 00 07</p>`)
		const { input } = setup({
			pages: { [BV]: UNIT_PAGE },
			units: [unit()],
			curated,
			refetched: { [BV]: changed },
		})
		const { lock, counts } = await verifyKommune(input)
		expect(counts.pagesStale).toBe(1)
		expect(
			lock.units.flatMap((u) => Object.values(u.fields)).filter((f) => f?.status === "accepted")
		).toEqual([])
	})

	it("ignores my answer when its quotes are no longer on the page", async () => {
		const decisions = [
			{
				field: "phone" as const,
				value: "62 00 00 00",
				sourceUrl: BV,
				decision: "accept" as const,
				decidedOn: "2026-11-06",
			},
		]
		const curated: CuratedFile = {
			kommune: "3405",
			name: "Lillehammer",
			units: [answer(decisions)],
		}
		const { input } = setup({ pages: { [BV]: UNIT_PAGE }, units: [unit()], curated })
		const moved = {
			...input.extraction,
			pages: input.extraction.pages.map((p) => ({
				...p,
				candidates: p.candidates.map((c) =>
					c.field === "phone"
						? {
								...c,
								evidence: { kind: "quote" as const, quotes: ["Telefon: 62 00 00 00 (fra 2025)"] },
							}
						: c
				),
			})),
		}
		const { lock } = await verifyKommune({ ...input, extraction: moved })
		expect(lock.units[0]?.fields.phone).toMatchObject({
			status: "dropped",
			reason: expect.stringContaining("grounding"),
		})
	})

	it("includes a legevakt that NKLM lists, and lets NKLM's street-only address and number agree as peers", async () => {
		// No path word and no code: only NKLM's list makes this page a legevakt.
		const akutt = `${K}/akutt/`
		const page = html(
			[
				"<h1>Eksempel legevakt</h1>",
				"<h2>Kontakt</h2>",
				"<p>Telefon: 62 00 00 00</p>",
				"<p>Besøksadresse: Storgata 1, 2609 Lillehammer</p>",
			].join("")
		)
		const legevakt = unit({
			name: "EKSEMPEL LEGEVAKT",
			naeringskode: undefined,
			website: akutt,
			address: undefined,
		})
		const { input } = setup({ pages: { [akutt]: page }, units: [legevakt] })
		const nklm = {
			date: "2026-01-01",
			rows: [
				{
					row: 2,
					name: "Eksempel legevakt",
					kommuner: ["3405"],
					phone: "62000000",
					address: "Storgata 1",
				},
			],
		}
		const { lock } = await verifyKommune({ ...input, nklm })
		const [u] = lock.units
		expect(u?.inclusion).toMatchObject({ status: "auto", suggestedCategories: ["nodtjenester"] })
		const agreement = (f: "phone" | "address") =>
			u?.fields[f]?.gates.find((g) => g.gate === "agreement")?.reason
		expect(u?.fields.phone).toMatchObject({ status: "accepted", value: "62 00 00 00" })
		expect(agreement("phone")).toBe("2 sources agree")
		expect(u?.fields.address).toMatchObject({ status: "accepted", addressId: "a1" })
		expect(agreement("address")).toBe("2 sources agree")
		// Without NKLM the page names no known service, so the unit waits for my answer.
		const without = await verifyKommune(input)
		expect(without.lock.units[0]?.inclusion?.status).toBe("review")
	})

	it("prints counts only", async () => {
		const { input } = setup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		const { counts } = await verifyKommune(input)
		const text = formatVerifySummary([counts])
		expect(text).toContain("3405 Lillehammer:")
		expect(text).toContain("0 pages fetched again since extract")
		for (const secret of [
			"62 00 00 00",
			"barnevern@",
			"eksempel.kommune.no",
			"Storgata",
			"999999991",
		]) {
			expect(text).not.toContain(secret)
		}
	})
})

describe("verifyAndWrite", () => {
	it("writes the lock and curated files of a kommune that completes", async () => {
		const { dir, input } = setup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		await verifyAndWrite(join(dir, "data"), input)
		expect(JSON.parse(readFileSync(lockPath(join(dir, "data"), "3405"), "utf8")).kommune).toBe(
			"3405"
		)
		expect(
			JSON.parse(readFileSync(join(dir, "data", "curated", "3405-lillehammer.json"), "utf8")).units
		).toHaveLength(1)
	})

	it("writes files data:check passes for a plain accepted unit", async () => {
		const { dir, input } = setup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		const counts = await verifyAndWrite(join(dir, "data"), input)
		expect(counts.accepted).toBeGreaterThan(0)
		expect(checkData(dir)).toEqual([])
	})

	it("writes files data:check passes after my edit", async () => {
		const page = html(`${H1}<h2>Kontakt</h2><p>Telefon: 62 00 00 00</p>`)
		const decisions = [
			{
				field: "phone" as const,
				value: "62 00 00 00",
				sourceUrl: BV,
				decision: "edit" as const,
				editedValue: "62 00 00 09",
				decidedOn: "2026-11-06",
			},
		]
		const curated: CuratedFile = {
			kommune: "3405",
			name: "Lillehammer",
			units: [answer(decisions)],
		}
		const { dir, input } = setup({
			pages: { [BV]: page },
			units: [unit({ address: undefined })],
			curated,
		})
		await verifyAndWrite(join(dir, "data"), input)
		expect(
			JSON.parse(readFileSync(lockPath(join(dir, "data"), "3405"), "utf8")).units[0].fields.phone
				.value
		).toBe("62 00 00 09")
		expect(checkData(dir)).toEqual([])
	})

	it("writes the curated file before the lock, so a failed lock save never leaves a lock with no curated file", async () => {
		const { dir, input } = setup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		const data = join(dir, "data")
		const rename = (from: string, to: string) => {
			if (to === lockPath(data, "3405")) throw Object.assign(new Error("full"), { code: "ENOSPC" })
			renameSync(from, to)
		}
		await expect(verifyAndWrite(data, input, { rename })).rejects.toThrow("could not save the lock")
		expect(existsSync(join(data, "curated", "3405-lillehammer.json"))).toBe(true)
		expect(existsSync(lockPath(data, "3405"))).toBe(false)
	})

	it("leaves the previous lock file byte for byte the same when the run stops halfway", async () => {
		const failing: Get = async () => {
			throw new Error("stopped halfway")
		}
		const { dir, input } = setup({ pages: { [BV]: UNIT_PAGE }, units: [unit()], get: failing })
		const data = join(dir, "data")
		mkdirSync(join(data, "lock"), { recursive: true })
		writeFileSync(lockPath(data, "3405"), '{"kommune":"3405","units":[]}\n')
		await expect(verifyAndWrite(data, input)).rejects.toThrow()
		expect(readFileSync(lockPath(data, "3405"), "utf8")).toBe('{"kommune":"3405","units":[]}\n')
	})
})

describe("review then verify", () => {
	it("gives a lock data:check passes when verify reads the edit my review wrote", async () => {
		const page = html(`${H1}<h2>Kontakt</h2><p>Telefon: 62 00 00 00</p><p>Telefon: 62 00 00 02</p>`)
		const { dir, input } = setup({ pages: { [BV]: page }, units: [unit({ address: undefined })] })
		const data = join(dir, "data")
		await verifyAndWrite(data, input)
		expect(
			JSON.parse(readFileSync(lockPath(data, "3405"), "utf8")).units[0].fields.phone.status
		).toBe("review")
		const files = readKommuneFiles(data)
		const stdin = new PassThrough()
		const done = runReview(files, {
			input: stdin,
			output: { write: () => true },
			isTTY: true,
			color: false,
			today: () => "2026-11-06",
			checks: {
				findAddress: async () => undefined,
				urlStatus: async () => 200,
				validKommuner: new Set(["3405"]),
			},
		})
		stdin.end("e\n62 00 00 09\n\n")
		expect(await done).toMatchObject({ outcome: "done", answered: 1 })
		const curated = JSON.parse(readFileSync(files[0]?.curatedPath ?? "", "utf8")) as CuratedFile
		await verifyAndWrite(data, { ...input, curated })
		const phone = JSON.parse(readFileSync(lockPath(data, "3405"), "utf8")).units[0].fields.phone
		expect(phone).toMatchObject({ status: "accepted", value: "62 00 00 09" })
		expect(phone.evidence).toMatchObject({ kind: "decision", decidedOn: "2026-11-06" })
		expect(checkData(dir)).toEqual([])
	})
})

describe("verifyEach", () => {
	const counts = (kommune: string) => ({ kommune }) as unknown as VerifyCounts
	it("finishes every kommune after one that stops, and names each one not finished", async () => {
		const run = async ({ kommune }: { kommune: string }) => {
			if (kommune === "3405") throw new VerifyError("3405: the curated file is not valid JSON")
			if (kommune === "3407") throw new SaveError("could not save the lock file", "x.tmp")
			if (kommune === "3411") throw new Error("Kari Nordmann 900 00 000")
			return kommune === "3412" ? undefined : counts(kommune)
		}
		const result = await verifyEach(
			["3405", "3407", "3411", "3412", "3413"].map((kommune) => ({ kommune })),
			run
		)
		expect(result.counts.map((c) => c.kommune)).toEqual(["3413"])
		expect(result.missing).toEqual(["3412"])
		expect(formatUnfinished(result.unfinished)).toBe(
			[
				"not finished: 3405, 3407, 3411",
				"3405: the curated file is not valid JSON",
				"3407: could not save the lock file",
				"3411: stopped on an unexpected error",
			].join("\n")
		)
	})
})

describe("readCuratedFile", () => {
	it("names the kommune, and never the file's text, when the file cannot be read", () => {
		const dir = mkdtempSync(join(tmpdir(), "varde-curated-"))
		const bad = join(dir, "3405-lillehammer.json")
		writeFileSync(bad, "{ Kari Nordmann")
		expect(() => readCuratedFile(bad, "3405")).toThrow("3405: the curated file is not valid JSON")
		writeFileSync(bad, '{"kommune":"3405"}')
		expect(() => readCuratedFile(bad, "3405")).toThrow(
			"3405: the curated file does not match its schema"
		)
	})
})

describe("the address place part", () => {
	const page = (line: string) => html(`${H1}<h2>Kontakt</h2><p>Besøksadresse: ${line}</p>`)
	// Kartverket's answer for Storgata 3: postcode 2999, and the poststed given (null: none).
	const storgata3 = (poststed: string | null, postnummer = "2999") =>
		fakeGet({
			...KARTVERKET,
			[addressQuery("storgata 3", "3405")]: address("a3", "Storgata 3", postnummer, poststed),
		})
	const lockFor = async (line: string, get: Get, curated?: CuratedFile) => {
		const { input } = setup({
			pages: { [BV]: page(line) },
			units: [unit({ address: undefined })],
			get,
			curated,
		})
		return (await verifyKommune(input)).lock
	}

	it("cuts a trailing name from the value, so redaction removes it from the quote too", async () => {
		const lock = await lockFor("Storgata 3, 2999 Eksempelby Kari Nordmann", storgata3("EKSEMPELBY"))
		expect(lock.units[0]?.fields.address).toMatchObject({
			status: "accepted",
			value: "Storgata 3, 2999 Eksempelby",
			addressId: "a3",
		})
		expect(JSON.stringify(lock)).not.toMatch(/Kari|Nordmann/)
	})

	it("cuts a trailing Telefon from the value", async () => {
		const lock = await lockFor(
			"Storgata 3, 2999 Eksempelby Telefon 62 00 00 00",
			storgata3("EKSEMPELBY")
		)
		expect(lock.units[0]?.fields.address).toMatchObject({
			status: "accepted",
			value: "Storgata 3, 2999 Eksempelby",
		})
	})

	it("leaves a clean value as the page wrote it", async () => {
		const lock = await lockFor("Storgata 3, 2999 Eksempelby", storgata3("EKSEMPELBY"))
		expect(lock.units[0]?.fields.address).toMatchObject({
			status: "accepted",
			value: "Storgata 3, 2999 Eksempelby",
			addressId: "a3",
		})
	})

	it("sends a different postcode to review through the validity gate, with the text before the comma alone", async () => {
		// pickAddress refuses a record with another postcode, so there is no hit and no place-part check.
		const lock = await lockFor("Storgata 3, 2998 Eksempelby Kari Nordmann", storgata3("EKSEMPELBY"))
		const field = lock.units[0]?.fields.address
		expect(field).toMatchObject({
			status: "review",
			value: "Storgata 3",
			reason: "validity: Kartverket does not know the address",
		})
		expect(field?.addressId).toBeUndefined()
		expect(JSON.stringify(lock)).not.toMatch(/Kari|Nordmann/)
	})

	it("does not count a register peer with the same line as a disagreement", async () => {
		// Brreg states the identical line, so it is the same claim as the page's, not a rival.
		const { input } = setup({
			pages: { [BV]: page("Storgata 3, 2998 Eksempelby") },
			units: [unit({ address: "Storgata 3, 2998 EKSEMPELBY" })],
			get: storgata3("EKSEMPELBY"),
		})
		const lock = (await verifyKommune(input)).lock
		expect(lock.units[0]?.fields.address).toMatchObject({
			status: "review",
			value: "Storgata 3",
			reason: "validity: Kartverket does not know the address",
		})
	})

	it("sends an answer with no poststed to review, with the street text alone", async () => {
		const lock = await lockFor("Storgata 3, 2999 Eksempelby Kari Nordmann", storgata3(null))
		expect(lock.units[0]?.fields.address).toMatchObject({
			status: "review",
			value: "Storgata 3",
			reason: PLACE_MISMATCH,
			addressId: "a3",
		})
		expect(JSON.stringify(lock)).not.toMatch(/Kari|Nordmann/)
	})

	it("sends a hyphenated poststed to review, and my accept settles it", async () => {
		const line = "Storgata 3, 2999 Nordre-Eksempelby"
		const before = await lockFor(line, storgata3("NORDRE EKSEMPELBY"))
		expect(before.units[0]?.fields.address).toMatchObject({
			status: "review",
			value: "Storgata 3",
			reason: PLACE_MISMATCH,
		})
		const decisions = [
			{
				field: "address" as const,
				value: "Storgata 3",
				sourceUrl: BV,
				decision: "accept" as const,
				decidedOn: "2026-11-06",
			},
		]
		const curated: CuratedFile = {
			kommune: "3405",
			name: "Lillehammer",
			units: [answer(decisions)],
		}
		const after = await lockFor(line, storgata3("NORDRE EKSEMPELBY"), curated)
		expect(after.units[0]?.fields.address).toMatchObject({
			status: "accepted",
			value: "Storgata 3",
			addressId: "a3",
		})
		expect(after.units[0]?.fields.address?.reason).toBeUndefined()
	})
})
