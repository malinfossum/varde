import { describe, expect, it } from "vitest"
import { lavterskel } from "../src/gates/lavterskel.ts"
import { readReferral } from "../src/gates/phrases.ts"

describe("readReferral", () => {
	it("reads the no-referral phrases", () => {
		expect(readReferral(["Du kan komme uten henvisning."])).toBe("noneNeeded")
		expect(readReferral(["Du trenger ikke vedtak."])).toBe("noneNeeded")
		expect(readReferral(["Åpen drop-in hver onsdag."])).toBe("noneNeeded")
		// Final fixes 3 ruling: "for voksne" names a group, so the allowlist reads it as unclear.
		expect(readReferral(["Et lavterskeltilbud for voksne."])).toBe("unclear")
	})

	it("tells 'krever ikke henvisning' from 'krever henvisning'", () => {
		expect(readReferral(["Tilbudet krever ikke henvisning."])).toBe("noneNeeded")
		expect(readReferral(["Tilbudet krever henvisning fra lege."])).toBe("needed")
	})

	it("calls a negator elsewhere in the sentence unclear", () => {
		expect(readReferral(["Du trenger henvisning fra fastlege, men ikke for samtale."])).toBe(
			"unclear"
		)
	})

	it("calls quotes that say both unclear", () => {
		expect(readReferral(["Gratis drop-in. Krever henvisning for behandling."])).toBe("unclear")
	})

	it("is silent when no quote speaks of referral", () => {
		expect(readReferral(["Åpent tirsdager."])).toBe("silent")
	})
})

describe("lavterskel rule", () => {
	it("says yes to free with no referral", () => {
		expect(lavterskel(["Gratis, og du trenger ikke henvisning."], undefined).outcome).toBe("yes")
	})

	// Final fixes 3 ruling: the coffee quote holds a price and a number, so the allowlist sends
	// the badge to review even when the unit's own cost is partly.
	it("sends free entry with paid coffee to review, even once the unit's cost is partly", () => {
		const quotes = ["Gratis å delta, uten henvisning.", "Kaffe koster 20 kr."]
		expect(lavterskel(quotes, "partly").outcome).toBe("review")
	})

	it("never infers partly from quotes alone", () => {
		const coffee = ["Gratis å delta, uten henvisning.", "Kaffe koster 20 kr."]
		expect(lavterskel(coffee, undefined).outcome).toBe("review")
		// Free parking is no free evidence (final fixes F1), so this reads as a fee: no, not yes.
		const parking = ["Uten henvisning. Egenandel kr 350. Gratis parkering."]
		expect(lavterskel(parking, undefined).outcome).toBe("no")
	})

	it("says no to a lavterskel service with a fee", () => {
		const quotes = ["Lavterskeltilbud, ingen henvisning.", "Egenandel kr 350 per time."]
		expect(lavterskel(quotes, undefined).outcome).toBe("no")
		expect(lavterskel(["Lavterskeltilbud, ingen henvisning."], "paid").outcome).toBe("no")
	})

	it("says no when a referral is needed", () => {
		expect(lavterskel(["Gratis, men krever henvisning fra lege."], undefined).outcome).toBe("no")
	})

	it("sends silence on cost or referral to review", () => {
		expect(lavterskel(["Drop-in hver onsdag."], undefined).outcome).toBe("review")
		expect(lavterskel(["Tilbudet er gratis."], undefined).outcome).toBe("review")
	})

	it("sends an unclear negation to review, never to yes", () => {
		const quotes = ["Gratis. Du trenger henvisning fra fastlege, men ikke for samtale."]
		expect(lavterskel(quotes, undefined).outcome).toBe("review")
	})

	it("takes the unit's own cost value over the quotes", () => {
		expect(lavterskel(["Drop-in, uten henvisning."], "free").outcome).toBe("yes")
		expect(lavterskel(["Drop-in, uten henvisning."], "partly").outcome).toBe("yes")
	})
})

