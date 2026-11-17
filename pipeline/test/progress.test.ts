import { describe, expect, it } from "vitest"
import { KommuneProgress } from "../src/fetch/progress.ts"

const K = "https://www.eksempel.kommune.no"
const A = `${K}/a/`
const B = `${K}/b/`
const C = `${K}/c/`
const NAMES = new Map([
	["3401", "Eksempelby"],
	["3405", "Nordre Eksempelby"],
	["3407", "Søndre Eksempelby"],
])

function progress(byKommune: Map<string, string[]>) {
	const lines: string[] = []
	const p = new KommuneProgress(byKommune, NAMES, (line) => lines.push(line))
	return { p, lines }
}

describe("KommuneProgress", () => {
	it("prints a kommune done when its last page settles, a shared page counting for both", () => {
		const { p, lines } = progress(
			new Map([
				["3401", [A, B]],
				["3405", [B, C]],
				["3407", []],
			])
		)
		// A kommune with nothing left to fetch is done when progress starts.
		expect(lines).toEqual(["fetch: 3407 Søndre Eksempelby done (1 of 3)"])
		p.page(A)
		expect(lines).toHaveLength(1)
		p.page(B)
		p.page(B)
		p.page(C)
		expect(lines).toEqual([
			"fetch: 3407 Søndre Eksempelby done (1 of 3)",
			"fetch: 3401 Eksempelby done (2 of 3)",
			"fetch: 3405 Nordre Eksempelby done (3 of 3)",
		])
	})

	it("prints the heartbeat with pages and kommuner, and no host or URL", () => {
		const { p, lines } = progress(
			new Map([
				["3401", [A, B]],
				["3405", [B, C]],
			])
		)
		p.heartbeat()
		p.page(A)
		p.page(B)
		p.heartbeat()
		expect(lines).toEqual([
			"fetch: 0 of 3 pages, 0 of 2 kommuner",
			"fetch: 3401 Eksempelby done (1 of 2)",
			"fetch: 2 of 3 pages, 1 of 2 kommuner",
		])
		for (const line of lines) expect(line).not.toMatch(/https:|eksempel\.kommune/)
	})

	it("ignores a URL outside every kommune, and writes large counts with a comma", () => {
		const many = Array.from({ length: 1_200 }, (_, i) => `${K}/side-${i}/`)
		const { p, lines } = progress(new Map([["3401", many]]))
		p.page("https://www.nav.no/kontor/nav-eksempel")
		p.heartbeat()
		expect(lines).toEqual(["fetch: 0 of 1,200 pages, 0 of 1 kommuner"])
	})

	it("prints the number alone for a kommune with no name", () => {
		const { lines } = progress(new Map([["3499", []]]))
		expect(lines).toEqual(["fetch: 3499 done (1 of 1)"])
	})
})
