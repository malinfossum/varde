import type { AnswerKey, KeyRow } from "../src/answerKey/schema.ts"
import type { DiscoveryFiles } from "../src/discover/files.ts"
import type { KommuneDiscovery } from "../src/discover/types.ts"
import { GATE_NAMES } from "../src/schema/common.ts"
import { type LockField, LockFile, type LockUnit } from "../src/schema/lock.ts"
import {
	type Check,
	type PilotInput,
	type PilotScore,
	type ScoreRefusal,
	scorePilot,
} from "../src/score/pilot.ts"
import { compareText } from "../src/score/sample.ts"
import { acceptedField, testInputs } from "./helpers.ts"

// A fictional pilot of three kommuner: 3401 lies outside the key, 3403 is in the key and blocks
// ClaudeBot, 3405 is in the key. Every name, number, host and org number here is made up.
export const AT = "2026-11-13T08:00:00Z"
export const PILOT_T = ["3401", "3403", "3405"]
export const KEY_T = ["3403", "3405"]
export const BLOCKED_T = ["3403"]
const NAMES: Readonly<Record<string, string>> = {
	"3401": "Eksempelby",
	"3403": "Prøveby",
	"3405": "Testby",
}

export const page = (path: string) => `https://www.eksempel.kommune.no/${path}/`
export const unitIdOf = (n: number) => `org:99999${String(n).padStart(4, "0")}`

export function keyRow(id: number, kommune: string, over: Partial<KeyRow["fields"]> = {}): KeyRow {
	const name = `Tjeneste ${id}`
	return {
		id,
		kommune,
		national: false,
		servedKommuner: [],
		parentId: null,
		name,
		nameEn: name,
		categories: ["rus"],
		fields: {
			phone: "62 00 00 00",
			address: null,
			email: null,
			website: null,
			chatUrl: null,
			openingHours: null,
			cost: null,
			costNote: null,
			alwaysOpen: false,
			lowThreshold: false,
			...over,
		},
	}
}

// Rows 1 to 10 in 3405 and row 11 in 3403.
export const KEY: AnswerKey = {
	frozenOn: "2026-11-10",
	source: "https://varde.pages.dev/data/resources.nb.json",
	rows: [...Array.from({ length: 10 }, (_, i) => keyRow(i + 1, "3405")), keyRow(11, "3403")],
}

export const INCLUDE_REVIEW: NonNullable<LockUnit["inclusion"]> = {
	status: "review",
	reason: "no category rule matched",
	suggestedCategories: [],
}

export function reviewField(reason: string, over: Partial<LockField> = {}): LockField {
	return acceptedField({ status: "review", reason, ...over })
}

export function droppedField(reason: string): LockField {
	return {
		status: "dropped",
		sourceUrl: page("borte"),
		fetchedAt: AT,
		verifiedAt: AT,
		gates: GATE_NAMES.map((gate) =>
			gate === "safety"
				? { gate, pass: false, onFail: "drop" as const, reason }
				: { gate, pass: true }
		),
		reason,
	}
}

// A unit whose name and phone are accepted from its own page. fields replace those two or add more.
export function named(
	n: number,
	name: string,
	fields: LockUnit["fields"] = {},
	over: Partial<LockUnit> = {}
): LockUnit {
	const url = page(`tjeneste-${n}`)
	return {
		unitId: unitIdOf(n),
		sources: [{ kind: "page", ref: url }],
		fields: {
			name: acceptedField({
				value: name,
				sourceUrl: url,
				evidence: { kind: "quote", quotes: [name] },
			}),
			phone: acceptedField({ sourceUrl: url }),
			...fields,
		},
		...over,
	}
}

export function lock(
	kommune: string,
	units: readonly LockUnit[],
	failed?: LockFile["failed"]
): LockFile {
	return LockFile.parse({
		kommune,
		inputs: testInputs(),
		units,
		...(failed === undefined ? {} : { failed }),
	})
}

export function baseLocks(): LockFile[] {
	return [
		lock(
			"3401",
			[41, 42, 43].map((n) => named(n, `Tilbud ${n}`))
		),
		lock("3403", [named(11, "Tjeneste 11")]),
		lock(
			"3405",
			Array.from({ length: 10 }, (_, i) => named(i + 1, `Tjeneste ${i + 1}`))
		),
	]
}

// The kommune's lock with these units put in (by unit id) or added, sorted by unit id.
export function withUnits(
	locks: readonly LockFile[],
	kommune: string,
	units: readonly LockUnit[]
): LockFile[] {
	return locks.map((l) => {
		if (l.kommune !== kommune) return l
		const byId = new Map(l.units.map((u) => [u.unitId, u]))
		for (const u of units) byId.set(u.unitId, u)
		return lock(
			kommune,
			[...byId.values()].sort((a, b) => compareText(a.unitId, b.unitId))
		)
	})
}

export function withoutUnits(
	locks: readonly LockFile[],
	kommune: string,
	unitIds: readonly string[]
): LockFile[] {
	return locks.map((l) =>
		l.kommune === kommune
			? lock(
					kommune,
					l.units.filter((u) => !unitIds.includes(u.unitId))
				)
			: l
	)
}

// My check "right" on the name and phone of each sampled unit in the base fixture.
export function sampleChecks(ns: readonly number[] = [41, 42, 43]): Check[] {
	return ns.flatMap((n) =>
		(["name", "phone"] as const).map((field) => ({
			kind: "sample" as const,
			unitId: unitIdOf(n),
			field,
			ruling: "right" as const,
			note: "Matches the source page.",
			by: "me" as const,
		}))
	)
}

// What discover wrote for the three kommuner. pages lists each kommune's discovered page URLs.
export function discovery(pages: Readonly<Record<string, readonly string[]>> = {}): DiscoveryFiles {
	const kommune = (code: string): KommuneDiscovery => ({
		kommune: code,
		name: NAMES[code] ?? code,
		discoveredAt: AT,
		brregComplete: true,
		allSitemapUrls: [],
		units: [],
		pages: (pages[code] ?? []).map((url) => ({ url, from: "sitemap" as const })),
	})
	return {
		report: {
			ranAt: AT,
			date: "2026-11-13",
			only: ["pilot"],
			kommuner: PILOT_T,
			renumberings: [],
			nameMismatches: [],
			problems: [],
			hosts: [],
			notFetched: [],
		},
		hosts: [{ host: "www.eksempel.kommune.no", kind: "kommune", licence: "ownPage" }],
		kommuner: PILOT_T.map(kommune),
		national: { discoveredAt: AT, pages: [], catalogues: [], navOffices: 0 },
	}
}

// A pilot that meets all five rules: 14 units, 11 key rows found, a sample of 3 units, each
// sampled field checked "right" by me.
export function pilotInput(over: Partial<PilotInput> = {}): PilotInput {
	return {
		pilot: PILOT_T,
		keyKommuner: KEY_T,
		blocked: BLOCKED_T,
		blockedHosts: [],
		locks: baseLocks(),
		curated: [],
		key: KEY,
		decideOnce: [],
		checks: { checks: sampleChecks() },
		known: { entries: [] },
		discovery: discovery(),
		crawl: { hosts: [], notFetched: [] },
		extracted: {},
		...over,
	}
}

export function scored(input: PilotInput): PilotScore {
	const result = scorePilot(input)
	if (result.refused) throw new Error(`refused: ${result.problems.join("; ")}`)
	return result
}

export function refusal(input: PilotInput): ScoreRefusal {
	const result = scorePilot(input)
	if (!result.refused) throw new Error("scored, but it should refuse")
	return result
}
