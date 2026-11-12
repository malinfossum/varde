import { describe, expect, it } from "vitest"
import { ExtractionFile } from "../src/schema/extraction.ts"

const URL_A = "https://www.eksempel.kommune.no/helsestasjon/"

const extractedPage = (over: Record<string, unknown> = {}) => ({
	url: URL_A,
	finalUrl: URL_A,
	fetchedAt: "2026-11-06T10:00:00Z",
	adapter: "acos",
	fallback: false,
	blocks: [{ source: "heading", heading: "Kontakt", lines: ["Telefon: 62 00 00 00"] }],
	candidates: [
		{
			field: "phone",
			value: "62 00 00 00",
			evidence: { kind: "quote", quotes: ["Telefon: 62 00 00 00"] },
			origin: "unitContact",
			rank: 1,
			block: 0,
		},
	],
	lavterskelQuotes: ["Helsestasjonen er gratis."],
	...over,
})

describe("ExtractionFile", () => {
	it("holds a kommune's pages, or the national ones", () => {
		for (const scope of ["3405", "national"]) {
			const file = { scope, extractedAt: "2026-11-06T10:00:00Z", pages: [extractedPage()] }
			expect(ExtractionFile.safeParse(file).success).toBe(true)
		}
	})

	it("keeps a page that gave nothing, with its reason", () => {
		const page = extractedPage({
			problem: "cacheMismatch",
			blocks: [],
			candidates: [],
			lavterskelQuotes: [],
		})
		const file = { scope: "3405", extractedAt: "2026-11-06T10:00:00Z", pages: [page] }
		expect(ExtractionFile.safeParse(file).success).toBe(true)
	})

	it("refuses a decision as extraction evidence, a lowThreshold candidate and an unknown problem", () => {
		const bad = [
			extractedPage({
				candidates: [
					{
						field: "phone",
						value: "62 00 00 00",
						evidence: {
							kind: "decision",
							decidedOn: "2026-11-06",
							original: { kind: "quote", quotes: ["x"] },
						},
						origin: "unitContact",
					},
				],
			}),
			extractedPage({
				candidates: [
					{
						field: "lowThreshold",
						value: true,
						evidence: { kind: "quote", quotes: ["x"] },
						origin: "unitPage",
					},
				],
			}),
			extractedPage({ problem: "tooHard" }),
		]
		for (const page of bad) {
			const file = { scope: "3405", extractedAt: "2026-11-06T10:00:00Z", pages: [page] }
			expect(ExtractionFile.safeParse(file).success).toBe(false)
		}
	})
})
