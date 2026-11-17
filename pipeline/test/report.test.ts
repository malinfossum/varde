import { describe, expect, it } from "vitest"
import type { Check, PilotScore } from "../src/score/pilot.ts"
import {
	PR_BODY_LIMIT,
	PrBodyTooLongError,
	renderPrBody,
	renderReport,
} from "../src/score/render.ts"
import { formatDuration, groupDigits } from "../src/score/scale.ts"
import { acceptedField } from "./helpers.ts"
import {
	baseLocks,
	named,
	page,
	pilotInput,
	reviewField,
	sampleChecks,
	scored,
	unitIdOf,
	withUnits,
} from "./pilotFixture.ts"

const ticks = (n: number) => "`".repeat(n)
// The line of three backticks inside would close a three-backtick fence early.
const EVIL = `Ring @someone <img src=x onerror=alert(1)> ${ticks(3)} her\n${ticks(3)}\n@other <img src=y>`
const REPORT_PATH = "docs/pilot/pilot-report.md"

// The lines GitHub renders as markdown: those outside fenced blocks. A fence closes only on a
// line of backticks at least as long as the one that opened it.
function outsideFences(md: string): string[] {
	const out: string[] = []
	let open = 0
	for (const line of md.split("\n")) {
		const fence = /^(`{3,})/.exec(line)?.[1]?.length ?? 0
		if (open === 0) {
			if (fence > 0) open = fence
			else out.push(line)
		} else if (fence >= open && line.trim() === ticks(fence)) open = 0
	}
	return out
}

describe("renderReport", () => {
	it("has the seven parts in order", () => {
		const md = renderReport(scored(pilotInput()))
		expect(md.split("\n").filter((l) => l.startsWith("## "))).toEqual([
			"## 1. Pass mark",
			"## 2. Per kommune",
			"## 3. Review reasons, ranked",
			"## 4. Inclusion questions",
			"## 5. Recall",
			"## 6. Disagreements",
			"## 7. Sample outside the key",
		])
		expect(md).toContain(
			"| 3. At least 9 in 10 key rows found in the key kommuner | 11 of 11 (100%) | at least 10 of 11 | pass |"
		)
		expect(md).toContain("| 3401 Eksempelby | 3 | 0 | 0 | 6 | 0 | 0 |  |")
	})

	it("renders a hostile quote and a javascript: value inert", () => {
		const locks = withUnits(baseLocks(), "3401", [
			named(41, "Tilbud 41", {
				phone: acceptedField({
					sourceUrl: page("tjeneste-41"),
					evidence: { kind: "quote", quotes: [EVIL] },
				}),
				website: acceptedField({
					value: "javascript:alert(1)",
					sourceUrl: page("tjeneste-41"),
					evidence: { kind: "quote", quotes: ["javascript:alert(1)"] },
				}),
			}),
		])
		const md = renderReport(scored(pilotInput({ locks })))
		expect(md).toContain([`${ticks(4)}text`, EVIL, ticks(4)].join("\n"))
		expect(md).toContain(
			[
				"#### website",
				"",
				"- Value: `javascript:alert(1)`",
				`- Source: \`${page("tjeneste-41")}\``,
			].join("\n")
		)
		const plain = outsideFences(md)
		expect(plain.filter((l) => l.includes("@someone") || l.includes("<img"))).toEqual([])
		expect(plain.filter((l) => l.includes("javascript:"))).toEqual([
			"- Value: `javascript:alert(1)`",
		])
	})

	it("keeps two review reasons with equal counts in one order across runs", () => {
		const a = withUnits(baseLocks(), "3405", [
			named(1, "Tjeneste 1", { phone: reviewField("validity: not a number in the Nkom plan") }),
			named(2, "Tjeneste 2", { phone: reviewField("agreement: 1 other source(s) disagree") }),
		])
		const b = a.map((l) => ({ ...l, units: [...l.units].reverse() })).reverse()
		const first = renderReport(scored(pilotInput({ locks: a })))
		expect(renderReport(scored(pilotInput({ locks: b })))).toBe(first)
		expect(first).toContain(
			[
				"| 1 | agreement | 1 other source(s) disagree |",
				"| 1 | validity | not a number in the Nkom plan |",
			].join("\n")
		)
	})

	it("is the same twice, with no clock time, a dated oldest page and an estimated time", () => {
		const md = renderReport(scored(pilotInput()))
		expect(renderReport(scored(pilotInput()))).toBe(md)
		expect(md).toContain("The oldest cached page behind these locks was fetched on 29.10.2026.")
		expect(md).toContain("That is an estimate at 30 seconds a question")
		expect(md).not.toMatch(/\d{2}:\d{2}/)
		expect(md).not.toContain("\r")
		expect(md.endsWith("\n")).toBe(true)
	})

	it("shows a proposed ruling, my ruling and a check by hand apart", () => {
		const locks = withUnits(
			withUnits(baseLocks(), "3405", [
				named(2, "Tjeneste 2", {
					phone: acceptedField({
						value: "62 00 00 01",
						sourceUrl: page("tjeneste-2"),
						evidence: { kind: "quote", quotes: ["Telefon: 62 00 00 01"] },
					}),
				}),
			]),
			"3403",
			[
				named(11, "Tjeneste 11", {
					phone: acceptedField({
						value: "62 00 00 02",
						sourceUrl: page("tjeneste-11"),
						evidence: { kind: "quote", quotes: ["Telefon: 62 00 00 02"] },
					}),
				}),
			]
		)
		const proposed: Check = {
			kind: "disagreement",
			keyId: 2,
			unitId: unitIdOf(2),
			field: "phone",
			ruling: "keyStale",
			note: "The live page shows 62 00 00 01.",
			by: "proposed",
		}
		const mine: Check = { ...proposed, note: "I checked it myself.", by: "me" }
		const md = renderReport(
			scored(pilotInput({ locks, checks: { checks: [...sampleChecks(), proposed, mine] } }))
		)
		expect(md).toContain(
			[
				"- Proposed ruling: key stale. The live page shows 62 00 00 01.",
				"- My ruling: key stale. I checked it myself.",
			].join("\n")
		)
		expect(md).toContain(
			"- My ruling: none yet. Check by hand: its kommune, or the site its page is on, blocks ClaudeBot, so no AI session reads it."
		)
		expect(md).toContain(
			"2 accepted values differ from the key. 1 have my ruling, and 1 wait for a check by hand."
		)
	})
})

