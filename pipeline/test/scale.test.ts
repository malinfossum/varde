import { describe, expect, it } from "vitest"
import { renderPrBody, renderReport } from "../src/score/render.ts"
import { scaleNumbers } from "../src/score/scale.ts"
import { pilotInput, scored } from "./pilotFixture.ts"

// The spec's example: 1,000 pages at a 30-second delay is 8 hours 20 minutes.
const report = {
	hosts: [
		{ host: "www.eksempel.kommune.no", requests: 120, delayMs: 5_000 },
		{ host: "treg.eksempel.kommune.no", requests: 1_000, delayMs: 30_000 },
	],
	notFetched: [],
}

describe("scaleNumbers", () => {
	const n = scaleNumbers({
		report,
		lockBytes: 1_234_567,
		stats: { lookups: 400, hits: 310 },
		timings: { fetch: 30_000_000, discover: 125_000 },
	})

	it("estimates each host at its pace, slowest first, and flags one over 6 hours", () => {
		expect(n.hosts).toEqual([
			{
				host: "treg.eksempel.kommune.no",
				requests: 1_000,
				delayMs: 30_000,
				estimateMs: 30_000_000,
			},
			{ host: "www.eksempel.kommune.no", requests: 120, delayMs: 5_000, estimateMs: 600_000 },
		])
		expect(n.slowest?.host).toBe("treg.eksempel.kommune.no")
		expect(n.overJobLimit).toEqual(["treg.eksempel.kommune.no"])
		expect(n).toMatchObject({ lockBytes: 1_234_567, kartverket: { lookups: 400, hits: 310 } })
	})

	it("puts the numbers in the PR body and never in the report", () => {
		const s = scored(pilotInput())
		const body = renderPrBody(s, n, "docs/pilot/pilot-report.md")
		for (const line of [
			"| `treg.eksempel.kommune.no` | 1,000 | 30 s | 8 h 20 min |",
			"- Slowest host: `treg.eksempel.kommune.no`, 8 h 20 min for 1,000 requests at a 30 s delay.",
			"- Over the 6 h a GitHub-hosted job may run: `treg.eksempel.kommune.no`.",
			"- Lock files: 1,234,567 bytes in all.",
			"- Kartverket: 400 lookups, 310 answered from the cache.",
			"- Stage times: discover 2 min 5 s, fetch 8 h 20 min.",
		]) {
			expect(body).toContain(line)
		}
		expect(renderReport(s)).not.toContain("treg.eksempel.kommune.no")
	})

	it("has no hosts and no slowest host without a crawl report", () => {
		const bare = scaleNumbers({ lockBytes: 0, timings: {} })
		expect(bare).toEqual({ hosts: [], overJobLimit: [], lockBytes: 0, timings: {} })
	})

	const bodyOf = (n: ReturnType<typeof scaleNumbers>) =>
		renderPrBody(scored(pilotInput()), n, "docs/pilot/pilot-report.md")

	it("shows the 30 slowest hosts and counts the rest", () => {
		const hosts = Array.from({ length: 32 }, (_, i) => ({
			host: `h${String(i).padStart(2, "0")}.eksempel.kommune.no`,
			requests: 10 + i,
			delayMs: 1_000,
		}))
		const body = bodyOf(
			scaleNumbers({ report: { hosts, notFetched: [] }, lockBytes: 0, timings: {} })
		)
		expect(body).toContain("The 30 slowest hosts at their pace:")
		expect(body).toContain("| `h31.eksempel.kommune.no` | 41 | 1 s | 41 s |")
		// Slowest first: h31 down to h02 are shown, h01 and h00 are the two cut.
		expect(body).toContain("| `h02.eksempel.kommune.no` | 12 |")
		expect(body).not.toContain("h01.eksempel.kommune.no")
		expect(body).not.toContain("h00.eksempel.kommune.no")
		expect(body).toContain("And 2 more hosts with 21 requests between them.")
	})

	it("says so when no host is over the job limit, when there is no crawl report and no Kartverket counts", () => {
		const body = bodyOf(scaleNumbers({ lockBytes: 5, timings: {} }))
		expect(body).toContain("No crawl report, so no hosts.")
		expect(body).toContain("- Slowest host: none, as there is no crawl report.")
		expect(body).toContain("- No host needs more than the 6 h a GitHub-hosted job may run.")
		expect(body).toContain("- Kartverket: no counts, as verify-stats.json is missing.")
		expect(body).toContain("- Stage times: none recorded.")
	})

	it("lists the stage times in pipeline order, then unknown stages by name", () => {
		const body = bodyOf(
			scaleNumbers({
				lockBytes: 0,
				timings: { zeta: 3_000, score: 4_000, verify: 2_000, alfa: 1_000, discover: 5_000 },
			})
		)
		expect(body).toContain(
			"- Stage times: discover 5 s, verify 2 s, score 4 s, alfa 1 s, zeta 3 s."
		)
	})
})
