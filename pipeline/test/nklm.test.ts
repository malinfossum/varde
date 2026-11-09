import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import type { Get } from "../src/net/crawler.ts"
import {
	fetchNklm,
	kommuneLookup,
	loadNklm,
	nklmRecordId,
	readNklm,
	sha256Hex,
} from "../src/registers/nklm.ts"
import { buildXlsx } from "./xlsxHelpers.ts"

const NOW = "2026-11-06T10:00:00Z"
const COLUMNS = { name: "Legevakt", kommuner: "Kommuner", phone: "Telefon", address: "Adresse" }
const header = ["Legevakt", "Kommuner", "Telefon", "Adresse"]
const rows = [
	["Oversikt over legevakter (fiktiv)"],
	header,
	["Eksempel legevakt", "Lillehammer, Øyer og 3407", "62 00 00 00", "Storgata 1, 2609 Lillehammer"],
	["Annen legevakt", "Ukjentby", "62 00 00 01", ""],
]
const bytes = buildXlsx(rows)
const EDITIONS = [{ date: "2026-01-01", sha256: sha256Hex(bytes) }]
const lookup = kommuneLookup([
	{ code: "3405", name: "Lillehammer" },
	{ code: "3440", name: "Øyer" },
	{ code: "3407", name: "Gjøvik" },
])

describe("readNklm", () => {
	it("reads each legevakt with the kommuner it covers, by name or number", () => {
		expect(readNklm(bytes, lookup, EDITIONS, COLUMNS)).toEqual({
			ok: true,
			date: "2026-01-01",
			unknownKommuner: 1,
			rows: [
				{
					row: 3,
					name: "Eksempel legevakt",
					kommuner: ["3405", "3440", "3407"],
					phone: "62 00 00 00",
					address: "Storgata 1, 2609 Lillehammer",
				},
				{ row: 4, name: "Annen legevakt", kommuner: [], phone: "62 00 00 01" },
			],
		})
		expect(nklmRecordId("2026-01-01", 3)).toBe("2026-01-01#3")
	})

	it("places a bare name of a bracketed KLASS kommune only beside another kommune of its county", () => {
		const shared = buildXlsx([
			header,
			["Eksempel legevakt", "Kongsvinger og Våler", "62 00 00 00", ""],
			["Annen legevakt", "Moss, Våler", "62 00 00 01", ""],
		])
		const counties = kommuneLookup([
			{ code: "3401", name: "Kongsvinger" },
			{ code: "3419", name: "Våler (Innlandet)" },
		])
		const read = readNklm(
			shared,
			counties,
			[{ date: "2026-01-01", sha256: sha256Hex(shared) }],
			COLUMNS
		)
		expect(read).toMatchObject({
			ok: true,
			unknownKommuner: 2,
			rows: [{ kommuner: ["3401", "3419"] }, { kommuner: [] }],
		})
		expect(counties.exact("Våler (Innlandet)")).toBe("3419")
		expect(counties.exact("Våler")).toBeUndefined()
	})

	it("stops on a new edition: nothing from it is used until the licence is checked", () => {
		const newer = buildXlsx([...rows, ["Ny legevakt", "Lillehammer", "62 00 00 02", ""]])
		expect(readNklm(newer, lookup, EDITIONS, COLUMNS)).toEqual({
			ok: false,
			reason: "new NKLM edition: licence check needed",
		})
	})

	it("stops when a column is missing or renamed, naming the column", () => {
		const renamed = buildXlsx([["Legevakt", "Kommune", "Telefon", "Adresse"], rows[2] ?? []])
		const editions = [{ date: "2026-01-01", sha256: sha256Hex(renamed) }]
		expect(readNklm(renamed, lookup, editions, COLUMNS)).toEqual({
			ok: false,
			reason: "the NKLM file has no column Kommuner",
		})
	})

	it("passes the xlsx reader's refusal on", () => {
		const notZip = new TextEncoder().encode("ikke en fil")
		const editions = [{ date: "2026-01-01", sha256: sha256Hex(notZip) }]
		expect(readNklm(notZip, lookup, editions, COLUMNS)).toEqual({
			ok: false,
			reason: "the NKLM file could not be read: notAZip",
		})
	})
})

describe("loadNklm and fetchNklm", () => {
	const URL_X = "https://nklm.norceresearch.no/fil.xlsx"
	const serve =
		(body: Uint8Array): Get =>
		async (url) => ({
			ok: true,
			url,
			finalUrl: url,
			status: 200,
			contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			headers: {},
			body: "",
			bytes: Buffer.from(body),
			fetchedAt: NOW,
		})

	it("takes a local file first, else the last saved copy", () => {
		const dir = mkdtempSync(join(tmpdir(), "varde-nklm-"))
		expect(loadNklm(dir)).toBeUndefined()
		const local = join(dir, "lokal.xlsx")
		writeFileSync(local, bytes)
		expect(loadNklm(dir, local)).toEqual(new Uint8Array(bytes))
	})

	it("says so when no file URL is known", async () => {
		const dir = mkdtempSync(join(tmpdir(), "varde-nklm-"))
		expect(await fetchNklm(serve(bytes), dir, NOW, { url: undefined, editions: EDITIONS })).toEqual(
			{
				ok: false,
				reason: "no NKLM file URL is known: use --nklm-file",
			}
		)
	})

	it("saves a licensed edition, and keeps that copy when a new edition comes", async () => {
		const dir = mkdtempSync(join(tmpdir(), "varde-nklm-"))
		const source = { url: URL_X, editions: EDITIONS }
		expect(await fetchNklm(serve(bytes), dir, NOW, source)).toEqual({ ok: true, changed: true })
		expect(await fetchNklm(serve(bytes), dir, NOW, source)).toEqual({ ok: true, changed: false })
		expect(loadNklm(dir)).toEqual(new Uint8Array(bytes))
		const newer = buildXlsx([...rows, ["Ny legevakt", "Lillehammer", "62 00 00 02", ""]])
		expect(await fetchNklm(serve(newer), dir, NOW, source)).toEqual({
			ok: false,
			reason: "new NKLM edition: licence check needed",
		})
		expect(loadNklm(dir)).toEqual(new Uint8Array(bytes))
	})
})
