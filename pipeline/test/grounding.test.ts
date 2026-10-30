import { describe, expect, it } from "vitest"
import { groundingGate } from "../src/gates/grounding.ts"
import { freeQualifiedIn } from "../src/gates/phrases.ts"
import { candidate, context } from "./helpers.ts"

describe("grounding gate", () => {
	it("passes a register value by its record id", () => {
		const c = candidate({
			sourceUrl: "https://data.brreg.no/enhetsregisteret/api/enheter/999999999",
			evidence: { kind: "register", register: "brreg", recordId: "999999999" },
			origin: "register",
		})
		expect(groundingGate(c, context()).pass).toBe(true)
	})

	it("passes a quote that is on the page and holds the value", () => {
		expect(groundingGate(candidate(), context()).pass).toBe(true)
	})

	it("sees through typography", () => {
		const c = candidate({
			field: "openingHours",
			value: "hverdager 08.00-15.30",
			evidence: { kind: "quote", quotes: ["(hverdager 08.00-15.30)"] },
		})
		expect(groundingGate(c, context()).pass).toBe(true)
	})

	it("drops an invented value whose quote is not on the page", () => {
		const c = candidate({
			value: "900 00 000",
			evidence: { kind: "quote", quotes: ["Telefon: 900 00 000"] },
		})
		expect(groundingGate(c, context())).toMatchObject({ pass: false, onFail: "drop" })
	})

	it("drops a value the quote does not hold", () => {
		const c = candidate({ value: "900 00 000" })
		expect(groundingGate(c, context())).toMatchObject({ pass: false, onFail: "drop" })
	})

	// The valid quote beside the blank one holds the value, so only the blank-quote check can
	// drop this candidate.
	it("drops a blank quote, which every page would contain", () => {
		const c = candidate({
			evidence: { kind: "quote", quotes: ["Telefon: 62 00 00 00", "  \u00A0 "] },
		})
		expect(groundingGate(c, context())).toMatchObject({ pass: false, onFail: "drop" })
	})

	it("drops a value with no cached page", () => {
		expect(groundingGate(candidate(), context({ pageText: () => undefined }))).toMatchObject({
			pass: false,
			onFail: "drop",
		})
	})

	it("grounds a website from the href in the cleaned text", () => {
		const c = candidate({
			field: "website",
			value: "https://hamar.kommune.no/rusteamet",
			evidence: { kind: "quote", quotes: ["Nettside: https://www.hamar.kommune.no/rusteamet/"] },
		})
		expect(groundingGate(c, context()).pass).toBe(true)
	})

	it("checks a cost value against its quotes", () => {
		const free = candidate({
			field: "cost",
			value: "free",
			evidence: { kind: "quote", quotes: ["Tilbudet er gratis"] },
		})
		expect(groundingGate(free, context()).pass).toBe(true)
		const paid = { ...free, value: "paid" }
		expect(groundingGate(paid, context())).toMatchObject({ pass: false, onFail: "review" })
	})

	// These quotes classify as partly, so only the dedicated partly line can send them to review.
	it("always sends partly free to review", () => {
		const quotes = ["Gratis å delta.", "Kaffe koster 20 kr."]
		const c = candidate({
			field: "cost",
			value: "partly",
			evidence: { kind: "quote", quotes },
		})
		const page = quotes.join(" ")
		expect(groundingGate(c, context({ pageText: () => page }))).toMatchObject({
			pass: false,
			onFail: "review",
		})
	})

	it("drops a quote over 400 characters, which would ground anything", () => {
		const long = `Telefon: 62 00 00 00 ${"x".repeat(400)}`
		const c = candidate({ evidence: { kind: "quote", quotes: [long] } })
		const page = `${long}`
		expect(groundingGate(c, context({ pageText: () => page }))).toMatchObject({
			pass: false,
			onFail: "drop",
		})
	})

	// The quote really says døgnåpen, so only the value check can drop a false.
	it("stores only an always-open claim, never its absence", () => {
		const quote = "Legevakten er døgnåpen."
		const c = candidate({
			field: "alwaysOpen",
			value: false,
			evidence: { kind: "quote", quotes: [quote] },
		})
		expect(groundingGate(c, context({ pageText: () => quote }))).toMatchObject({
			pass: false,
			onFail: "drop",
		})
	})

	it("drops an address that is only the start of a longer house number", () => {
		const page = "Besøksadresse: Storgata 12, 2317 Hamar"
		const quotes = ["Besøksadresse: Storgata 12, 2317 Hamar"]
		const ctx = context({ pageText: () => page })
		const short = candidate({
			field: "address",
			value: "Storgata 1",
			evidence: { kind: "quote", quotes },
		})
		expect(groundingGate(short, ctx)).toMatchObject({ pass: false, onFail: "drop" })
		const whole = candidate({
			field: "address",
			value: "Storgata 12",
			evidence: { kind: "quote", quotes },
		})
		expect(groundingGate(whole, ctx).pass).toBe(true)
	})

	it("sends a free cost grounded only on a free extra to review", () => {
		const page = "Gratis parkering. Egenandel kr 350 per time."
		const c = candidate({
			field: "cost",
			value: "free",
			evidence: { kind: "quote", quotes: ["Gratis parkering."] },
		})
		expect(groundingGate(c, context({ pageText: () => page }))).toMatchObject({
			pass: false,
			onFail: "review",
		})
	})

	it("sends an always-open claim on a qualified sentence to review", () => {
		for (const quote of [
			"Telefonen er stengt hele døgnet 24. desember.",
			"Åpent hele døgnet i helger og høytider.",
			"Døgnåpent fra fredag til mandag.",
			"Chatten er åpen 24/7 i sommerferien.",
		]) {
			const c = candidate({
				field: "alwaysOpen",
				value: true,
				evidence: { kind: "quote", quotes: [quote] },
			})
			expect(groundingGate(c, context({ pageText: () => quote })), quote).toMatchObject({
				pass: false,
				onFail: "review",
			})
		}
	})

	it("grounds an always-open claim on an unqualified sentence", () => {
		const quote = "Legevakten er døgnåpen."
		const c = candidate({
			field: "alwaysOpen",
			value: true,
			evidence: { kind: "quote", quotes: [quote] },
		})
		expect(groundingGate(c, context({ pageText: () => quote })).pass).toBe(true)
	})

	it("drops an always-open claim no quote makes", () => {
		const quote = "Åpent tirsdager."
		const c = candidate({
			field: "alwaysOpen",
			value: true,
			evidence: { kind: "quote", quotes: [quote] },
		})
		expect(groundingGate(c, context({ pageText: () => quote }))).toMatchObject({
			pass: false,
			onFail: "drop",
		})
	})
})