describe("renderPrBody", () => {
	it("holds parts 1 and 2, the counts and the report's path, and no quote", () => {
		const locks = withUnits(baseLocks(), "3401", [
			named(41, "Tilbud 41", {
				phone: acceptedField({
					sourceUrl: page("tjeneste-41"),
					evidence: { kind: "quote", quotes: [EVIL] },
				}),
			}),
		])
		const body = renderPrBody(scored(pilotInput({ locks })), undefined, REPORT_PATH)
		expect(body).toContain(
			"| 3. At least 9 in 10 key rows found in the key kommuner | 11 of 11 (100%) | at least 10 of 11 | pass |"
		)
		expect(body).toContain("### Per kommune")
		expect(body).toContain(
			"- Sample outside the key (part 7): 3 of 20 units, 6 of 6 fields with my check, 0 to check by hand."
		)
		expect(body).toContain("The whole report is committed as `docs/pilot/pilot-report.md`.")
		expect(body).not.toContain("@someone")
	})

	it("throws over the limit, and the report itself is never limited", () => {
		const s = scored(pilotInput())
		const [first] = s.kommuner
		if (first === undefined) throw new Error("the fixture has kommuner")
		const big: PilotScore = {
			...s,
			kommuner: Array.from({ length: 2_000 }, (_, i) => ({
				...first,
				kommune: String(1000 + i),
				name: `Eksempelby ${i}`,
			})),
		}
		expect(() => renderPrBody(big, undefined, REPORT_PATH)).toThrow(PrBodyTooLongError)
		expect(renderReport(big).length).toBeGreaterThan(PR_BODY_LIMIT)
		expect(renderPrBody(s, undefined, REPORT_PATH).length).toBeLessThanOrEqual(PR_BODY_LIMIT)
	})
})

describe("scale formatting", () => {
	it("writes durations and byte counts the same way every time", () => {
		expect(formatDuration(30_000_000)).toBe("8 h 20 min")
		expect(formatDuration(6 * 3_600_000)).toBe("6 h")
		expect(formatDuration(125_000)).toBe("2 min 5 s")
		expect(formatDuration(5_000)).toBe("5 s")
		expect(groupDigits(1_234_567)).toBe("1,234,567")
		expect(groupDigits(999)).toBe("999")
	})
})
