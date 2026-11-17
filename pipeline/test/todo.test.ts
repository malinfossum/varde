import { describe, expect, it } from "vitest"
import { PilotChecks } from "../src/score/checks.ts"
import { CHECK_BY_HAND, seedBlocked, todoItems } from "../src/score/todo.ts"
import { acceptedField } from "./helpers.ts"
import {
	baseLocks,
	named,
	page,
	pilotInput,
	sampleChecks,
	scored,
	unitIdOf,
	withUnits,
} from "./pilotFixture.ts"

const otherPhone = (n: number) =>
	named(n, `Tjeneste ${n}`, {
		phone: acceptedField({
			value: "62 00 00 09",
			sourceUrl: page(`tjeneste-${n}`),
			evidence: { kind: "quote", quotes: ["Telefon: 62 00 00 09"] },
		}),
	})
// A disagreement in 3405 (open) and one in 3403 (blocks ClaudeBot).
const locks = withUnits(withUnits(baseLocks(), "3405", [otherPhone(2)]), "3403", [otherPhone(11)])

describe("todoItems", () => {
	it("lists what waits for a check, never from a kommune that blocks ClaudeBot", () => {
		const s = scored(pilotInput({ locks, checks: { checks: sampleChecks().slice(2) } }))
		const items = todoItems(s, ["3403"])
		expect(items.map((i) => [i.kind, i.kommune, i.keyId, i.unitId, i.field])).toEqual([
			["disagreement", "3405", 2, unitIdOf(2), "phone"],
			["sample", "3401", undefined, unitIdOf(41), "name"],
			["sample", "3401", undefined, unitIdOf(41), "phone"],
		])
		expect(items[0]).toMatchObject({
			keyValue: "62 00 00 00",
			pipelineValue: "62 00 00 09",
			sourceUrl: page("tjeneste-2"),
			quotes: ["Telefon: 62 00 00 09"],
		})
		expect(todoItems(s, ["3401", "3403"]).map((i) => i.kommune)).toEqual(["3405"])
	})

	it("leaves out a field whose page is on a blocked kommune's site, whatever the unit's kommune", () => {
		const blockedPage = "https://www.proveby.eksempel.kommune.no/tjeneste-41/"
		const hosted = withUnits(baseLocks(), "3401", [
			named(41, "Tilbud 41", { phone: acceptedField({ sourceUrl: blockedPage }) }),
		])
		const s = scored(
			pilotInput({
				locks: hosted,
				blockedHosts: ["proveby.eksempel.kommune.no"],
				checks: { checks: sampleChecks([42, 43]) },
			})
		)
		const fields = s.sample.units.find((u) => u.unitId === unitIdOf(41))?.fields ?? []
		expect(fields.map((f) => [f.field, f.byHand])).toEqual([
			["name", false],
			["phone", true],
		])
		expect(todoItems(s, ["3403"]).map((i) => [i.kommune, i.unitId, i.field])).toEqual([
			["3401", unitIdOf(41), "name"],
		])
	})
})

describe("seedBlocked", () => {
	it("adds one id-only check-by-hand entry per open field in a blocked kommune, once", () => {
		const input = pilotInput({ locks, blocked: ["3401", "3403"], checks: { checks: [] } })
		const first = seedBlocked(scored(input), input.checks, input.blocked)
		// The 3403 disagreement and the 6 sampled fields in 3401; never the open 3405 one.
		expect(first.added).toBe(7)
		expect(PilotChecks.parse(first.checks)).toEqual(first.checks)
		expect(first.checks.checks[0]).toEqual({
			kind: "disagreement",
			keyId: 11,
			unitId: unitIdOf(11),
			field: "phone",
			ruling: "unclear",
			note: CHECK_BY_HAND,
			by: "proposed",
		})
		for (const c of first.checks.checks) {
			expect(Object.keys(c).sort()).toEqual(
				c.kind === "sample"
					? ["by", "field", "kind", "note", "ruling", "unitId"]
					: ["by", "field", "keyId", "kind", "note", "ruling", "unitId"]
			)
		}
		expect(first.checks.checks.map((c) => `${c.kind} ${c.unitId} ${c.field}`)).toEqual([
			`disagreement ${unitIdOf(11)} phone`,
			`sample ${unitIdOf(41)} name`,
			`sample ${unitIdOf(41)} phone`,
			`sample ${unitIdOf(42)} name`,
			`sample ${unitIdOf(42)} phone`,
			`sample ${unitIdOf(43)} name`,
			`sample ${unitIdOf(43)} phone`,
		])
		const again = seedBlocked(
			scored({ ...input, checks: first.checks }),
			first.checks,
			input.blocked
		)
		expect(again.added).toBe(0)
		expect(again.checks).toEqual(first.checks)
	})
})
