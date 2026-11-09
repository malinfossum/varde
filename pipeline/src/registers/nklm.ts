import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { writeFileAtomic, writeJsonAtomic } from "../io/files.ts"
import type { Get } from "../net/crawler.ts"
import { foldNorwegian } from "../text/normalise.ts"
import { readFirstSheet } from "../xlsx/read.ts"

// NKLM's list of legevakter («Oversikt over legevakter i Norge, NKLM (NORCE), per 01.01.2026»),
// licence granted by email on 05.11.2026. It finds legevakter and the kommuner each covers. NKLM
// makes the file by hand, so its phone and address are only ever peers for the agreement gate:
// they must agree with the legevakt's own page, never stand alone.

// The file's page, as the spec's Sources list names it: the source URL of every NKLM fact and
// the page the credit links to. Checked 09.11.2026.
export const NKLM_PAGE =
	"https://nklm.norceresearch.no/en/file/offisiell-oversikt-over-legevakter-og-legevaktsentraler-i-norge"
// The file itself, when a page serves the edition the licence covers (Step 7 writes it).
// Without it, the file comes through --nklm-file.
export const NKLM_FILE_URL: string | undefined = undefined

export type NklmEdition = { date: string; sha256: string }
// The editions the licence covers, by the file's own hash. Any other file stops the NKLM step,
// whatever its name or date says, until I record that the permission covers it too
// (docs/licence-requests/README.md).
export const NKLM_EDITIONS: readonly NklmEdition[] = [
	{
		date: "2026-01-01",
		sha256: "73c537f007d995a58a5e6f88da57754206cf2462752f22d61407f443a2611010",
	},
]

export type NklmColumns = { name: string; kommuner: string; phone: string; address: string }
// The header names of the 01.01.2026 file, checked 09.11.2026.
export const NKLM_COLUMNS: NklmColumns = {
	name: "Legevaktnavn 010126",
	kommuner: "Hovedkommuner 010126",
	phone:
		"Fast og offentlig kjent 8-sifret direktenummer til legevaktsentralen (i tillegg til 116 117)",
	address: "Besøksadresse legevakt 010126",
}

export type NklmRow = {
	row: number
	name: string
	kommuner: string[]
	phone?: string
	address?: string
}
export type NklmRead =
	| { ok: true; date: string; rows: NklmRow[]; unknownKommuner: number }
	| { ok: false; reason: string }

export const sha256Hex = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex")
export const nklmRecordId = (date: string, row: number) => `${date}#${row}`

export type KommuneLookup = {
	exact: (token: string) => string | undefined
	bare: (token: string) => string | undefined
}

const BRACKETED = /\s*\([^()]*\)\s*$/

// A kommune by its four-digit number or its KLASS name, folded: "Øyer", "oyer" and "3440" are
// one. KLASS puts the county in brackets on a name two kommuner share in the country ("Våler
// (Innlandet)" and "Våler (Østfold)"), so a bare "Våler" is ambiguous by KLASS's own word.
// bare gives the bracketed kommune of that bare name in this list, and readNklm takes it only
// beside another kommune of the same county on the same row. The list holds only the kommuner
// discovered, so being alone in it proves nothing about the country.
export function kommuneLookup(kommuner: readonly { code: string; name: string }[]): KommuneLookup {
	const byName = new Map(kommuner.map((k) => [foldNorwegian(k.name), k.code]))
	const bare = new Map<string, string[]>()
	for (const k of kommuner) {
		if (!BRACKETED.test(k.name)) continue
		const key = foldNorwegian(k.name.replace(BRACKETED, ""))
		bare.set(key, [...(bare.get(key) ?? []), k.code])
	}
	const codes = new Set(kommuner.map((k) => k.code))
	return {
		exact: (token) => {
			const t = token.trim()
			if (/^\d{4}$/.test(t)) return codes.has(t) ? t : undefined
			return byName.get(foldNorwegian(t))
		},
		bare: (token) => {
			const found = bare.get(foldNorwegian(token.trim()))
			return found?.length === 1 ? found[0] : undefined
		},
	}
}

const SEPARATOR = /\s*[,;\n/]\s*|\s+og\s+/

