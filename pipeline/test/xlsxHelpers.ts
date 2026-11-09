import { strToU8, zipSync } from "fflate"

const esc = (text: string) =>
	text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
const column = (i: number) => String.fromCharCode(65 + i)
const ns = 'xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"'
const rns = 'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"'

// The workbook and its relationships in the shape Excel writes: each sheet has an r:id, and the
// relationships file points that id at the sheet's part, relative to xl/.
export function workbookEntries(
	sheets: readonly { name: string; target: string }[] = [
		{ name: "Ark1", target: "worksheets/sheet1.xml" },
	]
): Record<string, Uint8Array> {
	const list = sheets
		.map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
		.join("")
	const rels = sheets
		.map((s, i) => `<Relationship Id="rId${i + 1}" Type="worksheet" Target="${esc(s.target)}"/>`)
		.join("")
	return {
		"xl/workbook.xml": strToU8(`<workbook ${ns} ${rns}><sheets>${list}</sheets></workbook>`),
		"xl/_rels/workbook.xml.rels": strToU8(`<Relationships>${rels}</Relationships>`),
	}
}

// A tiny workbook in the shape Excel writes: every text cell in the shared strings table.
export function buildXlsx(
	rows: readonly (readonly string[])[],
	extra: Record<string, Uint8Array> = {}
): Uint8Array {
	const strings: string[] = []
	const index = (s: string) => {
		const at = strings.indexOf(s)
		if (at >= 0) return at
		strings.push(s)
		return strings.length - 1
	}
	const sheetRows = rows
		.map(
			(row, r) =>
				`<row r="${r + 1}">${row.map((cell, c) => `<c r="${column(c)}${r + 1}" t="s"><v>${index(cell)}</v></c>`).join("")}</row>`
		)
		.join("")
	return zipSync({
		"[Content_Types].xml": strToU8("<Types/>"),
		...workbookEntries(),
		"xl/sharedStrings.xml": strToU8(
			`<sst ${ns}>${strings.map((s) => `<si><t>${esc(s)}</t></si>`).join("")}</sst>`
		),
		"xl/worksheets/sheet1.xml": strToU8(
			`<worksheet ${ns}><sheetData>${sheetRows}</sheetData></worksheet>`
		),
		...extra,
	})
}

const same = (a: Uint8Array, b: Uint8Array) =>
	a.length === b.length && a.every((x, i) => x === b[i])

// Rewrites the uncompressed size an entry declares, in its local header and in the central
// directory, the way a zip bomb lies about it.
export function lieAboutSize(zip: Uint8Array, entry: string, size: number): Uint8Array {
	const out = zip.slice()
	const view = new DataView(out.buffer)
	const name = strToU8(entry)
	for (let i = 0; i + 46 <= out.length; i++) {
		const sig = view.getUint32(i, true)
		if (
			sig === 0x04034b50 &&
			same(out.subarray(i + 30, i + 30 + view.getUint16(i + 26, true)), name)
		) {
			view.setUint32(i + 22, size, true)
		}
		if (
			sig === 0x02014b50 &&
			same(out.subarray(i + 46, i + 46 + view.getUint16(i + 28, true)), name)
		) {
			view.setUint32(i + 24, size, true)
		}
	}
	return out
}
