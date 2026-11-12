import { describe, expect, it } from "vitest"
import type { FieldItem, IncludeItem } from "../src/review/queue.ts"
import { FIELD_KEYS_NO_ACCEPT, renderItem } from "../src/review/render.ts"

const field: FieldItem = {
	kind: "field",
	kommune: "3405",
	unitId: "org:999999991",
	unitName: "Eksempel helsestasjon",
	field: "phone",
	value: "900 00 000",
	role: "Avdelingsleder",
	evidence: { kind: "quote", quotes: ["Avdelingsleder\u001b[2J", "900 00 000\u202e"] },
	sourceUrl: "https://www.eksempel.kommune.no/helsestasjon/",
	reason: "safety: a mobile on the unit page needs its role label",
	acute: false,
	categories: ["familie-og-barn"],
}

describe("renderItem", () => {
	it("shows progress, kommune, unit, field, value, role, quote, link, host and reason, in that order", () => {
		const text = renderItem(field, 3, 17, false)
		const order = [
			"3 of 17",
			"3405",
			"Eksempel helsestasjon",
			"phone",
			"900 00 000",
			"Avdelingsleder",
			"Quote",
			"Source",
			"Host: www.eksempel.kommune.no",
			"Why",
		]
		const at = order.map((s) => text.indexOf(s))
		expect(at.every((n) => n >= 0)).toBe(true)
		expect([...at].sort((a, b) => a - b)).toEqual(at)
		expect(text).toContain("a accept, r reject, e edit, s skip, q quit, then Enter")
	})

	it("prints no escape code at all without colour, and frames in plain ASCII", () => {
		const text = renderItem(field, 1, 1, false)
		expect(text).not.toContain("\u001b")
		expect(text).not.toContain("\u202e")
		for (const line of text
			.split("\n")
			.filter((l) => l.startsWith("+") || l.trimStart().startsWith("+"))) {
			expect(line).toMatch(/^[\x20-\x7E]*$/)
		}
	})

	it("uses colour for labels only, and strips codes from page text even then", () => {
		const text = renderItem(field, 1, 1, true)
		expect(text).toContain("\u001b[1m")
		expect(text).not.toContain("\u001b[2J")
	})

	it("asks an include question with its keys", () => {
		const item: IncludeItem = {
			kind: "include",
			kommune: "3405",
			unitId: "org:999999992",
			unitName: "Eksempel legevakt",
			reason: "no known category",
			suggestedCategories: ["nodtjenester"],
			sources: [{ kind: "page", ref: "https://www.eksempel.kommune.no/legevakt/" }],
			acute: true,
		}
		const text = renderItem(item, 1, 2, false)
		expect(text).toContain("Include this unit?")
		expect(text).toContain("nodtjenester")
		expect(text).toContain("y include, n leave out, s skip, q quit, then Enter")
	})

	it("offers no accept key for a mobile with no role", () => {
		const text = renderItem({ ...field, role: undefined }, 1, 1, false)
		expect(text).toContain(FIELD_KEYS_NO_ACCEPT)
		expect(text).not.toContain("a accept")
	})

	it("says how many hidden characters it removed, and says nothing when there were none", () => {
		expect(renderItem(field, 1, 1, false)).toContain(
			"Note: 5 hidden or control characters were removed for display."
		)
		const clean = {
			...field,
			evidence: { kind: "quote" as const, quotes: ["Avdelingsleder", "900 00 000"] },
		}
		expect(renderItem(clean, 1, 1, false)).not.toContain("Note:")
	})

	it("prints every review reason the rules give as it is", () => {
		for (const reason of [
			"the page heading does not name the unit",
			"the always-open claim shares a line with a number",
			"the block limits the always-open claim",
			'a short number with only "ring" beside it',
			"Nav lists a note on the hours",
			"Nav lists more than one reception",
		]) {
			expect(renderItem({ ...field, reason }, 1, 1, false)).toContain(`Why: ${reason}\n`)
		}
	})
})
