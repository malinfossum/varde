import { createHash } from "node:crypto"
import type { CuratedFile } from "../schema/curated.ts"
import type { LockFile, LockUnit } from "../schema/lock.ts"

// The fixed seed of the sample outside the key. A new seed draws a new sample, and every row in it
// would wait for a new check by me, so it stays as it is.
export const SAMPLE_SEED = "varde-pilot-2026-11-13"
export const SAMPLE_SIZE = 20

// Plain code-unit order: the same on every machine and in every locale.
export function compareText(a: string, b: string): number {
	if (a < b) return -1
	return a > b ? 1 : 0
}

// The unit ids in each kommune's curated file.
export function curatedIds(curated: readonly CuratedFile[]): Map<string, Set<string>> {
	const ids = new Map<string, Set<string>>()
	for (const file of curated) {
		const set = ids.get(file.kommune) ?? new Set<string>()
		for (const u of file.units) set.add(u.unitId)
		ids.set(file.kommune, set)
	}
	return ids
}

// A unit waits for my "include this unit?" answer while verify sent its inclusion to review and
// the kommune's curated file holds no unit with its id yet.
export function waitsForInclusion(unit: LockUnit, ids: ReadonlySet<string> | undefined): boolean {
	return unit.inclusion?.status === "review" && ids?.has(unit.unitId) !== true
}

// The units I check by hand outside the key (spec, "Sample outside the key"). Each candidate ranks
// by sha256("<seed>:<kommune>:<unit id>") and the lowest ranks are drawn, so the same locks give
// the same sample, and a gap PR that adds or drops a few units moves it only at its margin. A
// candidate is a unit in one of the given kommuner, not waiting for its inclusion answer, with at
// least one accepted field. Fewer than 20 candidates means all of them. Sorted by kommune, then id.
export function drawSample(
	locks: readonly LockFile[],
	curated: readonly CuratedFile[],
	outside: readonly string[]
): { kommune: string; unitId: string }[] {
	const ids = curatedIds(curated)
	const candidates: { kommune: string; unitId: string; rank: string }[] = []
	for (const lock of locks) {
		if (!outside.includes(lock.kommune)) continue
		for (const unit of lock.units) {
			if (waitsForInclusion(unit, ids.get(lock.kommune))) continue
			if (!Object.values(unit.fields).some((f) => f?.status === "accepted")) continue
			const rank = createHash("sha256")
				.update(`${SAMPLE_SEED}:${lock.kommune}:${unit.unitId}`)
				.digest("hex")
			candidates.push({ kommune: lock.kommune, unitId: unit.unitId, rank })
		}
	}
	return candidates
		.sort(
			(a, b) =>
				compareText(a.rank, b.rank) ||
				compareText(a.kommune, b.kommune) ||
				compareText(a.unitId, b.unitId)
		)
		.slice(0, SAMPLE_SIZE)
		.map(({ kommune, unitId }) => ({ kommune, unitId }))
		.sort((a, b) => compareText(a.kommune, b.kommune) || compareText(a.unitId, b.unitId))
}
