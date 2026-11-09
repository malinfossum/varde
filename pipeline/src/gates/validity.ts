import type { GateResult } from "../schema/lock.ts"
import { hasInvisible } from "../text/invisible.ts"
import { phoneDigits } from "../text/normalise.ts"
import { settled } from "./grounding.ts"
import { type Candidate, drop, type Gate, type GateContext, pass, review } from "./types.ts"

// Today's database limit for opening hours, which no seed guard checks.
export const MAX_HOURS = 200

// The Nkom number plan (forskrift 2004-02-16-426, chapter 3), as the spec sets it out.
export function fitsNumberPlan(phone: string): boolean {
	const d = phoneDigits(phone)
	return /^[2-9]\d{7}$/.test(d) || /^1\d{2}$/.test(d) || /^116\d{3}$/.test(d) || /^0\d{4}$/.test(d)
}

function fieldCheck(c: Candidate, ctx: GateContext): GateResult {
	if (typeof c.value !== "string") return pass("validity")
	switch (c.field) {
		case "phone":
			return fitsNumberPlan(c.value)
				? pass("validity")
				: drop("validity", "not a number in the Nkom plan")
		case "website":
		case "chatUrl": {
			const status = ctx.urlStatus(c.value)
			if (status === 200) return pass("validity")
			return review(
				"validity",
				status === undefined ? "the URL was not checked" : `the URL answered ${status}`
			)
		}
		case "address": {
			const hit = ctx.findAddress(c.value)
			if (hit === undefined) return review("validity", "Kartverket does not know the address")
			if (hit.kommune !== c.kommune) {
				return review("validity", `Kartverket places the address in kommune ${hit.kommune}`)
			}
			return pass("validity")
		}
		case "openingHours":
		case "phoneHours":
			return c.value.length <= MAX_HOURS
				? pass("validity")
				: review("validity", `hours are longer than ${MAX_HOURS} characters`)
		default:
			return pass("validity")
	}
}

function checks(c: Candidate, ctx: GateContext): GateResult {
	// A hidden character changes what a reader sees. textLines strips them (Task 6), so one here
	// came from somewhere else.
	if (typeof c.value === "string" && hasInvisible(c.value)) {
		return drop("validity", "the value holds an invisible character")
	}
	// A drop wins over the kommune review, as it does in runGates, so my decision can never settle
	// a number outside the Nkom plan by way of an unknown kommune.
	const field = fieldCheck(c, ctx)
	if (!field.pass && field.onFail === "drop") return field
	if (!ctx.validKommuner.has(c.kommune)) {
		return review("validity", `kommune ${c.kommune} is not in KLASS on the fetch date`)
	}
	return field
}

// Gate 3: the value has the right shape, and the lookups that can prove it do. My decision
// settles a review it gives (a URL I checked myself, an address Kartverket does not know).
export const validityGate: Gate = (c, ctx) => settled(c, checks(c, ctx))
