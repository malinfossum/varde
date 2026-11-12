import { describe, expect, it } from "vitest"
import { phoneCandidates } from "../../src/extract/fields/phone.ts"
import type { ContactBlock } from "../../src/schema/extraction.ts"

const ctx = { unitName: "Eksempel helsestasjon", places: ["Eksempel"], onKommuneSite: true }
const block = (...lines: string[]): ContactBlock[] => [{ source: "heading", lines }]
const phones = (blocks: ContactBlock[]) =>
	phoneCandidates(blocks, ctx).filter((c) => c.field === "phone")
const shape = (blocks: ContactBlock[]) => phones(blocks).map((c) => [c.value, c.rank, c.role])
const D = "\u2013"

describe("phone rule: rank 1, the service phone", () => {
	it("takes a number next to Telefon, with the line as its quote", () => {
		expect(phones(block("Telefon: 62 00 00 00"))).toEqual([
			{
				field: "phone",
				value: "62 00 00 00",
				evidence: { kind: "quote", quotes: ["Telefon: 62 00 00 00"] },
				origin: "unitContact",
				rank: 1,
				block: 0,
			},
		])
	})

	it("takes Telefon on one line and the number on the next, with both lines as quotes", () => {
		expect(phones(block("Telefon:", "62 00 00 00"))).toMatchObject([
			{
				value: "62 00 00 00",
				rank: 1,
				evidence: { kind: "quote", quotes: ["Telefon:", "62 00 00 00"] },
			},
		])
	})

	it("takes a number next to the unit's own name, and a Vakttelefon", () => {
		expect(phones(block("Eksempel helsestasjon 62 00 00 00"))).toMatchObject([{ rank: 1 }])
		expect(phones(block("Vakttelefon 62 00 00 09"))).toMatchObject([{ rank: 1 }])
	})

	it("never takes a fax number, on its own line, beside the phone, or with the word after it", () => {
		expect(phones(block("Telefon 62 00 00 00, 62 00 00 01 faks")).map((c) => c.value)).toEqual([
			"62 00 00 00",
		])
		expect(phones(block("Telefon: 62 00 00 00", "Faks: 62 00 00 01")).map((c) => c.value)).toEqual([
			"62 00 00 00",
		])
		expect(phones(block("Telefon 62 00 00 00, faks 62 00 00 01")).map((c) => c.value)).toEqual([
			"62 00 00 00",
		])
		expect(phones(block("Telefaks:", "62 00 00 01"))).toEqual([])
		expect(phones(block("Telefon 62 00 00 00 / 62 00 00 01 (faks)")).map((c) => c.value)).toEqual([
			"62 00 00 00",
		])
	})

	it("gives one candidate for the same number written twice", () => {
		expect(phones(block("Telefon: 62 00 00 00", "Tlf. 62000000"))).toHaveLength(1)
	})

	it("gives both of two different labelled numbers, so the agreement gate sends them to review", () => {
		expect(
			phones(block("Telefon: 62 00 00 00", "Telefon: 62 00 00 02")).map((c) => c.rank)
		).toEqual([1, 1])
	})

	it("takes no unlabelled landline", () => {
		expect(phones(block("62 00 00 00"))).toEqual([])
	})

	it('takes a short number only beside a phone label, and with only "ring" beside it, for review', () => {
		expect(phones(block("Storgata 110, 2317 Hamar"))).toEqual([])
		expect(phones(block("Vakttelefon 116 117"))).toMatchObject([{ value: "116 117", rank: 1 }])
		expect(phones(block("Vakttelefon 116 117"))[0]?.review).toBeUndefined()
		expect(phones(block("Ring 113 ved fare"))).toMatchObject([
			{ value: "113", rank: 1, review: 'a short number with only "ring" beside it' },
		])
	})
})

