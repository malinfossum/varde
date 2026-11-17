import type { FieldName, FieldValue } from "../schema/common.ts"
import type { Check, Checks, PilotScore, Ruling } from "./pilot.ts"
import { compareText } from "./sample.ts"

export const CHECK_BY_HAND = "check by hand"

export type TodoItem = {
	kind: "disagreement" | "sample"
	keyId?: number
	kommune: string
	unitId: string
	field: FieldName
	keyValue?: FieldValue
	pipelineValue: FieldValue
	sourceUrl: string
	quotes: string[]
	proposed?: Ruling
}

// What the checking session reads instead of the report: every disagreement and sampled field
// with no check by me yet. The kommuner that block ClaudeBot are left out whole, and so is any
// field marked by hand (its value or its unit's page lies on one of their sites), because their
// text never goes to an AI company; I check those myself.
export function todoItems(s: PilotScore, blocked: readonly string[]): TodoItem[] {
	const items: TodoItem[] = []
	for (const d of s.disagreements) {
		if (blocked.includes(d.kommune) || d.byHand || d.mine !== undefined) continue
		items.push({
			kind: "disagreement",
			keyId: d.keyId,
			kommune: d.kommune,
			unitId: d.unitId,
			field: d.field,
			keyValue: d.keyValue,
			pipelineValue: d.pipelineValue,
			sourceUrl: d.sourceUrl,
			quotes: [...d.quotes],
			...(d.proposed === undefined ? {} : { proposed: d.proposed }),
		})
	}
	for (const u of s.sample.units) {
		if (blocked.includes(u.kommune)) continue
		for (const f of u.fields) {
			if (f.byHand || f.mine !== undefined) continue
			items.push({
				kind: "sample",
				kommune: u.kommune,
				unitId: u.unitId,
				field: f.field,
				pipelineValue: f.value,
				sourceUrl: f.sourceUrl,
				quotes: [...f.quotes],
				...(f.proposed === undefined ? {} : { proposed: f.proposed }),
			})
		}
	}
	return items
}

// The order of test/pilot-checks.json: kind, key row id, unit id, field, then who wrote it.
export function compareChecks(a: Check, b: Check): number {
	return (
		compareText(a.kind, b.kind) ||
		(a.keyId ?? 0) - (b.keyId ?? 0) ||
		compareText(a.unitId, b.unitId) ||
		compareText(a.field, b.field) ||
		compareText(a.by, b.by)
	)
}

// One proposed "unclear, check by hand" entry for each disagreement and sampled field in a
// kommune that blocks ClaudeBot, or marked by hand, that has no check at all. It copies ids and
// field names only, never a value or a quote, and a second run adds nothing.
export function seedBlocked(
	s: PilotScore,
	checks: Checks,
	blocked: readonly string[]
): { checks: Checks; added: number } {
	const added: Check[] = []
	const seed = (target: {
		kind: Check["kind"]
		keyId?: number
		unitId: string
		field: FieldName
	}) => added.push({ ...target, ruling: "unclear", note: CHECK_BY_HAND, by: "proposed" })
	for (const d of s.disagreements) {
		if (
			(blocked.includes(d.kommune) || d.byHand) &&
			d.proposed === undefined &&
			d.mine === undefined
		)
			seed({ kind: "disagreement", keyId: d.keyId, unitId: d.unitId, field: d.field })
	}
	// Every sampled unit is read: a field in an open kommune can still be marked by hand.
	for (const u of s.sample.units) {
		for (const f of u.fields) {
			if (
				(blocked.includes(u.kommune) || f.byHand) &&
				f.proposed === undefined &&
				f.mine === undefined
			)
				seed({ kind: "sample", unitId: u.unitId, field: f.field })
		}
	}
	return {
		checks: { checks: [...checks.checks, ...added].sort(compareChecks) },
		added: added.length,
	}
}
