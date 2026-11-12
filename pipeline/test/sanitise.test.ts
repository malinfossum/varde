import { describe, expect, it } from "vitest"
import { sanitise, sanitiseCounted } from "../src/review/sanitise.ts"

describe("sanitise", () => {
	it("strips colour and cursor codes, so a page cannot recolour or clear my terminal", () => {
		expect(sanitise("\u001b[31mrød\u001b[0m \u001b[2Jtekst")).toBe("rød tekst")
		expect(sanitise("\u009b31mrød")).toBe("rød")
	})

	it("strips OSC 8 links, so a link cannot show one text and point somewhere else", () => {
		const link = "\u001b]8;;https://angriper.example/\u001b\\Eksempel kommune\u001b]8;;\u001b\\"
		expect(sanitise(link)).toBe("Eksempel kommune")
		expect(sanitise("\u001b]0;ny tittel\u0007tekst")).toBe("tekst")
	})

	it("strips bidi controls, zero-width characters and other control characters", () => {
		expect(sanitise("62\u202e00\u2066 00\u200b 00\u0007")).toBe("6200 00 00")
		expect(sanitise("linje\nto\tfane")).toBe("linje to fane")
	})

	it("strips every character text/invisible.ts names: tag characters, Hangul fillers, variation selectors", () => {
		expect(sanitise("Eksempel\u{E0041}\u3164 helse\uFE0Fstasjon\uFFF9")).toBe(
			"Eksempel helsestasjon"
		)
	})

	it("counts what it removed, so the screen can say that something was hidden", () => {
		expect(sanitiseCounted("62\u200b00 00 00")).toEqual({ text: "6200 00 00", hidden: 1 })
		expect(sanitiseCounted("linje\nto")).toEqual({ text: "linje to", hidden: 0 })
		expect(sanitiseCounted("\u001b[31mrød")).toEqual({ text: "rød", hidden: 5 })
	})

	it("keeps Norwegian letters and ordinary punctuation", () => {
		expect(sanitise("Åpent kl. 08:00\u201315:30, også lørdag.")).toBe(
			"Åpent kl. 08:00\u201315:30, også lørdag."
		)
	})
})
