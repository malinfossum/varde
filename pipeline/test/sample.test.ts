import { createHash } from "node:crypto"
import { describe, expect, it } from "vitest"
import { drawSample, SAMPLE_SEED, SAMPLE_SIZE } from "../src/score/sample.ts"
import { curatedUnit } from "./helpers.ts"
import { baseLocks, INCLUDE_REVIEW, lock, named, reviewField, unitIdOf } from "./pilotFixture.ts"

describe("drawSample", () => {
	const many = lock(
		"3401",
		Array.from({ length: 25 }, (_, i) => named(100 + i, `Tilbud ${100 + i}`))
	)
	const keyed = lock(
		"3405",
		Array.from({ length: 5 }, (_, i) => named(200 + i, `Tjeneste ${200 + i}`))
	)

	it("draws the 20 lowest hash ranks, the same twice, only from kommuner outside the key", () => {
		const first = drawSample([many, keyed], [], ["3401"])
		expect(drawSample([keyed, many], [], ["3401"])).toEqual(first)
		expect(first).toHaveLength(SAMPLE_SIZE)
		expect(first.every((s) => s.kommune === "3401")).toBe(true)
		// The rank is pinned here on its own, so a change to the formula goes red.
		const lowest = many.units
			.map((u) => ({
				unitId: u.unitId,
				rank: createHash("sha256").update(`${SAMPLE_SEED}:3401:${u.unitId}`).digest("hex"),
			}))
			.sort((a, b) => (a.rank < b.rank ? -1 : 1))
			.slice(0, SAMPLE_SIZE)
			.map((r) => r.unitId)
			.sort()
		expect(first.map((s) => s.unitId)).toEqual(lowest)
	})

	it("takes every candidate when there are fewer than 20, sorted by kommune and unit id", () => {
		expect(drawSample(baseLocks(), [], ["3401"])).toEqual([
			{ kommune: "3401", unitId: unitIdOf(41) },
			{ kommune: "3401", unitId: unitIdOf(42) },
			{ kommune: "3401", unitId: unitIdOf(43) },
		])
	})

	it("leaves out a unit waiting for inclusion and one with no accepted field", () => {
		const waiting = named(301, "Tilbud 301", {}, { inclusion: INCLUDE_REVIEW })
		const answered = named(302, "Tilbud 302", {}, { inclusion: INCLUDE_REVIEW })
		const noAccepted = named(303, "Tilbud 303", {
			name: reviewField("validity: not a name", {
				value: "Tilbud 303",
				evidence: { kind: "quote", quotes: ["Tilbud 303"] },
			}),
			phone: reviewField("validity: not a number in the Nkom plan"),
		})
		const curated = [
			{ kommune: "3401", name: "Eksempelby", units: [curatedUnit({ unitId: unitIdOf(302) })] },
		]
		expect(drawSample([lock("3401", [waiting, answered, noAccepted])], curated, ["3401"])).toEqual([
			{ kommune: "3401", unitId: unitIdOf(302) },
		])
	})

	it("changes only at its margin when one unit is added", () => {
		const before = drawSample([many], [], ["3401"])
		const after = drawSample(
			[lock("3401", [...many.units, named(130, "Tilbud 130")])],
			[],
			["3401"]
		)
		const kept = after.filter((a) => before.some((b) => b.unitId === a.unitId))
		expect(kept.length).toBeGreaterThanOrEqual(SAMPLE_SIZE - 1)
	})
})
