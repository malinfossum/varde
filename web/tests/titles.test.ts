import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "vitest"
import { serviceTitle } from "../src/services/titles.ts"

const t = (name: string, municipalityName: string | null) =>
	serviceTitle({ name, municipalityName })

test("adds the place when the name lacks it", () => {
	expect(t("CRUX Arbeideren", "Hamar")).toBe("CRUX Arbeideren, Hamar – Varde")
})

test("keeps the name alone when it already has the place, in any case", () => {
	expect(t("Nav Hamar", "Hamar")).toBe("Nav Hamar – Varde")
	expect(t("NAV HAMAR", "Hamar")).toBe("NAV HAMAR – Varde")
})

test("a place at the start of a longer word counts as present", () => {
	expect(t("Stangehjelpa", "Stange")).toBe("Stangehjelpa – Varde")
})

test("a place inside another word does not count", () => {
	expect(t("Alkoholvern", "Hol")).toBe("Alkoholvern, Hol – Varde")
})

test("national rows have no place", () => {
	expect(t("Mental Helse Hjelpetelefonen", null)).toBe("Mental Helse Hjelpetelefonen – Varde")
})

test("drops the suffix when the title would pass 60 characters", () => {
	const name = "Vake kirkelig ressurssenter mot seksuelle overgrep"
	expect(t(name, "Oslo")).toBe(`${name}, Oslo`)
	expect(t(name, "Oslo").length).toBeLessThanOrEqual(60)
})

test("never cuts a name that is over 60 on its own", () => {
	const name = "Gjøvik frivilligsentral avd. Øverby (Øverbykafeen og Torsdagstreff)"
	expect(t(name, "Gjøvik")).toBe(name)
})

test("exactly 60 characters keeps the suffix", () => {
	const name = "x".repeat(60 - " – Varde".length)
	expect(t(name, null)).toBe(`${name} – Varde`)
})

test("a place with regex characters is matched literally", () => {
	expect(t("Senter (Hamar)", "Hamar")).toBe("Senter (Hamar) – Varde")
	expect(t("Senter", "A.B")).toBe("Senter, A.B – Varde")
})

test("the source has no regex lookbehind (Safari before 16.4 throws on it)", () => {
	const source = readFileSync(
		join(dirname(fileURLToPath(import.meta.url)), "../src/services/titles.ts"),
		"utf8"
	)
	expect(source).not.toContain("(?<")
})