describe("fix round 1: false yes outcomes go to review", () => {
	it("1. a wider negation does not cancel the referral", () => {
		const a = ["Gratis. Vi tar ikke imot pasienter uten henvisning."]
		const b = ["Gratis. Ingen behandling uten henvisning."]
		expect(readReferral(a)).toBe("unclear")
		expect(readReferral(b)).toBe("unclear")
		expect(lavterskel(a, undefined).outcome).toBe("review")
		expect(lavterskel(b, undefined).outcome).toBe("review")
	})

	it("2. a negated lavterskel or drop-in word is not a no-referral reading", () => {
		const a = ["Gratis. Dette er ikke et lavterskeltilbud."]
		const b = ["Gratis. Ingen drop-in, kun time etter avtale."]
		expect(readReferral(a)).toBe("unclear")
		expect(readReferral(b)).toBe("unclear")
		expect(lavterskel(a, undefined).outcome).toBe("review")
		expect(lavterskel(b, undefined).outcome).toBe("review")
	})

	it("3. a negator does not reach across a clause to a second referral word", () => {
		const quotes = ["Gratis. Krever ikke henvisning, men vedtak fra NAV."]
		expect(readReferral(quotes)).toBe("unclear")
		expect(lavterskel(quotes, undefined).outcome).toBe("review")
	})

	it("4. inflected referral words count", () => {
		const quotes = ["Gratis. Lavterskeltilbud. Du må være henvist fra fastlege."]
		expect(readReferral(quotes)).toBe("unclear")
		expect(lavterskel(quotes, undefined).outcome).toBe("review")
		expect(readReferral(["Tilbudet henvises via fastlege."])).toBe("needed")
	})

	it("5. the unit's free cost does not silence a fee in the quotes", () => {
		const quotes = ["Uten henvisning. Egenandel kr 350 per time."]
		expect(lavterskel(quotes, "free").outcome).toBe("review")
	})
})

describe("final fixes F1: qualified text never gives an automatic yes", () => {
	it("does not count a free extra as a free service", () => {
		for (const quote of [
			"Gratis parkering. Du trenger ikke henvisning.",
			"Gratis kaffe. Drop-in hver tirsdag.",
			"Gratis parkering for besøkende. Drop-in alle hverdager.",
		]) {
			expect(lavterskel([quote], undefined).outcome, quote).toBe("review")
		}
	})

	it("does not count free for one group as a free service", () => {
		const quotes = ["Gratis for barn under 18 år. Du trenger ikke henvisning."]
		expect(lavterskel(quotes, undefined).outcome).toBe("review")
	})

	it("reads a closed or ended drop-in or lavterskel service as unclear", () => {
		for (const quote of [
			"Drop-in-tilbudet er avviklet.",
			"Lavterskeltilbudet er lagt ned.",
			"Drop-in er nedlagt.",
			"Drop-in er stengt i sommer.",
			"Lavterskeltilbudet finnes ikke lenger.",
			"Drop-in opphører fra januar.",
			"Tilbudet uten henvisning er avviklet.",
		]) {
			expect(readReferral([quote]), quote).toBe("unclear")
			expect(lavterskel([`Gratis. ${quote}`], undefined).outcome, quote).toBe("review")
		}
	})
})

describe("final fixes F2: henvisningsfri and selvhenvisning mean no referral", () => {
	it("reads the no-referral compounds as noneNeeded", () => {
		for (const quote of [
			"Tilbudet er gratis og henvisningsfritt.",
			"Et henvisningsfritt tilbud.",
			"Samtalene er vedtaksfrie.",
			"Du kan selvhenvise deg.",
			"Tilbudet tar imot selvhenvisninger.",
			"Du kan henvise deg selv.",
		]) {
			expect(readReferral([quote]), quote).toBe("noneNeeded")
		}
	})

	it("gives yes to a free, henvisningsfritt service", () => {
		expect(lavterskel(["Tilbudet er gratis og henvisningsfritt."], undefined).outcome).toBe("yes")
	})

	it("still reads a negated compound as unclear", () => {
		expect(readReferral(["Tilbudet er ikke henvisningsfritt."])).toBe("unclear")
		expect(readReferral(["Du kan ikke henvise deg selv."])).toBe("unclear")
	})
})

describe("final fixes 2 N1: a negator or a limit after a no-referral marker", () => {
	it("reads a no-referral marker with a negator anywhere in the sentence as unclear", () => {
		for (const quote of [
			"Selvhenvisning er ikke mulig.",
			"Selvhenvisning er dessverre ikke mulig lenger.",
			"Henvisningsfritt, men ikke for alle.",
		]) {
			expect(readReferral([quote]), quote).toBe("unclear")
		}
		expect(lavterskel(["Selvhenvisning er ikke mulig.", "Gratis."], undefined).outcome).toBe(
			"review"
		)
	})

	it("reads a no-referral marker with a limiting word as unclear", () => {
		for (const quote of [
			"Henvisningsfritt, men bare for voksne.",
			"Du kan kun henvise deg selv til kurset.",
			"Vedtaksfritt unntatt for langtidsopphold.",
		]) {
			expect(readReferral([quote]), quote).toBe("unclear")
		}
	})

	it("still reads a plain no-referral marker as noneNeeded", () => {
		expect(readReferral(["Tilbudet er gratis og henvisningsfritt."])).toBe("noneNeeded")
		expect(readReferral(["Du kan henvise deg selv."])).toBe("noneNeeded")
	})
})

