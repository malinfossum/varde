import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { norwegianDate } from "../gates/grounding.ts"
import { isMobile } from "../gates/safety.ts"
import type { Origin } from "../gates/types.ts"
import {
	type CategorySlug,
	FIELD_NAMES,
	type FieldName,
	type FieldValue,
	type ProviderType,
} from "../schema/common.ts"
import { CuratedFile, findDecision } from "../schema/curated.ts"
import { type Evidence, LockFile } from "../schema/lock.ts"
import { findCuratedPath } from "../verify/verify.ts"

export class ReviewError extends Error {
	constructor(message: string) {
		super(message)
		this.name = "ReviewError"
	}
}

export type FieldItem = {
	kind: "field"
	kommune: string
	unitId: string
	unitName: string
	field: FieldName
	value: FieldValue
	role?: string
	// The origin verify used, so review checks my edit the way verify will (Task 16).
	origin?: Origin
	evidence: Evidence
	sourceUrl: string
	reason: string
	acute: boolean
	categories: CategorySlug[]
	// The date of my earlier answer, when verify applied it and the field is still in review.
	unsettled?: string
	// The page value that earlier answer is keyed by. For an edit it differs from the value shown,
	// which is mine; a new answer replaces the earlier one under this key.
	answerKey?: FieldValue
}
export type IncludeItem = {
	kind: "include"
	kommune: string
	unitId: string
	unitName: string
	reason: string
	suggestedCategories: CategorySlug[]
	providerType?: ProviderType
	sources: { kind: string; ref: string }[]
	acute: boolean
}
export type ReviewItem = FieldItem | IncludeItem
export type KommuneFiles = {
	kommune: string
	lock: LockFile
	curated: CuratedFile
	curatedPath: string
}

// --kommune must be a KLASS kommune number the last discover run read, checked before it is used
// in any file path. "../x" never reaches a path.
export function kommuneArg(
	value: string | undefined,
	known: ReadonlySet<string>
): { ok: true; kommune?: string } | { ok: false } {
	if (value === undefined) return { ok: true }
	return /^\d{4}$/.test(value) && known.has(value) ? { ok: true, kommune: value } : { ok: false }
}

// The parsed JSON of a file. Messages name the file only, since a parse error would quote it.
function readJson(path: string, label: string): unknown {
	try {
		return JSON.parse(readFileSync(path, "utf8"))
	} catch {
		throw new ReviewError(`${label} is not valid JSON`)
	}
}

// Every lock file in <data>/lock, with its kommune's curated file. Verify writes both, so a lock
// file without a curated file means verify did not finish.
export function readKommuneFiles(dataDir: string, only?: string): KommuneFiles[] {
	const dir = join(dataDir, "lock")
	if (!existsSync(dir)) return []
	return readdirSync(dir)
		.filter((f) => /^\d{4}\.json$/.test(f) && (only === undefined || f === `${only}.json`))
		.sort()
		.map((f) => {
			const kommune = f.slice(0, 4)
			const lock = LockFile.safeParse(readJson(join(dir, f), `lock/${f}`))
			if (!lock.success) throw new ReviewError(`lock/${f} does not match its schema`)
			const curatedPath = findCuratedPath(dataDir, kommune)
			if (curatedPath === undefined)
				throw new ReviewError(`${kommune} has no curated file: run verify first`)
			const curated = CuratedFile.safeParse(readJson(curatedPath, `the curated file of ${kommune}`))
			if (!curated.success)
				throw new ReviewError(`the curated file of ${kommune} does not match its schema`)
			return { kommune, lock: lock.data, curated: curated.data, curatedPath }
		})
}

const ACUTE: CategorySlug = "nodtjenester"

// My accept settles a review (decided 06.11.2026), except a mobile with no role: the safety gate
// passes it only with a role, so only an edit with a role, or a reject, can settle it.
export function canAccept(item: FieldItem): boolean {
	return !(
		item.field === "phone" &&
		typeof item.value === "string" &&
		isMobile(item.value) &&
		item.role === undefined
	)
}

// Every open question: fields in review that I have not answered, and "include this unit?" for
// units the curated file does not have yet. Acute units first, then kommune, unit and field. A
// field verify left in review after applying my answer (its evidence is my decision) is asked
// again, with that said, so an answer that did not settle never hides the field.
export function buildQueue(files: readonly KommuneFiles[]): ReviewItem[] {
	const items: ReviewItem[] = []
	for (const f of files) {
		for (const unit of f.lock.units) {
			const mine = f.curated.units.find((u) => u.unitId === unit.unitId)
			if (mine?.include === false) continue
			const categories = mine?.categories ?? unit.inclusion?.suggestedCategories ?? []
			const acute = categories.includes(ACUTE)
			const lockName = unit.fields.name?.value
			const unitName = mine?.name ?? (typeof lockName === "string" ? lockName : unit.unitId)
			const pending = mine === undefined && unit.inclusion?.status === "review"
			if (pending && unit.inclusion !== undefined) {
				items.push({
					kind: "include",
					kommune: f.kommune,
					unitId: unit.unitId,
					unitName,
					reason: unit.inclusion.reason,
					suggestedCategories: unit.inclusion.suggestedCategories,
					...(unit.inclusion.providerType === undefined
						? {}
						: { providerType: unit.inclusion.providerType }),
					sources: unit.sources,
					acute,
				})
			}
			if (mine === undefined && !pending) continue
			for (const name of FIELD_NAMES) {
				const field = unit.fields[name]
				if (field?.status !== "review" || field.value === undefined || field.evidence === undefined)
					continue
				const q = { field: name, value: field.value, sourceUrl: field.sourceUrl }
				const unsettled = field.evidence.kind === "decision" ? field.evidence.decidedOn : undefined
				if (
					unsettled === undefined &&
					mine !== undefined &&
					findDecision(mine.decisions, q) !== undefined
				)
					continue
				// The earlier answer verify applied: same field, same page, same date.
				const earlier =
					unsettled === undefined
						? undefined
						: mine?.decisions.find(
								(d) =>
									d.field === name && d.sourceUrl === field.sourceUrl && d.decidedOn === unsettled
							)
				const reason = field.reason ?? "review"
				items.push({
					kind: "field",
					kommune: f.kommune,
					unitId: unit.unitId,
					unitName,
					field: name,
					value: field.value,
					...(field.role === undefined ? {} : { role: field.role }),
					...(field.origin === undefined ? {} : { origin: field.origin }),
					evidence: field.evidence,
					sourceUrl: field.sourceUrl,
					reason:
						unsettled === undefined
							? reason
							: `my answer of ${norwegianDate(unsettled)} did not settle it: ${reason}`,
					acute,
					categories,
					...(unsettled === undefined ? {} : { unsettled }),
					...(earlier === undefined ? {} : { answerKey: earlier.value }),
				})
			}
		}
	}
	const rank = (i: ReviewItem) => (i.kind === "include" ? -1 : FIELD_NAMES.indexOf(i.field))
	return items.sort(
		(a, b) =>
			Number(b.acute) - Number(a.acute) ||
			a.kommune.localeCompare(b.kommune) ||
			a.unitId.localeCompare(b.unitId) ||
			rank(a) - rank(b)
	)
}
