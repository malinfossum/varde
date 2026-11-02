import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { AnswerKey } from "../src/answerKey/schema.ts"
import { score } from "../src/answerKey/score.ts"
import { readJsonDir } from "../src/io/files.ts"
import { LockFile } from "../src/schema/lock.ts"
import { acceptedField, lockUnit } from "./helpers.ts"

const ROOT = fileURLToPath(new URL("../../", import.meta.url))
const key = AnswerKey.parse(
	JSON.parse(readFileSync(new URL("./answer-key.json", import.meta.url), "utf8"))
)
const decideOnce: number[] = JSON.parse(
	readFileSync(new URL("./lavterskel-changes.json", import.meta.url), "utf8")
).rows

// Runs over the committed lock files only, never the page cache. The full pass mark is
// PR 4's; here no accepted value may contradict the key.
describe("golden test", () => {
	const locks = readJsonDir(join(ROOT, "data", "lock")).map((f) => LockFile.parse(f.data))

	it("finds no accepted value that contradicts the answer key", () => {
		// PR 1 commits no lock files. PR 4 adds the pilot's, and this assertion then changes,
		// so the test visibly changes when lock files arrive instead of passing on nothing.
		expect(locks.length).toBe(0)
		const result = score({ locks, key, kommuner: locks.map((l) => l.kommune), decideOnce })
		expect(result.wrong).toEqual([])
		expect(result.badgeMismatches).toEqual([])
	})

	it("goes red on one planted wrong value", () => {
		const row = key.rows.find((r) => r.kommune === "3403" && r.fields.phone !== null)
		if (row === undefined || row.kommune === null || row.fields.phone === null) {
			throw new Error("no Hamar row with a phone")
		}
		const digits = row.fields.phone.replace(/\D/g, "")
		const wrongPhone = `${digits.slice(0, -1)}${digits.endsWith("0") ? "1" : "0"}`
		const planted = LockFile.parse({
			kommune: row.kommune,
			units: [
				lockUnit({
					fields: {
						name: acceptedField({
							value: row.name,
							evidence: { kind: "quote", quotes: [row.name] },
						}),
						phone: acceptedField({
							value: wrongPhone,
							evidence: { kind: "quote", quotes: [wrongPhone] },
						}),
					},
				}),
			],
		})
		const result = score({ locks: [planted], key, kommuner: [row.kommune], decideOnce })
		expect(result.wrong).toEqual([{ keyId: row.id, unitId: "org:999999999", field: "phone" }])
	})
})