// Reasons may name a column header (public) but never a cell's value.
export function readNklm(
	bytes: Uint8Array,
	kommune: KommuneLookup,
	editions: readonly NklmEdition[] = NKLM_EDITIONS,
	columns: NklmColumns = NKLM_COLUMNS
): NklmRead {
	const edition = editions.find((e) => e.sha256 === sha256Hex(bytes))
	if (edition === undefined) return { ok: false, reason: "new NKLM edition: licence check needed" }
	const sheet = readFirstSheet(bytes)
	if (!sheet.ok) return { ok: false, reason: `the NKLM file could not be read: ${sheet.error}` }
	const headerAt = sheet.rows.findIndex((r) => r.some((c) => c.trim() === columns.name))
	const header = sheet.rows[headerAt] ?? []
	const index: Partial<Record<keyof NklmColumns, number>> = {}
	for (const key of Object.keys(columns) as (keyof NklmColumns)[]) {
		const at = header.findIndex((c) => c.trim() === columns[key])
		if (at < 0) return { ok: false, reason: `the NKLM file has no column ${columns[key]}` }
		index[key] = at
	}
	let unknownKommuner = 0
	const rows: NklmRow[] = []
	// rows[n] is spreadsheet row n + 1 (Task 11), so a record id is the row number Excel shows.
	sheet.rows.slice(headerAt + 1).forEach((cells, i) => {
		const cell = (key: keyof NklmColumns) => (cells[index[key] ?? -1] ?? "").trim()
		const name = cell("name")
		if (name === "") return
		const tokens = cell("kommuner")
			.split(SEPARATOR)
			.filter((t) => t !== "")
		const exact = tokens.map((t) => kommune.exact(t))
		const counties = new Set(exact.flatMap((c) => (c === undefined ? [] : [c.slice(0, 2)])))
		const codes: string[] = []
		tokens.forEach((t, j) => {
			const bare = exact[j] === undefined ? kommune.bare(t) : undefined
			const code =
				exact[j] ?? (bare !== undefined && counties.has(bare.slice(0, 2)) ? bare : undefined)
			if (code === undefined) unknownKommuner++
			else if (!codes.includes(code)) codes.push(code)
		})
		const row: NklmRow = { row: headerAt + 2 + i, name, kommuner: codes }
		if (cell("phone") !== "") row.phone = cell("phone")
		if (cell("address") !== "") row.address = cell("address")
		rows.push(row)
	})
	return { ok: true, date: edition.date, rows, unknownKommuner }
}

const FILE = "nklm.xlsx"
const STATE = "state.json"

// A local file I name, else the copy the last --nklm-fetch saved in <cache>/nklm/.
export function loadNklm(dir: string, file?: string): Uint8Array | undefined {
	const path = file ?? join(dir, FILE)
	return existsSync(path) ? new Uint8Array(readFileSync(path)) : undefined
}

function readState(path: string): { sha256?: string } {
	try {
		return existsSync(path) ? (JSON.parse(readFileSync(path, "utf8")) as { sha256?: string }) : {}
	} catch {
		return {}
	}
}

export type NklmSource = { url: string | undefined; editions: readonly NklmEdition[] }

// Fetches the file only when asked, and keeps its date, hash and URL in state.json, so a run can
// tell me whether it changed. Only a licensed edition replaces the saved copy: a new edition is
// recorded in state.json and stops the step, and the last licensed copy stays for the next run.
// The raw file stays in the cache folder and is never committed.
export async function fetchNklm(
	get: Get,
	dir: string,
	now: string,
	source: NklmSource = { url: NKLM_FILE_URL, editions: NKLM_EDITIONS }
): Promise<{ ok: true; changed: boolean } | { ok: false; reason: string }> {
	if (source.url === undefined) {
		return { ok: false, reason: "no NKLM file URL is known: use --nklm-file" }
	}
	const res = await get(source.url, "binary")
	if (!res.ok || res.bytes === undefined) {
		return { ok: false, reason: "the NKLM file was not fetched" }
	}
	const bytes = new Uint8Array(res.bytes)
	const sha256 = sha256Hex(bytes)
	const statePath = join(dir, STATE)
	const before = readState(statePath)
	const date = source.editions.find((e) => e.sha256 === sha256)?.date
	if (date !== undefined) writeFileAtomic(join(dir, FILE), bytes)
	writeJsonAtomic(statePath, { date: date ?? null, sha256, url: source.url, savedAt: now })
	if (date === undefined) return { ok: false, reason: "new NKLM edition: licence check needed" }
	return { ok: true, changed: before.sha256 !== sha256 }
}
