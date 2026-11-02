import { describe, expect, it } from "vitest"
import { freezeKey, type LiveMunicipality, type LiveRow } from "../src/answerKey/freeze.ts"

const MUNICIPALITIES: LiveMunicipality[] = [
	{ id: 1, name: "Hamar" },
	{ id: 8, name: "Oslo" },
]

function row(over: Partial<LiveRow> = {}): LiveRow {
	return {
		id: 500,
		name: "Rusteamet Oslo",
		municipalityId: 8,
		municipalityName: "Oslo",
		isNational: false,
		isAlwaysOpen: false,
		isLowThreshold: true,
		cost: "free",
		costNote: null,
		address: "Storgata 1, 0155 Oslo",
		phone: "62 00 00 00",
		email: null,
		website: "https://example.no",
		chatUrl: null,
		openingHours: "Hverdager 08.00\u201315.30",
		categories: [{ slug: "rus" }],
		servedMunicipalityIds: [1],
		parentId: null,
		...over,
	}
}

describe("freezeKey", () => {
	it("maps Oslo to 0301 and keeps the nb values", () => {
		const key = freezeKey(
			[row()],
			[row({ name: "Substance team Oslo" })],
			MUNICIPALITIES,
			"2026-10-29"
		)
		expect(key.rows[0]).toMatchObject({
			id: 500,
			kommune: "0301",
			servedKommuner: ["3403"],
			name: "Rusteamet Oslo",
			nameEn: "Substance team Oslo",
			categories: ["rus"],
			fields: { phone: "62 00 00 00", cost: "free", lowThreshold: true, alwaysOpen: false },
		})
	})

	it("gives a national row no kommune", () => {
		const national = row({ id: 3, municipalityId: null, municipalityName: null, isNational: true })
		const key = freezeKey([national], [national], MUNICIPALITIES, "2026-10-29")
		expect(key.rows[0]).toMatchObject({ kommune: null, national: true })
	})

	it("refuses a kommune it has no KLASS number for", () => {
		const odd = row({ municipalityId: 9, municipalityName: "Atlantis" })
		expect(() => freezeKey([odd], [odd], MUNICIPALITIES, "2026-10-29")).toThrow(/Atlantis/)
	})

	it("refuses a row with no English twin", () => {
		expect(() => freezeKey([row()], [], MUNICIPALITIES, "2026-10-29")).toThrow(/500/)
	})

	it("sorts rows by id", () => {
		const key = freezeKey(
			[row({ id: 9 }), row({ id: 2 })],
			[row({ id: 2 }), row({ id: 9 })],
			MUNICIPALITIES,
			"2026-10-29"
		)
		expect(key.rows.map((r) => r.id)).toEqual([2, 9])
	})
})