describe("final fixes 2 R4: a closure in any sentence of any quote", () => {
	it("reads a closure in the next sentence as unclear", () => {
		const quotes = ["Drop-in hver tirsdag. Det ble avviklet i 2024."]
		expect(readReferral(quotes)).toBe("unclear")
		expect(lavterskel(quotes, "free").outcome).toBe("review")
	})

	it("reads a closure in another quote as unclear", () => {
		const quotes = ["Drop-in hver tirsdag.", "Det ble avviklet i 2024."]
		expect(readReferral(quotes)).toBe("unclear")
		expect(lavterskel(quotes, "free").outcome).toBe("review")
	})

	it("reads every closure word in another quote as unclear", () => {
		for (const closed of [
			"Tilbudet er lagt ned.",
			"Tilbudet er nedlagt.",
			"Kontoret er stengt.",
			"Tilbudet finnes ikke lenger.",
			"Tilbudet opphørte i fjor.",
		]) {
			expect(readReferral(["Gratis drop-in, uten henvisning.", closed]), closed).toBe("unclear")
		}
	})

	it("reads a referral need beside a closure as unclear too", () => {
		expect(readReferral(["Krever henvisning.", "Tilbudet er avviklet."])).toBe("unclear")
	})
})

describe("final fixes 2 concern 1: a negator or a limit anywhere in a lavterskel or drop-in sentence", () => {
	it("never gives yes when the marker sentence holds a stray negator or a limiting word", () => {
		for (const quotes of [
			["Drop-in er ikke mulig.", "Gratis."],
			["Drop-in kun for innbyggere.", "Gratis."],
			["Lavterskeltilbud, men ikke for alle.", "Gratis."],
			["Drop-in er dessverre ikke mulig.", "Gratis."],
			["Lavterskeltilbud bare for innbyggere.", "Gratis."],
			["Drop-in, unntatt i ferier.", "Gratis."],
		]) {
			expect(readReferral(quotes), quotes[0]).toBe("unclear")
			expect(lavterskel(quotes, undefined).outcome, quotes[0]).toBe("review")
		}
	})

	it("takes the negator as a no-referral phrase only right before the referral word", () => {
		const quotes = ["Drop-in ikke mulig, henvisning kreves.", "Gratis."]
		expect(readReferral(quotes)).toBe("unclear")
		expect(lavterskel(quotes, undefined).outcome).toBe("review")
		// A no-referral marker never takes the exception.
		expect(readReferral(["Selvhenvisning, ikke henvisning."])).toBe("unclear")
	})

	it("still counts the one negator of a no-referral phrase beside the marker", () => {
		expect(readReferral(["Drop-in, uten henvisning."])).toBe("noneNeeded")
		expect(readReferral(["Lavterskeltilbud, ingen henvisning."])).toBe("noneNeeded")
		expect(lavterskel(["Drop-in, uten henvisning."], "free").outcome).toBe("yes")
	})

	it("still gives yes to a plain marker sentence", () => {
		expect(lavterskel(["Drop-in hver tirsdag.", "Gratis."], undefined).outcome).toBe("yes")
		// Final fixes 3 ruling: "for voksne" names a group, so the allowlist reads it as unclear.
		expect(readReferral(["Et lavterskeltilbud for voksne."])).toBe("unclear")
	})
})

describe("final fixes 2 referral window: the negator stands right before the referral word", () => {
	it("never gives yes to a negator out of place or a requirement after the word", () => {
		for (const quotes of [
			["Ikke mulig, henvisning kreves.", "Gratis."],
			["Ikke, henvisning kreves.", "Gratis."],
			["Ikke mulig uten at henvisning foreligger.", "Gratis."],
			// No requirement word in these two, so only the window rule can catch them.
			["Ikke mulig, henvisning fra lege.", "Gratis."],
			["Ikke, henvisning fra lege.", "Gratis."],
			["Ingen henvisning kreves.", "Gratis."],
			["Uten henvisning krever vi time.", "Gratis."],
			["Ingen henvisning er påkrevd.", "Gratis."],
			["Uten vedtak må ha avtale.", "Gratis."],
		]) {
			expect(readReferral(quotes), quotes[0]).toBe("unclear")
			expect(lavterskel(quotes, undefined).outcome, quotes[0]).toBe("review")
		}
	})

	it("still reads a negator right before the referral word as noneNeeded", () => {
		for (const quote of [
			"Du trenger ikke henvisning.",
			"Krever ikke henvisning.",
			"Uten henvisning.",
			"Du trenger ikke vedtak.",
		]) {
			expect(readReferral([quote]), quote).toBe("noneNeeded")
		}
		expect(lavterskel(["Drop-in, uten henvisning."], "free").outcome).toBe("yes")
	})
})

