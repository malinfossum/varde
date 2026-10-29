import { describe, expect, it } from "vitest"
import { classifyCost, saysAlwaysOpen, saysFee, saysFree } from "../src/gates/phrases.ts"

describe("cost phrases", () => {
	it("reads the spec's three free phrases", () => {
		expect(saysFree("Tilbudet er gratis.")).toBe(true)
		expect(saysFree("Det koster ingenting å komme.")).toBe(true)
		expect(saysFree("Samtalene er uten egenandel.")).toBe(true)
	})

	it("does not read a negated gratis as free", () => {
		expect(saysFree("Kurset er ikke gratis.")).toBe(false)
	})

	it("reads a price or an egenandel as a fee", () => {
		expect(saysFee("Egenandel kr 350,- per time.")).toBe(true)
		expect(saysFee("Kaffe koster 20 kr.")).toBe(true)
		expect(saysFee("Pris: kr. 150")).toBe(true)
	})

	it("does not read 'uten egenandel' as a fee", () => {
		expect(saysFee("Samtalene er uten egenandel.")).toBe(false)
	})

	it("classifies free entry with a paid extra as partly", () => {
		expect(classifyCost(["Gratis å delta.", "Kaffe koster 20 kr."])).toBe("partly")
		expect(classifyCost(["Gratis å delta."])).toBe("free")
		expect(classifyCost(["Egenandel kr 350."])).toBe("paid")
		expect(classifyCost(["Åpent hver tirsdag."])).toBeUndefined()
	})
})

describe("saysAlwaysOpen", () => {
	it("reads døgnåpen and hele døgnet", () => {
		expect(saysAlwaysOpen("Legevakten er døgnåpen.")).toBe(true)
		expect(saysAlwaysOpen("Vi svarer hele døgnet, alle dager.")).toBe(true)
	})

	it("refuses a negation and a 24-hour reply time", () => {
		expect(saysAlwaysOpen("Kontoret er ikke døgnåpent.")).toBe(false)
		expect(saysAlwaysOpen("Vi svarer innen 24 timer.")).toBe(false)
	})
})
