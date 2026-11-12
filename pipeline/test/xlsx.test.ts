import { strToU8, zipSync } from "fflate"
import { describe, expect, it } from "vitest"
import { MAX_UNPACKED, readFirstSheet } from "../src/xlsx/read.ts"
import { buildXlsx, lieAboutSize, workbookEntries } from "./xlsxHelpers.ts"

const sheetOnly = (sheet: string, extra: Record<string, Uint8Array> = {}) =>
	zipSync({ ...workbookEntries(), "xl/worksheets/sheet1.xml": strToU8(sheet), ...extra })

describe("readFirstSheet", () => {
	it("reads the rows of the first sheet, shared strings resolved, in column order", () => {
		const bytes = buildXlsx([
			["Navn", "Kommuner"],
			["Eksempel legevakt", "Eksempel, Annen"],
		])
		expect(readFirstSheet(bytes)).toEqual({
			ok: true,
			sheetNames: ["Ark1"],
			rows: [
				["Navn", "Kommuner"],
				["Eksempel legevakt", "Eksempel, Annen"],
			],
		})
	})

	it("keeps an empty cell's place by its column letter, and reads inline strings and numbers", () => {
		const sheet = `<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>a</t></is></c><c r="C1"><v>62000000</v></c></row></sheetData></worksheet>`
		expect(readFirstSheet(sheetOnly(sheet))).toMatchObject({
			ok: true,
			rows: [["a", "", "62000000"]],
		})
	})

	it("keeps a row Excel left out as an empty row, so a row's index is its row number less one", () => {
		const sheet = `<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>a</t></is></c></row><row r="3"><c r="A3" t="inlineStr"><is><t>c</t></is></c></row></sheetData></worksheet>`
		expect(readFirstSheet(sheetOnly(sheet))).toMatchObject({ ok: true, rows: [["a"], [], ["c"]] })
	})

	it("finds the first sheet through the workbook and its relationships, not by its file name", () => {
		const first = `<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>riktig</t></is></c></row></sheetData></worksheet>`
		const other = `<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>feil</t></is></c></row></sheetData></worksheet>`
		const bytes = zipSync({
			...workbookEntries([
				{ name: "Legevakter", target: "worksheets/sheet2.xml" },
				{ name: "Annet", target: "/xl/worksheets/sheet1.xml" },
			]),
			"xl/worksheets/sheet1.xml": strToU8(other),
			"xl/worksheets/sheet2.xml": strToU8(first),
		})
		expect(readFirstSheet(bytes)).toEqual({
			ok: true,
			sheetNames: ["Legevakter", "Annet"],
			rows: [["riktig"]],
		})
	})

	it("reads only the workbook, its relationships, the shared strings and the first sheet", () => {
		const big = new Uint8Array(MAX_UNPACKED + 1024)
		const bytes = buildXlsx([["Navn"]], {
			"xl/media/stort.bin": big,
			"xl/worksheets/sheet2.xml": big,
		})
		expect(readFirstSheet(bytes)).toMatchObject({ ok: true, rows: [["Navn"]] })
	})

	it("stops at 20 MB of real unpacked bytes", () => {
		const big = "a".repeat(MAX_UNPACKED + 1024)
		expect(
			readFirstSheet(sheetOnly("<worksheet/>", { "xl/sharedStrings.xml": strToU8(big) }))
		).toEqual({
			ok: false,
			error: "tooLarge",
		})
	})

	it("never trusts the size an entry declares: a small declared size that unpacks past the limit stops", () => {
		const big = `<sst>${"<si><t>a</t></si>".repeat(1_400_000)}</sst>`
		const honest = buildXlsx([["Navn"]], { "xl/sharedStrings.xml": strToU8(big) })
		const lying = lieAboutSize(honest, "xl/sharedStrings.xml", 100)
		expect(readFirstSheet(lying)).toEqual({ ok: false, error: "tooLarge" })
	})

	it("expands no entity, internal or external", () => {
		const sheet = `<?xml version="1.0"?><!DOCTYPE w [<!ENTITY e "HEMMELIG"><!ENTITY x SYSTEM "file:///C:/Windows/win.ini">]><worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>&e;&x;</t></is></c></row></sheetData></worksheet>`
		const result = readFirstSheet(sheetOnly(sheet))
		expect(result.ok).toBe(true)
		expect(JSON.stringify(result)).not.toMatch(/HEMMELIG|fonts|extensions/i)
	})

	it("refuses bytes that are not a zip, and a zip with no first sheet", () => {
		expect(readFirstSheet(strToU8("<html>ikke en fil</html>"))).toEqual({
			ok: false,
			error: "notAZip",
		})
		expect(readFirstSheet(zipSync({ "xl/workbook.xml": strToU8("<workbook/>") }))).toEqual({
			ok: false,
			error: "noSheet",
		})
		expect(readFirstSheet(zipSync(workbookEntries()))).toEqual({ ok: false, error: "noSheet" })
		const outside = zipSync({
			...workbookEntries([{ name: "Ark1", target: "../../hemmelig.xml" }]),
			"xl/../../hemmelig.xml": strToU8(
				'<worksheet><sheetData><row r="1"><c r="A1"><v>1</v></c></row></sheetData></worksheet>'
			),
		})
		expect(readFirstSheet(outside)).toEqual({ ok: false, error: "noSheet" })
	})
})
