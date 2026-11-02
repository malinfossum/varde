import { comparable } from "../gates/compare.ts"
import type { FieldName } from "../schema/common.ts"
import type { LockFile, LockUnit } from "../schema/lock.ts"
import type { AnswerKey, KeyRow } from "./schema.ts"

export type Wrong = { keyId: number; unitId: string; field: string }
export type Score = {
	units: number
	unitsWithReview: number
	keyRows: number
	found: number
	wrong: Wrong[]
	badgeMismatches: number[]
	pass: boolean
}

const COMPARED = [
	"phone",
	"address",
	"email",
	"website",
	"chatUrl",
	"openingHours",
	"cost",
	"costNote",
	"alwaysOpen",
] as const satisfies readonly FieldName[]

function accepted(unit: LockUnit, field: FieldName): string | boolean | undefined {
	const f = unit.fields[field]
	return f?.status === "accepted" ? f.value : undefined
}

// A unit matches a key row by name, or (when it was renamed) by address and phone together.
export function matchKeyRow(unit: LockUnit, rows: readonly KeyRow[]): KeyRow | undefined {
	const name = accepted(unit, "name")
	if (typeof name === "string") {
		const byName = rows.find((r) => comparable("name", r.name) === comparable("name", name))
		if (byName !== undefined) return byName
	}
	const address = accepted(unit, "address")
	const phone = accepted(unit, "phone")
	if (typeof address !== "string" || typeof phone !== "string") return undefined
	return rows.find(
		(r) =>
			r.fields.address !== null &&
			r.fields.phone !== null &&
			comparable("address", r.fields.address) === comparable("address", address) &&
			comparable("phone", r.fields.phone) === comparable("phone", phone)
	)
}

// The spec's pass mark: no wrong value, at most 1 row in 10 in review, at least 9 in 10 key
// rows found, and badges that match the key apart from rows I decide once.
export function score(input: {
	locks: readonly LockFile[]
	key: AnswerKey
	kommuner: readonly string[]
	decideOnce: readonly number[]
}): Score {
	const inScope = input.key.rows.filter(
		(r) => !r.national && r.kommune !== null && input.kommuner.includes(r.kommune)
	)
	const found = new Set<number>()
	const wrong: Wrong[] = []
	const badgeMismatches: number[] = []
	let units = 0
	let unitsWithReview = 0
	for (const lock of input.locks) {
		const rows = inScope.filter((r) => r.kommune === lock.kommune)
		for (const unit of lock.units) {
			units++
			if (Object.values(unit.fields).some((f) => f?.status === "review")) unitsWithReview++
			const row = matchKeyRow(unit, rows)
			if (row === undefined) continue
			found.add(row.id)
			for (const field of COMPARED) {
				const value = accepted(unit, field)
				const expected = row.fields[field]
				if (value === undefined || expected === null) continue
				if (comparable(field, value) !== comparable(field, expected)) {
					wrong.push({ keyId: row.id, unitId: unit.unitId, field })
				}
			}
			const badge = accepted(unit, "lowThreshold")
			if (
				badge !== undefined &&
				badge !== row.fields.lowThreshold &&
				!input.decideOnce.includes(row.id)
			) {
				badgeMismatches.push(row.id)
			}
		}
	}
	const keyRows = inScope.length
	const pass =
		wrong.length === 0 &&
		unitsWithReview * 10 <= units &&
		found.size * 10 >= keyRows * 9 &&
		badgeMismatches.length === 0
	return { units, unitsWithReview, keyRows, found: found.size, wrong, badgeMismatches, pass }
}
