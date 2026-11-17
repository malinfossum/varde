import { describe, expect, it } from "vitest"
import type { Check, PilotScore } from "../src/score/pilot.ts"
import { reasonParts, scorePilot } from "../src/score/pilot.ts"
import { acceptedField, T } from "./helpers.ts"
import {
	baseLocks,
	discovery,
	droppedField,
	INCLUDE_REVIEW,
	KEY,
	keyRow,
	lock,
	named,
	page,
	pilotInput,
	refusal,
	reviewField,
	sampleChecks,
	scored,
	unitIdOf,
	withoutUnits,
	withUnits,
} from "./pilotFixture.ts"

const rule = (s: PilotScore, n: number) => s.rules.find((r) => r.rule === n)

// Unit n's phone, accepted with another number than the key's.
const otherPhone = (n: number, phone: string) =>
	named(n, `Tjeneste ${n}`, {
		phone: acceptedField({
			value: phone,
			sourceUrl: page(`tjeneste-${n}`),
			evidence: { kind: "quote", quotes: [`Telefon: ${phone}`] },
		}),
	})

const disagreementCheck = (by: Check["by"], ruling: Check["ruling"], keyId = 2): Check => ({
	kind: "disagreement",
	keyId,
	unitId: unitIdOf(keyId),
	field: "phone",
	ruling,
	note: "The live page shows the new number.",
	by,
})

describe("the pass mark", () => {
	it("passes every rule on a pilot that meets the mark", () => {
		const s = scored(pilotInput())
		expect(s.rules.map((r) => r.status)).toEqual(["pass", "pass", "pass", "pass", "pass"])
		expect(s.pass).toBe(true)
		expect(s.rules.map((r) => r.measured)).toEqual([
			"0 wrong. Differ from the key: 0; ruled key stale or right by me: 0",
			"0 of 14 units (0%). Waiting for their inclusion answer, not counted: 0",
			"11 of 11 (100%)",
			"rows that differ: none",
			"0 wrong. Fields checked by me: 6 of 6; units drawn: 3 of 20",
		])
	})
})

describe("rule 1: wrong values in the key kommuner", () => {
	const locks = withUnits(baseLocks(), "3405", [otherPhone(2, "62 00 00 01")])

	it("fails on an accepted value that differs from the key, and lists it", () => {
		const s = scored(pilotInput({ locks }))
		expect(rule(s, 1)?.status).toBe("fail")
		expect(s.disagreements).toEqual([
			{
				keyId: 2,
				kommune: "3405",
				unitId: unitIdOf(2),
				field: "phone",
				keyValue: "62 00 00 00",
				pipelineValue: "62 00 00 01",
				sourceUrl: page("tjeneste-2"),
				quotes: ["Telefon: 62 00 00 01"],
				byHand: false,
			},
		])
	})

	it("shows a proposed ruling and mine apart, and counts only mine", () => {
		const proposed = scored(
			pilotInput({
				locks,
				checks: { checks: [...sampleChecks(), disagreementCheck("proposed", "keyStale")] },
			})
		)
		expect(rule(proposed, 1)?.status).toBe("fail")
		expect(proposed.disagreements[0]?.proposed).toEqual({
			ruling: "keyStale",
			note: "The live page shows the new number.",
		})
		expect(proposed.disagreements[0]?.mine).toBeUndefined()
		expect(proposed.done.disagreementsRuled).toBe(0)

		const mine = scored(
			pilotInput({
				locks,
				checks: {
					checks: [
						...sampleChecks(),
						disagreementCheck("proposed", "keyStale"),
						disagreementCheck("me", "keyStale"),
					],
				},
			})
		)
		expect(rule(mine, 1)).toMatchObject({
			status: "pass",
			measured: "0 wrong. Differ from the key: 1; ruled key stale or right by me: 1",
		})
		expect(mine.done.disagreementsRuled).toBe(1)
	})

	it("counts a value I ruled pipeline wrong, which known-wrong lists", () => {
		const s = scored(
			pilotInput({
				locks,
				checks: { checks: [...sampleChecks(), disagreementCheck("me", "pipelineWrong")] },
				known: {
					entries: [{ kind: "disagreement", keyId: 2, unitId: unitIdOf(2), field: "phone" }],
				},
			})
		)
		expect(rule(s, 1)?.measured).toBe(
			"1 wrong. Differ from the key: 1; ruled key stale or right by me: 0"
		)
	})

	it("refuses when known-wrong does not list a value I ruled pipeline wrong", () => {
		const r = refusal(
			pilotInput({
				locks,
				checks: { checks: [...sampleChecks(), disagreementCheck("me", "pipelineWrong")] },
			})
		)
		expect(r.problems).toEqual([
			"test/pilot-checks.json and test/known-wrong.json disagree in 1 place: run npx vitest run test/golden.test.ts to see them",
		])
	})

	it("marks a disagreement in a kommune that blocks ClaudeBot for a check by hand until I rule", () => {
		const blocked = withUnits(baseLocks(), "3403", [otherPhone(11, "62 00 00 02")])
		const s = scored(pilotInput({ locks: blocked }))
		expect(s.disagreements.map((d) => [d.keyId, d.byHand])).toEqual([[11, true]])
		expect(s.done.checkByHand).toBe(1)
		const ruled = scored(
			pilotInput({
				locks: blocked,
				checks: { checks: [...sampleChecks(), disagreementCheck("me", "keyStale", 11)] },
			})
		)
		expect(ruled.disagreements[0]?.byHand).toBe(false)
		expect(ruled.done.checkByHand).toBe(0)
	})
})