describe("final fixes 2 R1, R2, R4: grounding reads every quote together", () => {
	const ground = (field: "cost" | "alwaysOpen", value: string | boolean, quotes: string[]) =>
		groundingGate(
			candidate({ field, value, evidence: { kind: "quote", quotes } }),
			context({ pageText: () => quotes.join(" ") })
		)
	const toReview = { pass: false, onFail: "review" }

	it("sends an always-open claim to review when another quote qualifies it", () => {
		for (const quotes of [
			["Døgnåpent.", "Stengt 24. desember."],
			["Døgnåpent.", "Åpent mandag til fredag."],
			["Døgnåpent.", "Kun for innlagte."],
			["Døgnåpent.", "Redusert bemanning i julen."],
			// Read together, a number anywhere is a time signal too, so a phone number beside
			// the claim also goes to review. readAlwaysOpen on the one quote still says yes.
			["Legevakten er døgnåpen.", "Ring 62 00 00 00."],
			["Legevakten er døgnåpen. Ring 62 00 00 00."],
		]) {
			expect(ground("alwaysOpen", true, quotes), quotes.join(" | ")).toMatchObject(toReview)
		}
	})

	it("sends an always-open claim to review when any quote says the service closed", () => {
		for (const quotes of [
			["Døgnåpent.", "Tilbudet er lagt ned."],
			["Døgnåpent.", "Tilbudet finnes ikke lenger."],
			["Døgnåpent. Tilbudet ble avviklet i fjor."],
		]) {
			expect(ground("alwaysOpen", true, quotes), quotes.join(" | ")).toMatchObject(toReview)
		}
	})

	it("still grounds an always-open claim the quotes make plainly", () => {
		expect(ground("alwaysOpen", true, ["Døgnåpent.", "Legevakten er døgnåpen."]).pass).toBe(true)
		expect(ground("alwaysOpen", true, ["Åpent hele døgnet for alle."]).pass).toBe(true)
	})

	it("sends a free cost to review when another quote holds a price signal", () => {
		for (const quotes of [
			["Gratis.", "Egenandel kr 350 per time."],
			["Gratis.", "Egenandel gjelder."],
			["Gratis.", "Du må betale for materiell."],
			["Gratis.", "Kurset koster litt."],
			["Gratis.", "Se prislisten."],
			["Gratis.", "Ta med noen kroner."],
			["Gratis.", "Ta med kr til kaffe."],
		]) {
			expect(ground("cost", "free", quotes), quotes.join(" | ")).toMatchObject(toReview)
		}
	})

	it("sends a free cost to review when another quote limits it", () => {
		for (const quotes of [
			["Gratis.", "Kun for medlemmer."],
			["Gratis.", "Gjelder første samtale."],
			// Read together, a number anywhere limits too. A quote that is only a phone number is
			// the one exception (final fixes 3 F2), so this one says more than the number.
			["Gratis.", "Ring 62 00 00 00 før du kommer."],
		]) {
			expect(ground("cost", "free", quotes), quotes.join(" | ")).toMatchObject(toReview)
		}
		expect(ground("cost", "free", ["Gratis første time."])).toMatchObject(toReview)
	})

	it("sends a free cost to review when any quote says the service closed", () => {
		expect(ground("cost", "free", ["Gratis.", "Tilbudet er lagt ned."])).toMatchObject(toReview)
	})

	it("still grounds a plain free cost", () => {
		for (const quotes of [
			["Gratis."],
			["Tilbudet er gratis.", "Det koster ingenting."],
			["Samtalene er uten egenandel."],
			["Gratis for alle."],
		]) {
			expect(ground("cost", "free", quotes).pass, quotes.join(" | ")).toBe(true)
		}
	})
})

