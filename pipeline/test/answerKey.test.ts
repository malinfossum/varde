import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { AnswerKey } from "../src/answerKey/schema.ts"

const key = AnswerKey.parse(
	JSON.parse(readFileSync(new URL("./answer-key.json", import.meta.url), "utf8"))
)
const changes: { rows: number[] } = JSON.parse(
	readFileSync(new URL("./lavterskel-changes.json", import.meta.url), "utf8")
)

describe("answer key", () => {
	it("holds the 138 hand-verified rows", () => {
		expect(key.rows).toHaveLength(138)
		expect(new Set(key.rows.map((r) => r.id)).size).toBe(138)
	})

	it("files Oslo rows under 0301", () => {
		const oslo = key.rows.filter((r) => r.kommune === "0301")
		expect(oslo.length).toBeGreaterThan(0)
	})

	it("gives every non-national row a kommune", () => {
		expect(key.rows.filter((r) => !r.national && r.kommune === null)).toEqual([])
	})

	// The scorer matches units to rows by name within a kommune; a repeated name would
	// compare a unit with the wrong row. If this fails, stop and tell me.
	it("has no repeated name within a kommune", () => {
		const seen = key.rows.map((r) => `${r.kommune}:${r.name.toLowerCase()}`)
		expect(seen.filter((s, i) => seen.indexOf(s) !== i)).toEqual([])
	})

	// The new rule turns a badge off when the service itself costs money. I decide these
	// rows once; the scorer skips them.
	it("lists every badge row the new Lavterskel rule changes", () => {
		const paid = key.rows
			.filter((r) => r.fields.lowThreshold && r.fields.cost === "paid")
			.map((r) => r.id)
		expect(paid).toEqual(changes.rows)
	})
})