describe("rule 2: units with a field in review", () => {
	const review = (n: number, reason: string) =>
		named(n, `Tjeneste ${n}`, { phone: reviewField(reason) })

	it("allows 1 unit in 10, not 2", () => {
		const one = withUnits(baseLocks(), "3405", [review(1, "agreement: 1 other source(s) disagree")])
		expect(rule(scored(pilotInput({ locks: one })), 2)?.status).toBe("pass")
		const two = withUnits(one, "3405", [review(2, "agreement: 1 other source(s) disagree")])
		expect(rule(scored(pilotInput({ locks: two })), 2)?.status).toBe("fail")
	})

	it("counts a unit waiting for its inclusion answer as a question, not a review row", () => {
		const one = withUnits(baseLocks(), "3405", [review(1, "agreement: 1 other source(s) disagree")])
		const waiting = withUnits(one, "3401", [
			named(
				44,
				"Tilbud 44",
				{ phone: reviewField("validity: not a number in the Nkom plan") },
				{
					inclusion: INCLUDE_REVIEW,
				}
			),
		])
		const s = scored(pilotInput({ locks: waiting }))
		expect(rule(s, 2)).toMatchObject({
			status: "pass",
			measured: "1 of 14 units (7.1%). Waiting for their inclusion answer, not counted: 1",
		})
		expect(s.inclusion).toEqual({
			rows: [{ kommune: "3401", name: "Eksempelby", questions: 1 }],
			total: 1,
			estimateMinutes: 1,
		})
		expect(s.kommuner.find((k) => k.kommune === "3401")).toMatchObject({
			units: 4,
			waiting: 1,
			unitsWithReview: 0,
			review: 1,
		})
		// The waiting unit is never sampled either.
		expect(s.sample.drawn).toBe(3)
	})
})

describe("rule 3: key rows found", () => {
	it("needs 9 in 10 of the key rows", () => {
		const ten = withoutUnits(baseLocks(), "3405", [unitIdOf(10)])
		expect(rule(scored(pilotInput({ locks: ten })), 3)).toMatchObject({
			status: "pass",
			measured: "10 of 11 (90.9%)",
			target: "at least 10 of 11",
		})
		const nine = withoutUnits(ten, "3405", [unitIdOf(9)])
		expect(rule(scored(pilotInput({ locks: nine })), 3)?.status).toBe("fail")
	})

	it("finds a row whose unit waits for inclusion, or has its name in review", () => {
		const locks = withUnits(baseLocks(), "3405", [
			named(10, "Tjeneste 10", {}, { inclusion: INCLUDE_REVIEW }),
			named(9, "Tjeneste 9", {
				name: reviewField("validity: not a name", {
					value: "Tjeneste 9",
					evidence: { kind: "quote", quotes: ["Tjeneste 9"] },
				}),
			}),
		])
		expect(rule(scored(pilotInput({ locks })), 3)?.measured).toBe("11 of 11 (100%)")
	})
})

describe("rule 4: Lavterskel badges", () => {
	it("fails on a badge that differs from the key, unless I decide that row once", () => {
		const locks = withUnits(baseLocks(), "3405", [
			named(1, "Tjeneste 1", {
				lowThreshold: acceptedField({
					value: true,
					evidence: { kind: "quote", quotes: ["Lavterskeltilbud"] },
				}),
			}),
		])
		expect(rule(scored(pilotInput({ locks })), 4)).toMatchObject({
			status: "fail",
			measured: "rows that differ: 1",
		})
		expect(rule(scored(pilotInput({ locks, decideOnce: [1] })), 4)?.status).toBe("pass")
	})

	it("lists a badge mismatch in part 6, so my pipeline wrong ruling on it still occurs", () => {
		const locks = withUnits(baseLocks(), "3405", [
			named(1, "Tjeneste 1", {
				lowThreshold: acceptedField({
					value: true,
					evidence: { kind: "quote", quotes: ["Lavterskeltilbud"] },
				}),
			}),
		])
		const mine: Check = {
			kind: "disagreement",
			keyId: 1,
			unitId: unitIdOf(1),
			field: "lowThreshold",
			ruling: "pipelineWrong",
			note: "The page does not say it is open to all.",
			by: "me",
		}
		const s = scored(
			pilotInput({
				locks,
				checks: { checks: [...sampleChecks(), mine] },
				known: {
					entries: [{ kind: "disagreement", keyId: 1, unitId: unitIdOf(1), field: "lowThreshold" }],
				},
			})
		)
		expect(s.disagreements.map((d) => [d.keyId, d.field, d.mine?.ruling])).toEqual([
			[1, "lowThreshold", "pipelineWrong"],
		])
		expect(rule(s, 1)?.status).toBe("pass")
		expect(rule(s, 4)?.status).toBe("fail")
	})
})

