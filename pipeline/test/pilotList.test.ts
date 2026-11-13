import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { KOMMUNE_NUMBERS } from "../src/answerKey/freeze.ts"
import { CLAUDEBOT_BLOCKED, KEY_KOMMUNER, PILOT, parseOnly, selects } from "../src/pilot/list.ts"
import { parseCodesAt } from "../src/registers/klass.ts"

const sortedUnique = (list: readonly string[]) => [...new Set(list)].sort()

describe("the pilot list", () => {
	it("holds Oslo and the 46 Innlandet kommuner, sorted, each once", () => {
		expect(PILOT).toHaveLength(47)
		expect([...PILOT]).toEqual(sortedUnique(PILOT))
		expect(PILOT[0]).toBe("0301")
		expect(PILOT.filter((k) => /^34\d{2}$/.test(k))).toHaveLength(46)
		expect(PILOT.every((k) => /^\d{4}$/.test(k))).toBe(true)
	})

	it("equals the kommuner in the KLASS fixture of 03.11.2026", () => {
		const fixture = JSON.parse(
			readFileSync(new URL("./fixtures/klass/codes-at-2026-11-03.json", import.meta.url), "utf8")
		)
		const klass = parseCodesAt(fixture) ?? []
		expect([...PILOT]).toEqual(klass.map((k) => k.code).sort())
	})

	it("holds the 8 key kommuner and the 7 that block ClaudeBot, each a part of the pilot", () => {
		for (const list of [KEY_KOMMUNER, CLAUDEBOT_BLOCKED]) {
			expect([...list]).toEqual(sortedUnique(list))
			expect(list.every((k) => PILOT.includes(k))).toBe(true)
		}
		expect(KEY_KOMMUNER).toHaveLength(8)
		expect(CLAUDEBOT_BLOCKED).toHaveLength(7)
		// The key's own table of kommune numbers is the source of the 8.
		expect([...KEY_KOMMUNER]).toEqual(Object.values(KOMMUNE_NUMBERS).sort())
		// Innlandet's Våler (3419). Østfold's Våler (3114) has no block and is not in the pilot.
		expect(CLAUDEBOT_BLOCKED).toContain("3419")
		expect(PILOT).not.toContain("3114")
	})

	it("cannot be changed while a run reads it", () => {
		for (const list of [PILOT, KEY_KOMMUNER, CLAUDEBOT_BLOCKED])
			expect(Object.isFrozen(list)).toBe(true)
	})
})

describe("parseOnly", () => {
	it("gives an empty selection when --only is missing or empty", () => {
		expect(parseOnly(undefined)).toEqual([])
		expect(parseOnly("")).toEqual([])
		expect(parseOnly(" , ")).toEqual([])
	})

	it("expands pilot to the 47 kommuner", () => {
		expect(parseOnly("pilot")).toEqual([...PILOT])
	})

	it("takes pilot mixed with codes and prefixes, and counts each entry once", () => {
		expect(parseOnly("pilot,0301")).toEqual([...PILOT])
		expect(parseOnly("pilot,03")).toEqual([...PILOT, "03"])
		expect(parseOnly(" 34 , 3405,0301,0301")).toEqual(["34", "3405", "0301"])
	})

	it("refuses anything that is not a kommune number, a county prefix or pilot", () => {
		for (const raw of ["3", "340", "34055", "abc", "Pilot", "pilot,3", "34;0301", "34 05"]) {
			expect(parseOnly(raw), raw).toBeUndefined()
		}
	})
})

describe("selects", () => {
	it("takes every kommune for an empty selection, else a kommune that starts with an entry", () => {
		expect(selects([], "3405")).toBe(true)
		expect(selects(["34"], "3405")).toBe(true)
		expect(selects(["0301"], "3405")).toBe(false)
		expect(selects(PILOT, "3301")).toBe(false)
		expect(selects(PILOT, "3454")).toBe(true)
	})
})
