import { describe, expect, it } from "vitest"
import {
	classifyCost,
	closedIn,
	freeQualifiedIn,
	readAlwaysOpen,
	saysAlwaysOpen,
	saysFee,
	saysFree,
} from "../src/gates/phrases.ts"

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

describe("final fixes F1: qualified free and always-open text is not a yes", () => {
	it("does not read a free extra as a free service", () => {
		expect(saysFree("Gratis parkering.")).toBe(false)
		expect(saysFree("Gratis kaffe. Drop-in hver tirsdag.")).toBe(false)
		expect(saysFree("Gratis parkering for besøkende. Drop-in alle hverdager.")).toBe(false)
		expect(saysFree("Vi har gratis wifi og enkel servering.")).toBe(false)
		expect(saysFree("Parkering er gratis.")).toBe(false)
		expect(saysFree("Kaffen koster ingenting.")).toBe(false)
	})

	it("does not read free for a group as a free service", () => {
		expect(saysFree("Gratis for barn under 18 år.")).toBe(false)
		expect(saysFree("Kurset er gratis for medlemmer.")).toBe(false)
		expect(saysFree("Gratis for studenter.")).toBe(false)
		expect(saysFree("Gratis for de under 25 år.")).toBe(false)
		expect(saysFree("Gratis for alle under 25 år.")).toBe(false)
		// The digit rule (final fixes 2 R2) also catches the line above; this one has no digit.
		expect(saysFree("Gratis for alle som bor i kommunen.")).toBe(false)
		expect(classifyCost(["Gratis for barn under 18 år."])).toBeUndefined()
		expect(classifyCost(["Gratis parkering."])).toBeUndefined()
	})

	it("still reads the plain free phrases", () => {
		expect(saysFree("Tilbudet er gratis.")).toBe(true)
		expect(saysFree("Gratis å delta.")).toBe(true)
		expect(saysFree("Gratis for alle.")).toBe(true)
		expect(saysFree("Gratis drop-in.")).toBe(true)
		expect(saysFree("Det koster ingenting å komme.")).toBe(true)
		expect(classifyCost(["Tilbudet er gratis, og du trenger ikke henvisning."])).toBe("free")
	})

	it("reads a qualified always-open sentence as qualified, never as yes", () => {
		for (const text of [
			"Telefonen er stengt hele døgnet 24. desember.",
			"Åpent hele døgnet i helger og høytider.",
			"Døgnåpent fra fredag til mandag.",
			"Chatten er åpen 24/7 i sommerferien.",
			"Døgnåpent på hverdager.",
			"Døgnåpent unntatt julaften.",
		]) {
			expect(saysAlwaysOpen(text), text).toBe(false)
			expect(readAlwaysOpen(text), text).toBe("qualified")
		}
	})

	it("reads an unqualified always-open sentence as yes", () => {
		for (const text of [
			"Åpent hele døgnet.",
			"Døgnåpent.",
			"Vi svarer 24/7.",
			"Åpent 24 timer i døgnet.",
		]) {
			expect(saysAlwaysOpen(text), text).toBe(true)
			expect(readAlwaysOpen(text), text).toBe("yes")
		}
	})

	it("reads a quote that says both as qualified", () => {
		expect(
			readAlwaysOpen("Legevakten er døgnåpen. Telefonen er stengt hele døgnet 1. juledag.")
		).toBe("qualified")
		// A closure in the next sentence qualifies the claim too; a phone number there does not.
		expect(readAlwaysOpen("Døgnåpent. Stengt 24. desember.")).toBe("qualified")
		expect(readAlwaysOpen("Legevakten er døgnåpen. Ring 62 00 00 00.")).toBe("yes")
	})

	it("reads no claim or a negated claim as no", () => {
		expect(readAlwaysOpen("Åpent tirsdager.")).toBe("no")
		expect(readAlwaysOpen("Kontoret er ikke døgnåpent.")).toBe("no")
	})
})

describe("final fixes 2 R2: a limited free phrase is not free evidence", () => {
	const limited = [
		"Gratis første time.",
		"Gratis prøvetime.",
		"Gratis hvis du er student.",
		"Gratis inntil 5 timer.",
		"Gratis å delta, men bare for medlemmer.",
	]

	it("does not read a free phrase with a limit in its sentence as free", () => {
		for (const text of limited) {
			expect(saysFree(text), text).toBe(false)
			expect(classifyCost([text]), text).not.toBe("free")
		}
	})

	it("reads each limiting signal on its own", () => {
		for (const text of [
			"Gratis ut 2026.",
			"Gratis den første gangen.",
			"Gratis to ganger.",
			"Gratis dersom du bor i kommunen.",
			"Gratis når du er under utredning.",
			"Gratis opptil tre samtaler.",
			"Gratis, maks tre samtaler.",
			"Gratis til og med desember.",
			"Gratis så lenge tilbudet varer.",
			"Gratis, kun for innbyggere.",
			"Gratis unntatt kursmateriell.",
			"Gratis, med unntak av kurs.",
			"Gratis for medlemmer og andre.",
			"Gratis time hos rådgiver.",
			"Timen er gratis.",
			"Medlemskap er gratis.",
		]) {
			expect(saysFree(text), text).toBe(false)
		}
	})

	it("still reads the plain free phrases as free", () => {
		for (const text of [
			"Gratis.",
			"Tilbudet er gratis.",
			"Det koster ingenting.",
			"Gratis for alle.",
		]) {
			expect(saysFree(text), text).toBe(true)
			expect(classifyCost([text]), text).toBe("free")
		}
	})
})

describe("final fixes 2 R3: a limited always-open claim is qualified", () => {
	it("reads a claim limited to some people as qualified", () => {
		for (const text of [
			"Åpent hele døgnet, men kun for innlagte.",
			"Døgnåpent for kvinner.",
			"Vi svarer 24/7 for ansatte.",
			"Døgnåpent, bare ved akutt behov.",
			"Åpent hele døgnet for alle over 18 år.",
			// No digit here, so only the "for alle" narrowing rule can qualify it.
			"Døgnåpent for alle som er innlagt.",
		]) {
			expect(readAlwaysOpen(text), text).toBe("qualified")
			expect(saysAlwaysOpen(text), text).toBe(false)
		}
	})

	it("still reads a plain or an everyone claim as yes", () => {
		for (const text of [
			"Åpent hele døgnet.",
			"Døgnåpent.",
			"Vi svarer 24/7.",
			"Åpent hele døgnet for alle.",
		]) {
			expect(readAlwaysOpen(text), text).toBe("yes")
		}
	})
})

describe("final fixes 3 A2: the denylist second net learns the probe words", () => {
	it("O3: reads avsluttet, stengte and satt på pause as a closure", () => {
		for (const quote of [
			"Tilbudet er avsluttet.",
			"Drop-in avsluttes i desember.",
			"Kontoret stengte i fjor.",
			"Tilbudet er satt på pause.",
		]) {
			expect(closedIn([quote]), quote).toBe(true)
		}
	})

	it("O2: reads avgift, gebyr, vederlag and their compounds as a price", () => {
		for (const quote of [
			"Avgift",
			"Gebyr",
			"Vederlag",
			"Kursavgift.",
			"Egenbetaling.",
			"Kontingent.",
			"Kostnad etter avtale.",
		]) {
			expect(freeQualifiedIn([quote]), quote).toBe(true)
		}
		expect(freeQualifiedIn(["Kostnadsfritt."])).toBe(false)
	})
})