describe("rule 5: the sample outside the key", () => {
	it("fails on a sampled field I ruled wrong", () => {
		const checks = sampleChecks().map((c) =>
			c.unitId === unitIdOf(41) && c.field === "phone"
				? { ...c, ruling: "pipelineWrong" as const }
				: c
		)
		const s = scored(
			pilotInput({
				checks: { checks },
				known: { entries: [{ kind: "sample", unitId: unitIdOf(41), field: "phone" }] },
			})
		)
		expect(rule(s, 5)?.status).toBe("fail")
	})

	it("waits while a sampled field has no check by me, a proposal included", () => {
		expect(
			rule(scored(pilotInput({ checks: { checks: sampleChecks().slice(1) } })), 5)
		).toMatchObject({
			status: "waiting",
			measured: "0 wrong. Fields checked by me: 5 of 6; units drawn: 3 of 20",
		})
		const proposed = sampleChecks().map((c, i) => (i === 0 ? { ...c, by: "proposed" as const } : c))
		expect(rule(scored(pilotInput({ checks: { checks: proposed } })), 5)?.status).toBe("waiting")
	})

	it("fails with no unit to sample, and says 0 of 20", () => {
		const locks = withoutUnits(baseLocks(), "3401", [unitIdOf(41), unitIdOf(42), unitIdOf(43)])
		expect(rule(scored(pilotInput({ locks, checks: { checks: [] } })), 5)).toMatchObject({
			status: "fail",
			measured: "0 wrong. Fields checked by me: 0 of 0; units drawn: 0 of 20",
		})
	})
})

describe("refusals", () => {
	it("refuses a pilot kommune that was never attempted, and names it", () => {
		const locks = baseLocks().filter((l) => l.kommune !== "3401")
		expect(refusal(pilotInput({ locks })).problems).toEqual([
			"3401: never attempted (no lock file): run the stages for it, then score again",
		])
	})

	it("refuses a kommune that failed for a timeout, names it and says to resume", () => {
		const locks = baseLocks().map((l) =>
			l.kommune === "3403"
				? lock("3403", [], { kind: "timeout", reason: "host stopped: timeout" })
				: l
		)
		expect(refusal(pilotInput({ locks })).problems).toEqual([
			"3403: failed for timeout (host stopped: timeout): run fetch --resume, then extract and verify again",
		])
	})

	it("scores a kommune that failed for robots as lost recall, with its reason", () => {
		const locks = baseLocks().map((l) =>
			l.kommune === "3403"
				? lock("3403", [], { kind: "robots", reason: "robots.txt refuses every page" })
				: l
		)
		const s = scored(pilotInput({ locks }))
		expect(s.recall.lost).toEqual([
			{
				keyId: 11,
				kommune: "3403",
				name: "Tjeneste 11",
				stage: "failed",
				reason: "robots.txt refuses every page",
			},
		])
		expect(rule(s, 3)?.measured).toBe("10 of 11 (90.9%)")
		expect(s.kommuner.find((k) => k.kommune === "3403")?.failed).toEqual({
			kind: "robots",
			reason: "robots.txt refuses every page",
		})
	})

	it("refuses a check whose disagreement no longer occurs", () => {
		const r = refusal(
			pilotInput({ checks: { checks: [...sampleChecks(), disagreementCheck("me", "keyStale")] } })
		)
		expect(r.problems).toEqual([
			"test/pilot-checks.json entry 7 (disagreement, row 2, phone) no longer occurs: remove it, and its known-wrong entry if it has one",
		])
	})

	it("refuses a sample check whose field is no longer in the sample", () => {
		const gone: Check = {
			kind: "sample",
			unitId: unitIdOf(99),
			field: "phone",
			ruling: "right",
			note: "Matches the source page.",
			by: "me",
		}
		expect(refusal(pilotInput({ checks: { checks: [...sampleChecks(), gone] } })).problems).toEqual(
			[
				"test/pilot-checks.json entry 7 (sample, phone) no longer occurs: remove it, and its known-wrong entry if it has one",
			]
		)
	})

	it("refuses two rulings of mine on one field", () => {
		const checks = [...sampleChecks(), sampleChecks()[0] as Check]
		expect(refusal(pilotInput({ checks: { checks } })).problems).toEqual([
			"test/pilot-checks.json entries 1 and 7 (sample, name) are both mine: keep one",
		])
	})
})