describe("final fixes 3 A1: Lavterskel reads yes only from plain claims and clean neighbours", () => {
	const yes = (quotes: string[], cost?: "free" | "partly") =>
		expect(lavterskel(quotes, cost).outcome, quotes.join(" | ")).toBe("yes")
	const notYes = (quotes: string[], cost?: "free" | "partly") => {
		expect(readReferral(quotes), quotes.join(" | ")).toBe("unclear")
		expect(lavterskel(quotes, cost).outcome, quotes.join(" | ")).toBe("review")
	}

	it("still gives yes to the plain claims", () => {
		yes(["Drop-in hver tirsdag.", "Gratis."])
		yes(["Gratis, og du trenger ikke henvisning."])
		yes(["Tilbudet er gratis, og du trenger ikke henvisning."])
		yes(["Tilbudet er gratis og henvisningsfritt."])
		yes(["Drop-in, uten henvisning."], "free")
		yes(["Du kan henvise deg selv.", "Gratis."])
		yes(["Du trenger ikke henvisning.", "Det koster ingenting."])
	})

	it("reads a claim sentence that is not plain as unclear", () => {
		// A word outside the vocabulary.
		notYes(["Drop-in for ungdom.", "Gratis."])
		// Nine words, each in the vocabulary.
		notYes(["Du kan komme uten henvisning, og det er gratis."])
		// A weekday outside a marker sentence.
		notYes(["Uten henvisning hver tirsdag.", "Gratis."])
	})

	it("reads a free sentence that is not plain as unclear", () => {
		// The negator stands after "gratis", where saysFree does not look.
		notYes(["Gratis er det ikke.", "Drop-in hver tirsdag."])
		notYes(["Drop-in hver tirsdag.", "Gratis etter avtale."])
	})

	it("reads a neighbour with a negator, a qualifier, a time, a number or a price as unclear", () => {
		for (const other of [
			"Ikke for alle.",
			"Gjelder etter avtale.",
			"Åpent fra klokken ti.",
			"Kapasitet 12 plasser.",
			"Det tas betalt for materiell.",
			"Kun Storgata 1, 2317 Hamar",
			// One signal each: a first session, a season, a group, a bare number.
			"Første samtale.",
			"Lavere bemanning i julen.",
			"Tilbudet passer for ungdom.",
			"Gruppe 12",
			// A price word alone, with no group after it.
			"Vi tar betalt.",
		]) {
			notYes(["Drop-in hver tirsdag.", "Gratis.", other])
		}
	})

	it("reads a question, a bare no or a requirement beside the claims as unclear", () => {
		notYes(["Er tilbudet gratis?", "Drop-in hver tirsdag."])
		notYes(["Lavterskeltilbud? Nei.", "Gratis."])
		for (const other of [
			"Ikkje for alle.",
			"Må søkes via NAV.",
			"Kontakt fastlegen først.",
			"Tildeles av kommunen.",
		]) {
			notYes(["Drop-in hver tirsdag.", "Gratis.", other])
		}
	})

	it("lets a quote that is only a phone number or an address stand beside the claims", () => {
		for (const other of [
			"Telefon: 62 00 00 00",
			"Ring 62 00 00 00.",
			"900 00 000",
			"Besøksadresse: Storgata 1, 2317 Hamar",
			"Storgata 1",
		]) {
			yes(["Drop-in hver tirsdag.", "Gratis.", other])
		}
	})
})

describe("final fixes 3 A2: the reviewer probes O3 to O5 never give Lavterskel yes", () => {
	it("O3: reads a closure in the next sentence or another quote as unclear", () => {
		const quotes = ["Drop-in uten henvisning. Tilbudet er avsluttet."]
		expect(readReferral(quotes)).toBe("unclear")
		expect(lavterskel(quotes, "free").outcome).toBe("review")
		for (const closed of [
			"Tilbudet er avsluttet.",
			"Kontoret stengte i fjor.",
			"Tilbudet er satt på pause.",
		]) {
			expect(readReferral(["Drop-in, uten henvisning.", closed]), closed).toBe("unclear")
			expect(lavterskel(["Drop-in, uten henvisning.", closed], "free").outcome, closed).toBe(
				"review"
			)
		}
	})

	it("O4: a negator in a neighbouring sentence never gives yes", () => {
		for (const quotes of [
			["Selvhenvisning.", "Det er ikke mulig.", "Gratis."],
			["Drop-in.", "Ikke mulig for tiden.", "Gratis."],
		]) {
			expect(readReferral(quotes), quotes[0]).toBe("unclear")
			expect(lavterskel(quotes, undefined).outcome, quotes[0]).toBe("review")
		}
	})

	it("O5: a limit on the referral-word path reads unclear", () => {
		for (const quote of [
			"Uten henvisning, men kun for innbyggere.",
			"Du trenger ikke henvisning, men bare for medlemmer.",
		]) {
			expect(readReferral([quote]), quote).toBe("unclear")
			expect(lavterskel([quote, "Gratis."], undefined).outcome, quote).toBe("review")
		}
	})
})
