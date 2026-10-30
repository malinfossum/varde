import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { checkData } from "../src/check/dataCheck.ts"
import { acceptedField, curatedUnit, lockUnit } from "./helpers.ts"

function repo(files: Record<string, unknown>): string {
	const root = mkdtempSync(join(tmpdir(), "varde-data-"))
	mkdirSync(join(root, "data", "curated"), { recursive: true })
	mkdirSync(join(root, "data", "lock"), { recursive: true })
	for (const [path, data] of Object.entries(files)) {
		writeFileSync(join(root, "data", path), typeof data === "string" ? data : JSON.stringify(data))
	}
	return root
}

const curated = { kommune: "3403", name: "Hamar", units: [curatedUnit()] }
const lock = { kommune: "3403", units: [lockUnit()] }

describe("checkData", () => {
	it("passes a valid pair of files", () => {
		expect(checkData(repo({ "curated/3403-hamar.json": curated, "lock/3403.json": lock }))).toEqual(
			[]
		)
	})

	it("passes an empty data folder", () => {
		expect(checkData(repo({}))).toEqual([])
	})

	it("flags a file name that does not match its kommune", () => {
		expect(checkData(repo({ "lock/3405.json": lock }))).toHaveLength(1)
		expect(checkData(repo({ "curated/hamar.json": curated }))).toHaveLength(1)
	})

	it("reports a file that is not JSON without printing its text", () => {
		const problems = checkData(repo({ "lock/3403.json": '{"kommune": "62 00 00 00", ' }))
		expect(problems).toEqual(["lock/3403.json: not valid JSON"])
	})

	it("flags units out of order", () => {
		const a = lockUnit({ unitId: "org:000000002" })
		const b = lockUnit({ unitId: "org:000000001" })
		expect(checkData(repo({ "lock/3403.json": { kommune: "3403", units: [a, b] } }))).toEqual([
			"lock/3403.json: units must be sorted by unitId",
		])
	})

	it("flags a schema error", () => {
		expect(
			checkData(repo({ "lock/3403.json": { ...lock, generatedAt: "x" } })).length
		).toBeGreaterThan(0)
	})

	it("flags an accepted value its quote does not hold, without printing the value", () => {
		const bad = lockUnit({ fields: { phone: acceptedField({ value: "62 11 11 11" }) } })
		const problems = checkData(repo({ "lock/3403.json": { kommune: "3403", units: [bad] } }))
		expect(problems).toHaveLength(1)
		expect(problems[0]).not.toContain("62 11 11 11")
	})

	it("flags an accepted phone outside the number plan and hours over 200", () => {
		const phone = lockUnit({
			fields: {
				phone: acceptedField({ value: "1234", evidence: { kind: "quote", quotes: ["Ring 1234"] } }),
			},
		})
		expect(checkData(repo({ "lock/3403.json": { kommune: "3403", units: [phone] } }))).toHaveLength(
			1
		)
		const long = "x".repeat(201)
		const hours = lockUnit({
			fields: {
				openingHours: acceptedField({ value: long, evidence: { kind: "quote", quotes: [long] } }),
			},
		})
		expect(checkData(repo({ "lock/3403.json": { kommune: "3403", units: [hours] } }))).toHaveLength(
			1
		)
	})

	it("flags an account number anywhere in a lock file", () => {
		const bad = lockUnit({
			fields: {
				name: acceptedField({
					value: "Rusteamet Hamar",
					evidence: { kind: "quote", quotes: ["Rusteamet Hamar, konto 1234.56.78901"] },
				}),
			},
		})
		expect(checkData(repo({ "lock/3403.json": { kommune: "3403", units: [bad] } }))).toHaveLength(1)
	})
})
