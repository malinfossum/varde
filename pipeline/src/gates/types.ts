import type { CategorySlug, Cost, FieldName, FieldValue, GateName } from "../schema/common.ts"
import type { Evidence, GateResult } from "../schema/lock.ts"

// Where on a page (or in which register) a value was found. Adapters set it in PR 2.
export type Origin =
	| "register"
	| "unitContact" // the unit's own contact block on its own page
	| "unitPage" // elsewhere on the unit's own page
	| "staffList"
	| "article"
	| "jsonLdAuthor"

// nlod: open register data. ownPage: the provider's own site. granted: a catalogue owner
// said yes. pending: a catalogue without a yes yet, usable to find and cross-check only.
export type LicenceStatus = "nlod" | "ownPage" | "granted" | "pending"

export type Candidate = {
	kommune: string
	unitId: string
	field: FieldName
	value: FieldValue
	sourceUrl: string
	evidence: Evidence
	origin: Origin
	role?: string
	// Used to redact quotes, never stored.
	personName?: string
	fetchedAt: string
}

export type AddressHit = { addressId: string; kommune: string }

export type UnitFacts = {
	categories: readonly CategorySlug[]
	isKrisesenter: boolean
	orgForm?: string
	cost?: Cost
}

// Every lookup that needs the network in production. A missing answer counts against the
// value: no page text drops it, an unchecked URL sends it to review.
export type GateContext = {
	allowedHosts: ReadonlySet<string>
	robotsAllows: (url: string) => boolean
	licence: (host: string) => LicenceStatus | undefined
	pageText: (url: string) => string | undefined
	// Final status after redirects, as PR 2's fetcher reports it.
	urlStatus: (url: string) => number | undefined
	findAddress: (address: string) => AddressHit | undefined
	validKommuner: ReadonlySet<string>
	unit: UnitFacts
	// Other candidates for the same unit and field, from any source.
	peers: readonly Candidate[]
}

export type Gate = (candidate: Candidate, ctx: GateContext) => GateResult

// Reasons never hold a value or a quote: they end up in public logs and PR bodies.
export function pass(gate: GateName, reason?: string): GateResult {
	return reason === undefined ? { gate, pass: true } : { gate, pass: true, reason }
}
export function drop(gate: GateName, reason: string): GateResult {
	return { gate, pass: false, onFail: "drop", reason }
}
export function review(gate: GateName, reason: string): GateResult {
	return { gate, pass: false, onFail: "review", reason }
}
