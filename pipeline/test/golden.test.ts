import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { AnswerKey } from "../src/answerKey/schema.ts"
import { score } from "../src/answerKey/score.ts"
import { readJsonDir } from "../src/io/files.ts"
import { KEY_KOMMUNER } from "../src/pilot/list.ts"
import { LockFile } from "../src/schema/lock.ts"
import {
	checksAgree,
	goneSamples,
	keyIsWrong,
	ratchet,
	readKnownWrong,
	readPilotChecks,
} from "../src/score/checks.ts"
import { acceptedField, lockUnit, testInputs } from "./helpers.ts"

const ROOT = fileURLToPath(new URL("../../", import.meta.url))
const here = (name: string) => fileURLToPath(new URL(`./${name}`, import.meta.url))
const key = AnswerKey.parse(JSON.parse(readFileSync(here("answer-key.json"), "utf8")))
const decideOnce: number[] = JSON.parse(readFileSync(here("lavterskel-changes.json"), "utf8")).rows
const known = readKnownWrong(here("known-wrong.json"))
const checks = readPilotChecks(here("pilot-checks.json"))

// A Hamar row with a phone, and a lock that gives it a wrong one: the planted value.
function planted() {
	const row = key.rows.find((r) => r.kommune === "3403" && r.fields.phone !== null)
	if (row === undefined || row.kommune === null || row.fields.phone === null) {
		throw new Error("no Hamar row with a phone")
	}
	const digits = row.fields.phone.replace(/\D/g, "")
	const wrongPhone = `${digits.slice(0, -1)}${digits.endsWith("0") ? "1" : "0"}`
	const lock = LockFile.parse({
		kommune: row.kommune,
		inputs: testInputs(),
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
	const result = score({ locks: [lock], key, kommuner: [row.kommune], decideOnce })
	return { row, lock, result }
}

// Runs over the committed lock files only, never the page cache. A ratchet: the pilot's baseline
// may hold wrong values, but only the ones known-wrong.json lists, and a fixed one must leave the
// list in the PR that fixes it. The report still counts listed values as wrong.
describe("golden test", () => {
	const locks = readJsonDir(join(ROOT, "data", "lock")).map((f) => LockFile.parse(f.data))
	const result = score({ locks, key, kommuner: KEY_KOMMUNER, decideOnce })
	// A badge that differs from the key, apart from the rows I decide once, is a wrong value too, so
	// it fails here unless the list holds it. A value I ruled key stale or right passes.
	const wrong = [...result.wrong, ...result.badgeWrong].filter((w) => !keyIsWrong(checks, w))

	it("finds no wrong value in the key kommuner that known-wrong.json does not list", () => {
		expect(ratchet(wrong, known).unlisted).toEqual([])
	})

	it("lists no wrong value that no longer occurs", () => {
		expect(ratchet(wrong, known).gone).toEqual([])
		expect(goneSamples(known, locks)).toEqual([])
	})

	it("lists exactly the values I ruled pipeline wrong in pilot-checks.json", () => {
		expect(checksAgree(checks, known)).toEqual([])
	})

	it("goes red on one planted wrong value that the list does not hold", () => {
		const { row, result: r } = planted()
		expect(r.wrong).toEqual([{ keyId: row.id, unitId: "org:999999999", field: "phone" }])
		expect(ratchet(r.wrong, { entries: [] }).unlisted).toEqual(r.wrong)
		const listed = {
			entries: [
				{
					kind: "disagreement" as const,
					keyId: row.id,
					unitId: "org:999999999",
					field: "phone" as const,
				},
			],
		}
		expect(ratchet(r.wrong, listed)).toEqual({ unlisted: [], gone: [] })
	})

	it("goes red on a listed wrong value that no longer occurs", () => {
		const { row } = planted()
		const fixed = {
			kind: "disagreement" as const,
			keyId: row.id,
			unitId: "org:999999999",
			field: "phone" as const,
		}
		expect(ratchet([], { entries: [fixed] }).gone).toEqual([fixed])
		const sampled = { kind: "sample" as const, unitId: "org:999999998", field: "phone" as const }
		expect(goneSamples({ entries: [sampled] }, [planted().lock])).toEqual([sampled])
	})

	it("goes red when a pipeline wrong ruling of mine is missing from the list", () => {
		const { row } = planted()
		const mine = {
			kind: "disagreement" as const,
			keyId: row.id,
			unitId: "org:999999999",
			field: "phone" as const,
			ruling: "pipelineWrong" as const,
			note: "The source page shows another number.",
			by: "me" as const,
		}
		expect(checksAgree({ checks: [mine] }, { entries: [] })).toHaveLength(1)
	})
})