describe("recall", () => {
	it("names the stage that lost each key row", () => {
		const traced = [21, 22, 23, 24].map((id) =>
			keyRow(id, "3405", { website: page(`tjeneste-${id}`) })
		)
		const unknown = keyRow(25, "3405", { website: "https://ukjent.eksempel.no/tilbud/" })
		const dropped = named(
			30,
			"Tjeneste 30",
			{ name: droppedField("source: the host is not on the allow list") },
			{
				sources: [{ kind: "page", ref: page("tjeneste-24") }],
			}
		)
		const s = scored(
			pilotInput({
				key: { ...KEY, rows: [...KEY.rows, ...traced, unknown] },
				locks: withUnits(baseLocks(), "3405", [dropped]),
				discovery: discovery({ "3405": [21, 22, 23, 24].map((id) => page(`tjeneste-${id}`)) }),
				crawl: {
					hosts: [],
					notFetched: [{ ok: false, url: page("tjeneste-21"), reason: "robots" }],
				},
				extracted: {
					"3405": [
						{ url: page("tjeneste-22"), finalUrl: page("tjeneste-22"), candidates: 0 },
						{ url: page("tjeneste-23"), finalUrl: page("tjeneste-23"), candidates: 2 },
						{ url: page("tjeneste-24"), finalUrl: page("tjeneste-24"), candidates: 3 },
					],
				},
			})
		)
		expect(s.recall.lost.map((r) => [r.keyId, r.stage, r.reason])).toEqual([
			[21, "notFetched", "not fetched: robots.txt refuses it"],
			[22, "noValues", "no values extracted"],
			[23, "noUnitId", "fetched, no unit id"],
			[24, "droppedByGate", "dropped by a gate: source: the host is not on the allow list"],
			[25, "discover", "ukjent.eksempel.no was not found by any register, sitemap or catalogue"],
		])
		expect(s.recall.lost[0]?.website).toBe(page("tjeneste-21"))
	})
})

describe("review reasons", () => {
	it("splits a reason into its gates; a part with no gate name belongs to the rule", () => {
		expect(
			reasonParts("validity: not a number in the Nkom plan; place part does not match Kartverket")
		).toEqual([
			{ gate: "validity", reason: "not a number in the Nkom plan" },
			{ gate: "rule", reason: "place part does not match Kartverket" },
		])
		expect(reasonParts("my decision of 13.11.2026: rejected")).toEqual([
			{ gate: "rule", reason: "my decision of 13.11.2026: rejected" },
		])
	})

	it("groups the reasons, largest first, then by gate and reason", () => {
		const locks = withUnits(baseLocks(), "3405", [
			named(1, "Tjeneste 1", {
				phone: reviewField(
					"validity: not a number in the Nkom plan; agreement: 1 other source(s) disagree"
				),
			}),
			named(2, "Tjeneste 2", {
				phone: reviewField(
					"validity: not a number in the Nkom plan; place part does not match Kartverket"
				),
			}),
		])
		const s = scored(pilotInput({ locks }))
		expect(s.reviewFields).toBe(2)
		expect(s.reviewReasons).toEqual([
			{ gate: "validity", reason: "not a number in the Nkom plan", count: 2 },
			{ gate: "agreement", reason: "1 other source(s) disagree", count: 1 },
			{ gate: "rule", reason: "place part does not match Kartverket", count: 1 },
		])
	})
})

describe("determinism", () => {
	it("gives the same score twice in a row, whatever the order of its input", () => {
		const input = pilotInput({
			locks: withUnits(baseLocks(), "3405", [
				otherPhone(2, "62 00 00 01"),
				named(3, "Tjeneste 3", { phone: reviewField("agreement: 1 other source(s) disagree") }),
			]),
		})
		const reversed = {
			...input,
			locks: [...input.locks].reverse().map((l) => ({ ...l, units: [...l.units].reverse() })),
		}
		expect(scorePilot(input)).toEqual(scorePilot(input))
		expect(scorePilot(reversed)).toEqual(scorePilot(input))
	})

	it("states the oldest fetchedAt in the locks", () => {
		expect(scored(pilotInput()).oldestFetchedAt).toBe(T)
		const locks = withUnits(baseLocks(), "3401", [
			named(41, "Tilbud 41", {
				phone: acceptedField({ sourceUrl: page("tjeneste-41"), fetchedAt: "2026-10-01T08:00:00Z" }),
			}),
		])
		expect(scored(pilotInput({ locks })).oldestFetchedAt).toBe("2026-10-01T08:00:00Z")
	})
})