describe("final fixes 3 A1: free and always-open read yes only from a plain claim", () => {
	const ground = (field: "cost" | "alwaysOpen", value: string | boolean, quotes: string[]) =>
		groundingGate(
			candidate({ field, value, evidence: { kind: "quote", quotes } }),
			context({ pageText: () => quotes.join(" ") })
		)
	const toReview = { pass: false, onFail: "review" }

	it("still grounds the plain free claims", () => {
		for (const quotes of [
			["Gratis."],
			["Tilbudet er gratis."],
			["Det koster ingenting."],
			["Gratis for alle."],
			["Samtalene er uten egenandel."],
			["Tilbudet er gratis.", "Det koster ingenting."],
		]) {
			expect(ground("cost", "free", quotes).pass, quotes.join(" | ")).toBe(true)
		}
	})

	it("sends a free claim sentence that is not plain to review", () => {
		for (const quotes of [
			// A word outside the free vocabulary.
			["Gratis etter avtale."],
			// "for alle" that is not the end of the sentence.
			["Tilbudet er gratis for alle deltakere."],
			// "for alle" in mid-sentence, with only vocabulary words around it.
			["Gratis for alle, og du kan komme."],
			// Nine words, each in the vocabulary.
			["Det er gratis, og det er gratis for alle."],
			// A negator after the free word, which saysFree does not see.
			["Gratis er det ikke."],
		]) {
			expect(ground("cost", "free", quotes), quotes.join(" | ")).toMatchObject(toReview)
		}
	})

	it("sends a free claim to review when another quote holds a negator or a qualifier", () => {
		for (const quotes of [
			["Gratis.", "Ikke for alle."],
			["Gratis.", "Gjelder etter avtale."],
			["Gratis.", "Gratis parkering."],
		]) {
			expect(ground("cost", "free", quotes), quotes.join(" | ")).toMatchObject(toReview)
		}
	})

	// Final fixes 3 F2: the second net's digit rule skips a phone-only or address-only quote too.
	it("grounds a free claim beside a phone-only or an address-only quote", () => {
		expect(ground("cost", "free", ["Gratis.", "Telefon: 62 00 00 00"]).pass).toBe(true)
		expect(ground("cost", "free", ["Gratis.", "Besøksadresse: Storgata 1, 2317 Hamar"]).pass).toBe(
			true
		)
	})

	it("still grounds the plain always-open claims", () => {
		for (const quotes of [
			["Åpent hele døgnet."],
			["Døgnåpent."],
			["Vi svarer 24/7."],
			["Åpent hele døgnet for alle."],
			["Åpent 24 timer i døgnet."],
			["Legevakten er døgnåpen."],
			["Døgnåpent.", "Legevakten er døgnåpen."],
		]) {
			expect(ground("alwaysOpen", true, quotes).pass, quotes.join(" | ")).toBe(true)
		}
	})

	it("sends an always-open claim sentence that is not plain to review", () => {
		for (const quotes of [
			["Døgnåpent ved akutt behov."],
			["Telefonen er døgnåpen for alle innbyggere."],
			["Det er døgnåpent, og det er åpent hele døgnet."],
		]) {
			expect(ground("alwaysOpen", true, quotes), quotes.join(" | ")).toMatchObject(toReview)
		}
	})

	it("sends an always-open claim to review when another quote holds a negator", () => {
		expect(ground("alwaysOpen", true, ["Døgnåpent.", "Ikke åpent om natten."])).toMatchObject(
			toReview
		)
	})

	it("sends a question or a neighbour that closes or varies the hours to review", () => {
		expect(ground("cost", "free", ["Er tilbudet gratis?"])).toMatchObject(toReview)
		expect(ground("cost", "free", ["Gratis?", "Nei."])).toMatchObject(toReview)
		expect(ground("cost", "free", ["Gratis.", "Nei."])).toMatchObject(toReview)
		expect(ground("alwaysOpen", true, ["Er det døgnåpent?"])).toMatchObject(toReview)
		for (const other of [
			"Lukket i romjulen.",
			"Åpningstidene varierer.",
			"Telefonen er betjent på dagtid.",
		]) {
			expect(ground("alwaysOpen", true, ["Døgnåpent.", other]), other).toMatchObject(toReview)
		}
	})
})

