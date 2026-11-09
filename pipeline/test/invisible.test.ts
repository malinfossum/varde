import { describe, expect, it } from "vitest"
import { hasInvisible, stripInvisible } from "../src/text/invisible.ts"

describe("invisible characters", () => {
	it("strips control and format characters, fillers and variation selectors, and keeps line breaks", () => {
		expect(stripInvisible("Eksempel\u202E helsestasjon")).toBe("Eksempel helsestasjon")
		expect(stripInvisible("Man\u200Bdag\u2060 \u3164kl.\uFE0F 08:00\u{E0100}")).toBe(
			"Mandag kl. 08:00"
		)
		expect(stripInvisible("Telefon:\n62 00 00 00\tkl. 08:00")).toBe(
			"Telefon:\n62 00 00 00\tkl. 08:00"
		)
	})

	it("tells whether a text still holds one, the same answer every call", () => {
		expect(hasInvisible("Mandag\u200B kl. 08:00")).toBe(true)
		expect(hasInvisible("Mandag\u200B kl. 08:00")).toBe(true)
		expect(hasInvisible("Mandag kl. 08:00")).toBe(false)
	})
})