describe("phone rule: rank 2 and person names", () => {
	it("keeps a role mobile as two quotes, the role word and the number, whatever the name", () => {
		for (const line of [
			"Avdelingsleder Kari Nordmann 900 00 000",
			"Avdelingsleder Kari Anne Nordmann, mobil 900 00 000",
			"Anne-Marie Nordmann (avdelingsleder): 900 00 000",
			"Avdelingsleder Kari: 900 00 000",
		]) {
			const found = phones(block(line))
			expect(found).toHaveLength(1)
			expect(found[0]).toMatchObject({ rank: 2, role: "Avdelingsleder", value: "900 00 000" })
			expect(found[0]?.evidence).toEqual({
				kind: "quote",
				quotes: [line.match(/avdelingsleder/i)?.[0], "900 00 000"],
			})
			expect(JSON.stringify(found)).not.toMatch(/Kari|Anne|Nordmann/)
		}
	})

	it("reads the role word on the line above", () => {
		expect(phones(block("Virksomhetsleder", "900 00 000"))).toMatchObject([
			{ rank: 2, role: "Virksomhetsleder" },
		])
		expect(phones(block("Avdelingsleder Kari Nordmann", "Mobil: 900 00 000"))).toMatchObject([
			{ rank: 2, role: "Avdelingsleder" },
		])
	})

	it("reads a role word only beside its own number, or on a line above that holds no number", () => {
		expect(shape(block("Telefon 62 00 00 00 / avdelingsleder 900 00 000"))).toEqual([
			["62 00 00 00", 1, undefined],
			["900 00 000", 2, "Avdelingsleder"],
		])
		expect(shape(block("Avdelingsleder Kari Nordmann 900 00 000", "Telefon: 62 00 00 00"))).toEqual(
			[
				["900 00 000", 2, "Avdelingsleder"],
				["62 00 00 00", 1, undefined],
			]
		)
	})

	it("never makes a landline next to a person name rank 1: no role word sends it to review, number only", () => {
		const found = phones(block("Kari Nordmann, telefon 62 00 00 00"))
		expect(found).toEqual([
			{
				field: "phone",
				value: "62 00 00 00",
				evidence: { kind: "quote", quotes: ["62 00 00 00"] },
				origin: "unitContact",
				rank: 2,
				block: 0,
				review: "a number next to a possible name, with no role word",
			},
		])
	})

	it("never makes a number rank 1 when its label line above holds a possible name", () => {
		const found = phones(block("Kontakt: Kari Nordmann, telefon", "62 00 00 00"))
		expect(found).toMatchObject([
			{
				value: "62 00 00 00",
				rank: 2,
				review: "a number next to a possible name, with no role word",
			},
		])
		expect(found[0]?.evidence).toEqual({ kind: "quote", quotes: ["62 00 00 00"] })
		expect(JSON.stringify(found)).not.toMatch(/Kari|Nordmann/)
	})

	it("takes a mobile with no role word as rank 2 with no role, quoting the number only", () => {
		expect(phones(block("Telefon 900 00 000"))).toEqual([
			{
				field: "phone",
				value: "900 00 000",
				evidence: { kind: "quote", quotes: ["900 00 000"] },
				origin: "unitContact",
				rank: 2,
				block: 0,
			},
		])
	})
})

describe("phone rule: rank 3, the switchboard", () => {
	it("labels a Sentralbord or Servicetorg number on the kommune's own site", () => {
		expect(phones(block("Sentralbord: 62 00 00 00"))).toMatchObject([
			{ rank: 3, role: "Sentralbord" },
		])
		expect(phones(block("Servicetorget 62 00 00 00"))).toMatchObject([
			{ rank: 3, role: "Sentralbord" },
		])
	})

	it("ignores a switchboard number anywhere else", () => {
		expect(
			phoneCandidates(block("Sentralbord: 62 00 00 00"), { ...ctx, onKommuneSite: false })
		).toEqual([])
	})
})