describe("final fixes 3 A2: the reviewer probes O1 to O3 never ground a yes", () => {
	const ground = (field: "cost" | "alwaysOpen", value: string | boolean, quotes: string[]) =>
		groundingGate(
			candidate({ field, value, evidence: { kind: "quote", quotes } }),
			context({ pageText: () => quotes.join(" ") })
		)
	const toReview = { pass: false, onFail: "review" }

	it("O1: a negating sibling quote sends the claim to review", () => {
		for (const quotes of [
			["Døgnåpent.", "Kontoret er ikke døgnåpent."],
			["Døgnåpent.", "Ikke åpent om natten."],
			["Døgnåpent.", "Ingen bemanning om natten."],
		]) {
			expect(ground("alwaysOpen", true, quotes), quotes.join(" | ")).toMatchObject(toReview)
		}
		for (const quotes of [
			["Gratis.", "Ikke gratis"],
			["Gratis.", "Delvis gratis."],
		]) {
			expect(ground("cost", "free", quotes), quotes.join(" | ")).toMatchObject(toReview)
		}
	})

	it("O2: a free claim with any qualifier, or beside a fee word, goes to review", () => {
		for (const quote of [
			"Gratis frem til nyttår.",
			"Gratis ut året.",
			"Gratis i sommer.",
			"Gratis bortsett fra materiell.",
			"Gratis etter avtale.",
			"Gratis med mindre du uteblir.",
			"Gratis eller rimelig.",
			"Delvis gratis.",
		]) {
			expect(ground("cost", "free", [quote]), quote).toMatchObject(toReview)
		}
		for (const fee of ["Avgift", "Gebyr", "Vederlag"]) {
			expect(ground("cost", "free", ["Gratis.", fee]), fee).toMatchObject(toReview)
		}
	})

	it("O2: an always-open claim with any qualifier goes to review", () => {
		for (const quote of [
			"Døgnåpent ved akutt behov.",
			"Døgnåpent etter avtale.",
			"Døgnåpent hvis du har time.",
			"Døgnåpent, utenom natten.",
			"Vi har ikke et slikt døgnåpent tilbud.",
		]) {
			expect(ground("alwaysOpen", true, [quote]), quote).toMatchObject(toReview)
		}
	})

	it("O3: a closure in another quote sends free and always-open to review", () => {
		for (const closed of [
			"Tilbudet er avsluttet.",
			"Kontoret stengte i fjor.",
			"Tilbudet er satt på pause.",
		]) {
			expect(ground("alwaysOpen", true, ["Døgnåpent.", closed]), closed).toMatchObject(toReview)
			expect(ground("cost", "free", ["Gratis.", closed]), closed).toMatchObject(toReview)
		}
	})
})

