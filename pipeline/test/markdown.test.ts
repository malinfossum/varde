import { describe, expect, it } from "vitest"
import { cellText, codeBlock, codeSpan } from "../src/score/markdown.ts"

const ticks = (n: number) => "`".repeat(n)

describe("codeSpan", () => {
	it("fences text with one backtick more than its longest run", () => {
		expect(codeSpan("62 00 00 00")).toBe("`62 00 00 00`")
		expect(codeSpan("a `b` c")).toBe("``a `b` c``")
		expect(codeSpan(`end${ticks(2)}`)).toBe(`${ticks(3)} end${ticks(2)} ${ticks(3)}`)
	})

	it("pads text that starts or ends with a backtick", () => {
		expect(codeSpan("`start")).toBe("`` `start ``")
	})

	it("sanitises first, and writes blank text as plain words", () => {
		expect(codeSpan("Ring\u001b[31m @someone")).toBe("`Ring @someone`")
		expect(codeSpan("\u0007")).toBe("(blank)")
	})
})

describe("codeBlock", () => {
	it("uses three backticks, or one more than the longest run inside", () => {
		expect(codeBlock("plain")).toBe(`${ticks(3)}text\nplain\n${ticks(3)}`)
		expect(codeBlock(`one\n${ticks(3)} two\nthree${ticks(4)}`)).toBe(
			`${ticks(5)}text\none\n${ticks(3)} two\nthree${ticks(4)}\n${ticks(5)}`
		)
	})

	it("sanitises each line", () => {
		expect(codeBlock("a\tb\r\nc\u001b[2J")).toBe(`${ticks(3)}text\na b\nc\n${ticks(3)}`)
	})
})

describe("cellText", () => {
	it("sanitises and escapes, the pipe included, so the text stays in its cell", () => {
		expect(cellText("Kafé | @varde <img> `x`\nny linje")).toBe(
			"Kafé \\| @<!-- -->varde \\<img\\> \\`x\\` ny linje"
		)
	})

	it("breaks a bare web address, so GitHub cannot make it a link", () => {
		expect(cellText("Se www.eksempel.kommune.no eller https://eksempel.kommune.no/side")).toBe(
			"Se www&#46;eksempel.kommune.no eller https&#58;//eksempel.kommune.no/side"
		)
	})
})