describe("phone rule: phoneHours and alwaysOpen", () => {
	const of = (field: string, blocks: ContactBlock[]) =>
		phoneCandidates(blocks, ctx).filter((c) => c.field === field)

	it("formats a time range on the number's line or a Telefontid line after it", () => {
		expect(of("phoneHours", block("Telefon: 62 00 00 00 (hverdager 08.00-15.30)"))).toMatchObject([
			{
				value: `hverdager kl. 08:00${D}15:30`,
				evidence: { quotes: ["Telefon: 62 00 00 00 (hverdager 08.00-15.30)"] },
			},
		])
		expect(of("phoneHours", block("Telefon: 62 00 00 00", "Telefontid 09.00-14.00"))).toMatchObject(
			[{ value: `Telefontid kl. 09:00${D}14:00`, evidence: { quotes: ["Telefontid 09.00-14.00"] } }]
		)
	})

	it("reads the line after as phoneHours only when it says Telefontid: other times are opening hours", () => {
		expect(
			of("phoneHours", block("Telefon: 62 00 00 00", "Åpent mandag til fredag 08.00-15.30"))
		).toEqual([])
	})

	it("sends a time it cannot read to review, as the page wrote it", () => {
		expect(of("phoneHours", block("Telefon: 62 00 00 00 (08.00-25.00)"))).toMatchObject([
			{ value: "08.00-25.00", review: "a time the formatter cannot read" },
		])
	})

	it("sets alwaysOpen only when the phrase stands alone on its line", () => {
		expect(of("alwaysOpen", block("Telefon: 62 00 00 00", "Døgnåpent"))).toEqual([
			{
				field: "alwaysOpen",
				value: true,
				evidence: { kind: "quote", quotes: ["Døgnåpent"] },
				origin: "unitContact",
				block: 0,
			},
		])
	})

	it("sends a claim beside a number to review, as the grounding gate would (ruling 35)", () => {
		expect(of("alwaysOpen", block("Telefon 62 00 00 00, døgnåpen"))).toMatchObject([
			{ value: true, review: "the always-open claim shares a line with a number" },
		])
	})

	it("sends any other word on that line to review, never a plain alwaysOpen", () => {
		for (const line of ["Ikke døgnåpen", "Døgnåpen i helgene", "Døgnåpent unntatt mandag"]) {
			const found = of("alwaysOpen", block("Telefon: 62 00 00 00", line))
			expect(found).toHaveLength(1)
			expect(found[0]?.review).toBe("the always-open line holds other words")
		}
	})

	it("sends a closure elsewhere in the block to review, with that line among the quotes", () => {
		expect(
			of("alwaysOpen", block("Telefon: 62 00 00 00", "Døgnåpent", "Stengt 24. desember"))
		).toMatchObject([
			{
				evidence: { quotes: ["Døgnåpent", "Stengt 24. desember"] },
				review: "the block limits the always-open claim",
			},
		])
	})

	it("reads a closure on a line that also holds a number, with the numbers taken out first", () => {
		expect(
			of(
				"alwaysOpen",
				block("Telefon 61 00 00 00", "Døgnåpent", "Stengt i helgene, ring 62 00 00 01")
			)
		).toMatchObject([
			{
				evidence: { quotes: ["Døgnåpent", "Stengt i helgene, ring 62 00 00 01"] },
				review: "the block limits the always-open claim",
			},
		])
	})

	it("never reads a plain Telefon line as a limit", () => {
		expect(of("alwaysOpen", block("Telefon 62 00 00 00", "Døgnåpent"))).toEqual([
			{
				field: "alwaysOpen",
				value: true,
				evidence: { kind: "quote", quotes: ["Døgnåpent"] },
				origin: "unitContact",
				block: 0,
			},
		])
	})

	it("keeps a review over a clean duplicate from another block", () => {
		const two: ContactBlock[] = [
			{ source: "cms", lines: ["Telefon: 62 00 00 00", "Døgnåpent"] },
			{ source: "heading", lines: ["Telefon: 62 00 00 00", "Ikke døgnåpen"] },
		]
		expect(of("alwaysOpen", two)).toMatchObject([
			{ review: "the always-open line holds other words" },
		])
	})

	it("reads no alwaysOpen in a block without a service phone", () => {
		expect(of("alwaysOpen", block("Døgnåpent"))).toEqual([])
	})
})

describe("phone rule: a short group beside a time or date is no phone", () => {
	it("takes no short number from a house number beside a time, or a date beside a number", () => {
		expect(phones(block("Storgata 110 08.00"))).toEqual([])
		expect(phones(block("27.10.2026 123"))).toEqual([])
	})
})
