import { describe, expect, it } from "vitest"
import { sourceGate } from "../src/gates/source.ts"
import { candidate, context } from "./helpers.ts"

describe("source gate", () => {
	it("passes an allow-listed HTTPS page with a licence status", () => {
		expect(sourceGate(candidate(), context()).pass).toBe(true)
	})

	it("drops a host off the allow-list", () => {
		const result = sourceGate(candidate({ sourceUrl: "https://example.com/x" }), context())
		expect(result).toMatchObject({ pass: false, onFail: "drop" })
	})

	it("drops plain HTTP", () => {
		const result = sourceGate(candidate({ sourceUrl: "http://www.hamar.kommune.no/x" }), context())
		expect(result).toMatchObject({ pass: false, onFail: "drop" })
	})

	it("drops a URL robots.txt disallows", () => {
		const result = sourceGate(candidate(), context({ robotsAllows: () => false }))
		expect(result).toMatchObject({ pass: false, onFail: "drop" })
	})

	it("drops a host with no licence status recorded", () => {
		const result = sourceGate(candidate(), context({ licence: () => undefined }))
		expect(result).toMatchObject({ pass: false, onFail: "drop" })
	})

	it("drops a value taken from a catalogue that has not said yes", () => {
		const result = sourceGate(candidate({ sourceUrl: "https://dinutvei.no/hjelp/1" }), context())
		expect(result).toMatchObject({ pass: false, onFail: "drop" })
	})
})
