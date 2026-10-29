import { GATE_NAMES } from "../src/schema/common.ts"
import type { CuratedUnit } from "../src/schema/curated.ts"
import type { GateResult, LockField, LockUnit } from "../src/schema/lock.ts"

// Every fixture here is fictional: the number, the org number and the address.
export const T = "2026-10-29T08:00:00Z"
export const PAGE_URL = "https://www.hamar.kommune.no/rusteamet/"

export function allGatesPass(): GateResult[] {
	return GATE_NAMES.map((gate) => ({ gate, pass: true }))
}

export function acceptedField(over: Partial<LockField> = {}): LockField {
	return {
		status: "accepted",
		value: "62 00 00 00",
		sourceUrl: PAGE_URL,
		evidence: { kind: "quote", quotes: ["Telefon: 62 00 00 00"] },
		fetchedAt: T,
		verifiedAt: T,
		gates: allGatesPass(),
		...over,
	}
}

export function lockUnit(over: Partial<LockUnit> = {}): LockUnit {
	return {
		unitId: "org:999999999",
		sources: [{ kind: "page", ref: PAGE_URL }],
		fields: {
			name: acceptedField({
				value: "Rusteamet Hamar",
				evidence: { kind: "quote", quotes: ["Rusteamet Hamar"] },
			}),
			phone: acceptedField(),
		},
		...over,
	}
}

export function curatedUnit(over: Partial<CuratedUnit> = {}): CuratedUnit {
	return {
		unitId: "org:999999999",
		name: "Rusteamet Hamar",
		include: true,
		sources: { orgNumber: "999999999", pages: [PAGE_URL] },
		categories: ["rus"],
		providerType: "offentlig",
		decisions: [],
		...over,
	}
}
