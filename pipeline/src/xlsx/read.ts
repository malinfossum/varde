import { load } from "cheerio/slim"
import { Unzip, UnzipInflate } from "fflate"

// The .xlsx files the pipeline reads (NKLM's legevakt list) come from outside, so the zip is
// read with limits: only four entries, and at most 20 MB of real unpacked bytes over both
// passes, counted while they unpack. The size an entry declares is never trusted: a zip bomb
// lies about it. Entry names are only compared, never used as a path on disk.
export const MAX_UNPACKED = 20 * 1024 * 1024
export const MAX_ROWS = 1_048_576
export const WORKBOOK_ENTRIES = ["xl/workbook.xml", "xl/_rels/workbook.xml.rels"] as const
const SHARED_STRINGS = "xl/sharedStrings.xml"
// Compressed bytes are pushed in small chunks, so one push can unpack to at most about 16 MB
// (deflate's ratio limit) before the count is checked again.
const CHUNK = 16 * 1024

export type XlsxError = "notAZip" | "tooLarge" | "noSheet" | "unreadable"
export type XlsxResult =
	| { ok: true; sheetNames: string[]; rows: string[][] }
	| { ok: false; error: XlsxError }

type Unpacked =
	| { ok: true; files: Map<string, Uint8Array>; used: number }
	| { ok: false; error: XlsxError }

// One pass over the zip, keeping only the entries named. budget is what is left of the limit.
function unpack(bytes: Uint8Array, wanted: readonly string[], budget: number): Unpacked {
	const parts = new Map<string, Uint8Array[]>()
	let total = 0
	let seen = 0
	let error: XlsxError | undefined
	const unzip = new Unzip((file) => {
		seen++
		if (!wanted.includes(file.name)) return
		const chunks: Uint8Array[] = []
		parts.set(file.name, chunks)
		file.ondata = (err, data) => {
			if (err !== null) {
				error ??= "unreadable"
				return
			}
			total += data.length
			if (total > budget) {
				error = "tooLarge"
				file.terminate()
				return
			}
			chunks.push(data)
		}
		file.start()
	})
	unzip.register(UnzipInflate)
	try {
		for (let at = 0; at < bytes.length && error === undefined; at += CHUNK) {
			unzip.push(bytes.subarray(at, at + CHUNK), at + CHUNK >= bytes.length)
		}
	} catch {
		return { ok: false, error: seen === 0 ? "notAZip" : (error ?? "unreadable") }
	}
	if (error !== undefined) return { ok: false, error }
	if (seen === 0) return { ok: false, error: "notAZip" }
	const files = new Map<string, Uint8Array>()
	for (const [name, chunks] of parts) {
		const out = new Uint8Array(chunks.reduce((n, c) => n + c.length, 0))
		let at = 0
		for (const c of chunks) {
			out.set(c, at)
			at += c.length
		}
		files.set(name, out)
	}
	return { ok: true, files, used: total }
}

const decode = (bytes: Uint8Array) => new TextDecoder("utf-8").decode(bytes)

// The first <sheet> in the workbook, through its r:id in the relationships file. A target is
// relative to xl/, or absolute from the zip's root ("/xl/worksheets/sheet1.xml"). A target that
// climbs out of xl/ is no sheet.
function firstSheet(workbook: string, rels: string): { names: string[]; path: string } | undefined {
	const wb = load(workbook, { xml: true })
	const sheets = wb("sheets > sheet").toArray()
	const names = sheets.map((s) => wb(s).attr("name") ?? "")
	const id = sheets[0] === undefined ? undefined : wb(sheets[0]).attr("r:id")
	if (id === undefined) return undefined
	const r = load(rels, { xml: true })
	const rel = r("Relationship")
		.toArray()
		.find((el) => r(el).attr("Id") === id)
	const target = rel === undefined ? undefined : r(rel).attr("Target")
	if (target === undefined) return undefined
	const path = target.startsWith("/") ? target.slice(1) : `xl/${target}`
	if (!path.startsWith("xl/") || path.split("/").some((part) => part === ".." || part === "."))
		return undefined
	return { names, path }
}

// "AB12" is column 27 (0-based), so an empty cell keeps its place.
function columnOf(ref: string | undefined, fallback: number): number {
	const letters = /^([A-Z]{1,3})\d*$/.exec(ref ?? "")?.[1]
	if (letters === undefined) return fallback
	return [...letters].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1
}

// Cheerio in XML mode (htmlparser2's xmlMode) decodes only the five XML entities and numeric
// references, and never reads a DTD, so a declared entity, internal or external, stays text.
function sharedStrings(xml: string): string[] {
	const $ = load(xml, { xml: true })
	return $("si")
		.toArray()
		.map((si) =>
			$(si)
				.find("t")
				.filter((_, t) => $(t).parents("rPh").length === 0)
				.toArray()
				.map((t) => $(t).text())
				.join("")
		)
}

export function readFirstSheet(bytes: Uint8Array, limit = MAX_UNPACKED): XlsxResult {
	// Pass one: the workbook and its relationships, to learn which part is the first sheet.
	const book = unpack(bytes, WORKBOOK_ENTRIES, limit)
	if (!book.ok) return book
	const workbook = book.files.get("xl/workbook.xml")
	const rels = book.files.get("xl/_rels/workbook.xml.rels")
	if (workbook === undefined || rels === undefined) return { ok: false, error: "noSheet" }
	let sheet: { names: string[]; path: string } | undefined
	try {
		sheet = firstSheet(decode(workbook), decode(rels))
	} catch {
		return { ok: false, error: "unreadable" }
	}
	if (sheet === undefined) return { ok: false, error: "noSheet" }
	// Pass two: the shared strings and that sheet, inside what is left of the limit.
	const unpacked = unpack(bytes, [SHARED_STRINGS, sheet.path], limit - book.used)
	if (!unpacked.ok) return unpacked
	const xml = unpacked.files.get(sheet.path)
	if (xml === undefined) return { ok: false, error: "noSheet" }
	try {
		const shared = unpacked.files.has(SHARED_STRINGS)
			? sharedStrings(decode(unpacked.files.get(SHARED_STRINGS) ?? new Uint8Array()))
			: []
		const $ = load(decode(xml), { xml: true })
		const rows: string[][] = []
		for (const row of $("sheetData > row").toArray()) {
			// A row keeps its place by its r number; a row Excel left out stays an empty row.
			const r = Number($(row).attr("r"))
			const at = Number.isInteger(r) && r >= 1 ? r - 1 : rows.length
			if (at >= MAX_ROWS || at < rows.length) return { ok: false, error: "unreadable" }
			while (rows.length < at) rows.push([])
			const cells: string[] = []
			$(row)
				.children("c")
				.each((i, c) => {
					const cell = $(c)
					const type = cell.attr("t")
					const raw = cell.children("v").text()
					const value =
						type === "s"
							? (shared[Number(raw)] ?? "")
							: type === "inlineStr"
								? cell.find("is t").text()
								: raw
					const col = columnOf(cell.attr("r"), i)
					while (cells.length < col) cells.push("")
					cells[col] = value
				})
			rows.push(cells)
		}
		return { ok: true, sheetNames: sheet.names, rows }
	} catch {
		return { ok: false, error: "unreadable" }
	}
}
