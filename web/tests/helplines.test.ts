import { expect, test } from "vitest"
import { HELPLINE_IDS, pickHelplines, safeChatUrl } from "../src/services/helplines.ts"
import { helplineRows } from "./stubData.ts"

test("the five helplines come back in the curated order, whatever the data order", () => {
	expect(HELPLINE_IDS).toEqual([1, 2, 121, 9, 122])
	const picked = pickHelplines([...helplineRows].reverse())
	expect(picked.map((h) => h.id)).toEqual([1, 2, 121, 9, 122])
	expect(picked[0]).toEqual({
		id: 1,
		name: "Hjelpetelefonen (Mental Helse)",
		phone: "116 123",
		chatUrl: null,
	})
})

test("a helpline id missing from the data throws, so the build fails", () => {
	const without121 = helplineRows.filter((r) => r.id !== 121)
	expect(() => pickHelplines(without121)).toThrow("helpline id 121 is missing from the data")
})

test("only an https:// chat URL survives", () => {
	expect(safeChatUrl("https://sidetmedord.mentalhelse.no/")).toBe(
		"https://sidetmedord.mentalhelse.no/"
	)
	expect(safeChatUrl("http://example.test")).toBeNull()
	expect(safeChatUrl("javascript:alert(1)")).toBeNull()
	expect(safeChatUrl(" https://example.test")).toBeNull()
	expect(safeChatUrl("")).toBeNull()
	expect(safeChatUrl(null)).toBeNull()
})