describe("final fixes 3 F1: a neighbour quote must itself be plain", () => {
	const ground = (field: "cost" | "alwaysOpen", value: string | boolean, quotes: string[]) =>
		groundingGate(
			candidate({ field, value, evidence: { kind: "quote", quotes } }),
			context({ pageText: () => quotes.join(" ") })
		)
	const toReview = { pass: false, onFail: "review" }

	it("sends a free claim beside a neighbour that is not plain to review", () => {
		for (const quotes of [
			["Gratis.", "Materiell kjøper du selv."],
			["Gratis.", "Tilbudet ligger ved sykehuset."],
			["Gratis.", "Ta med matpakke."],
		]) {
			expect(ground("cost", "free", quotes), quotes.join(" | ")).toMatchObject(toReview)
		}
	})

	it("sends an always-open claim beside a neighbour that is not plain to review", () => {
		expect(ground("alwaysOpen", true, ["Døgnåpent.", "Ta med matpakke."])).toMatchObject(toReview)
	})

	it("still grounds a claim whose neighbour passes one of the claim vocabularies", () => {
		// The neighbour passes the always-open vocabulary.
		expect(ground("cost", "free", ["Gratis.", "Døgnåpent."]).pass).toBe(true)
		// The neighbour passes the Lavterskel vocabulary only.
		expect(ground("cost", "free", ["Gratis.", "Tilbudet er henvisningsfritt."]).pass).toBe(true)
		// The neighbour passes the free vocabulary.
		expect(ground("alwaysOpen", true, ["Døgnåpent.", "Gratis."]).pass).toBe(true)
	})
})

describe("final fixes 3 F2: the free digit rule skips a phone-only or address-only quote", () => {
	it("keeps the digit rule for every other quote", () => {
		expect(freeQualifiedIn(["Telefon: 62 00 00 00"])).toBe(false)
		expect(freeQualifiedIn(["Storgata 1, 2317 Hamar"])).toBe(false)
		expect(freeQualifiedIn(["Ring 62 00 00 00 før du kommer."])).toBe(true)
		expect(freeQualifiedIn(["Egenandel kr 350 per time."])).toBe(true)
		const quotes = ["Gratis.", "Egenandel kr 350 per time."]
		const c = candidate({ field: "cost", value: "free", evidence: { kind: "quote", quotes } })
		expect(groundingGate(c, context({ pageText: () => quotes.join(" ") }))).toMatchObject({
			pass: false,
			onFail: "review",
		})
	})
})

describe("final fixes 3 G1: only a plain address is exempt from the neighbour check", () => {
	const ground = (quotes: string[]) =>
		groundingGate(
			candidate({ field: "cost", value: "free", evidence: { kind: "quote", quotes } }),
			context({ pageText: () => quotes.join(" ") })
		)

	it("does not take prose before a street and a number as an address", () => {
		for (const other of [
			"Forbeholdt beboere på Storgata 5",
			"Dessverre utilgjengelig Storgata 5",
			"Billett kjøpes på Storgata 5",
			"Abonnement tegnes Storgata 5",
			"Ledig plass 20",
			"Ta med penger på Storgata 5",
			// Capitals do not make prose a street name, and a place name takes no prose after it.
			"Forbeholdt Beboere Storgata 5",
			"Storgata 5, 2815 Gjøvik forbeholdt beboere",
		]) {
			expect(ground(["Gratis.", other]), other).toMatchObject({ pass: false, onFail: "review" })
		}
	})

	it("still grounds a free claim beside a plain address", () => {
		for (const address of [
			"Storgata 5, 2815 Gjøvik",
			"Besøksadresse: Storgata 5",
			"Kongens gate 5",
			"Øvre Storgate 12B, 2317 Hamar",
		]) {
			expect(ground(["Gratis.", address]).pass, address).toBe(true)
		}
	})
})

describe("final fixes 3 G2: only an 8-digit number is a phone-only quote", () => {
	const ground = (quotes: string[]) =>
		groundingGate(
			candidate({ field: "cost", value: "free", evidence: { kind: "quote", quotes } }),
			context({ pageText: () => quotes.join(" ") })
		)

	it("reads a short number, with or without a label, as a limit", () => {
		for (const other of ["350", "35 000", "150 000", "Ring 350"]) {
			expect(ground(["Gratis.", other]), other).toMatchObject({ pass: false, onFail: "review" })
		}
	})

	it("still grounds a free claim beside an 8-digit phone number", () => {
		for (const phone of ["Telefon: 62 00 00 00", "Ring 62 00 00 00."]) {
			expect(ground(["Gratis.", phone]).pass, phone).toBe(true)
		}
	})
})
