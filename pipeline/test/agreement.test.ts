import { describe, expect, it } from "vitest"
import { agreementGate } from "../src/gates/agreement.ts"
import { comparable } from "../src/gates/compare.ts"
import type { Candidate } from "../src/gates/types.ts"
import { candidate, context } from "./helpers.ts"

const brreg = (value: string, over: Partial<Candidate> = {}) =>
	candidate({
		value,
		sourceUrl: "https://data.brreg.no/enhetsregisteret/api/enheter/999999999",
		evidence: { kind: "register", register: "brreg", recordId: "999999999" },
		origin: "register",
		...over,
	})

describe("comparable", () => {
	it("treats one number written three ways as one", () => {
		expect(comparable("phone", "+47 62 00 00 00")).toBe(comparable("phone", "62000000"))
	})

	it("treats one URL with and without www as one", () => {
		expect(comparable("website", "https://www.hamar.kommune.no/")).toBe(
			comparable("website", "https://hamar.kommune.no")
		)
	})
})

describe("agreement gate", () => {
	it("passes a value with a single source", () => {
		expect(agreementGate(candidate(), context()).pass).toBe(true)
	})

	it("passes when an independent source agrees, however it is written", () => {
		const peers = [brreg("+47 62000000")]
		expect(agreementGate(candidate(), context({ peers })).pass).toBe(true)
	})

	it("sends a disagreement to review", () => {
		const peers = [brreg("62 11 11 11")]
		expect(agreementGate(candidate(), context({ peers }))).toMatchObject({
			pass: false,
			onFail: "review",
		})
	})

	it("ignores a second quote from the same host, which is not independent", () => {
		const peers = [candidate({ value: "62 11 11 11" })]
		expect(agreementGate(candidate(), context({ peers })).pass).toBe(true)
	})

	it("never compares a switchboard with a direct line", () => {
		const peers = [brreg("62 11 11 11", { role: "Sentralbord" })]
		expect(agreementGate(candidate(), context({ peers })).pass).toBe(true)
	})

	it("compares addresses by Kartverket id when both resolve", () => {
		const page = candidate({ field: "address", value: "Storgata 1, 2317 Hamar" })
		const reg = brreg("STORGATA 1, 2317 HAMAR", { field: "address" })
		expect(agreementGate(page, context({ peers: [reg] })).pass).toBe(true)
		const split = (a: string) => ({
			addressId: a.startsWith("Storgata") ? "1" : "2",
			kommune: "3403",
		})
		const other = brreg("Torget 2, 2317 Hamar", { field: "address" })
		expect(agreementGate(page, context({ peers: [other], findAddress: split }))).toMatchObject({
			pass: false,
			onFail: "review",
		})
		// Written differently, same Kartverket id: only the id branch makes this pass.
		const padded = brreg("Storgata 01, 2317 Hamar", { field: "address" })
		expect(agreementGate(page, context({ peers: [padded], findAddress: split })).pass).toBe(true)
	})
})
