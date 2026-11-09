import { describe, expect, it } from "vitest"
import { emailCandidates, emailsIn } from "../../src/extract/fields/email.ts"

describe("emailsIn", () => {
	it("finds plain and linked addresses, without a trailing full stop", () => {
		expect(emailsIn("E-post: post@eksempel.kommune.no.")).toEqual(["post@eksempel.kommune.no"])
		expect(emailsIn("Skriv til helsestasjon@eksempel.kommune.no eller post@eksempel.no")).toEqual([
			"helsestasjon@eksempel.kommune.no",
			"post@eksempel.no",
		])
	})

	it("finishes a long line of address characters with no @ fast", () => {
		const started = performance.now()
		emailsIn("a.".repeat(1000))
		expect(performance.now() - started).toBeLessThan(1000)
	})
})

describe("emailCandidates", () => {
	const block = [{ source: "heading" as const, lines: ["E-post: post@eksempel.kommune.no"] }]

	it("takes the contact block first, as unitContact", () => {
		expect(emailCandidates(block, ["Skriv til annet@eksempel.kommune.no"])).toEqual([
			{
				field: "email",
				value: "post@eksempel.kommune.no",
				evidence: { kind: "quote", quotes: ["E-post: post@eksempel.kommune.no"] },
				origin: "unitContact",
				block: 0,
			},
		])
	})

	it("reads the rest of the page only when the block has none", () => {
		expect(emailCandidates([], ["Skriv til post@eksempel.kommune.no"])).toMatchObject([
			{ value: "post@eksempel.kommune.no", origin: "unitPage" },
		])
	})

	it("proposes a personal-looking address too: the safety gate drops it", () => {
		const own = [{ source: "heading" as const, lines: ["kari.nordmann@eksempel.kommune.no"] }]
		expect(emailCandidates(own, [])).toHaveLength(1)
	})
})
