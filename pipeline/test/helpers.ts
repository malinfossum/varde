import type { Candidate, GateContext } from "../src/gates/types.ts"
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

// A fictional unit page. The en dash, the no-break space and the soft hyphen are there on
// purpose: the gates must see through them.
export const PAGE = [
	"Rusteamet Hamar",
	"Telefon:\u00A062 00 00 00 (hverdager 08.00\u201315.30)",
	"Besøksadresse: Storgata 1, 2317 Hamar",
	"E-post: postmottak@hamar.kommune.no",
	"Nettside: https://www.hamar.kommune.no/rusteamet/",
	"Tilbudet er gratis, og du trenger ikke henvisning. Lavterskel\u00ADtilbud.",
].join("\n")

export function candidate(over: Partial<Candidate> = {}): Candidate {
	return {
		kommune: "3403",
		unitId: "org:999999999",
		field: "phone",
		value: "62 00 00 00",
		sourceUrl: PAGE_URL,
		evidence: { kind: "quote", quotes: ["Telefon: 62 00 00 00"] },
		origin: "unitContact",
		fetchedAt: T,
		...over,
	}
}

export function context(over: Partial<GateContext> = {}): GateContext {
	return {
		allowedHosts: new Set(["www.hamar.kommune.no", "data.brreg.no", "dinutvei.no"]),
		robotsAllows: () => true,
		licence: (host) =>
			host === "data.brreg.no" ? "nlod" : host === "dinutvei.no" ? "pending" : "ownPage",
		pageText: (url) => (url === PAGE_URL ? PAGE : undefined),
		urlStatus: () => 200,
		findAddress: () => ({ addressId: "3403-0001", kommune: "3403" }),
		validKommuner: new Set(["3403", "0301"]),
		unit: { categories: ["rus"], isKrisesenter: false },
		peers: [],
		...over,
	}
}
