import { expect, test } from "vitest"
import { chatFor, pickHelplines, safeChatUrl } from "../src/services/helplines.ts"
import type { ResourceDto } from "../src/types/api.ts"
import { helplineRows, makeResource } from "./stubData.ts"

test("two groups of two, in the curated order, whatever the data order", () => {
	const groups = pickHelplines([...helplineRows].reverse())
	expect(groups.map((g) => g.key)).toEqual(["adults", "young"])
	expect(groups.map((g) => g.rows.map((r) => r.id))).toEqual([
		[1, 2],
		[4, 121],
	])
	expect(groups[1]?.rows[1]).toEqual({
		id: 121,
		name: "Kors på halsen",
		phone: "800 33 321",
		chatUrl: "https://www.korspahalsen.no",
	})
})

test("Mental Helse's chat comes from Sidetmedord, its child (row 122)", () => {
	expect(pickHelplines(helplineRows)[0]?.rows[0]).toEqual({
		id: 1,
		name: "Mental Helse",
		phone: "116 123",
		chatUrl: "https://mentalhelse.no/hjelpechat/",
	})
})

test("a service's own safe chat wins over its children's", () => {
	const own = makeResource({ id: 1, name: "P", chatUrl: "https://own.test/" })
	const rows = [
		own,
		makeResource({ id: 5, name: "C", parentId: 1, chatUrl: "https://child.test/" }),
	]
	expect(chatFor(own, rows)).toBe("https://own.test/")
})

test("an unsafe chat is skipped, on the service and on a child, for the next safe one", () => {
	const own = makeResource({ id: 1, name: "P", chatUrl: "javascript:alert(1)" })
	const rows = [
		own,
		makeResource({ id: 9, name: "C9", parentId: 1, chatUrl: "https://safe.test/" }),
		makeResource({ id: 7, name: "C7", parentId: 1, chatUrl: "http://plain.test/" }),
	]
	expect(chatFor(own, rows)).toBe("https://safe.test/")
	expect(chatFor(own, [own])).toBeNull()
})

test("data cached before parentId existed gives Mental Helse no chat, and no crash", () => {
	const stale = helplineRows.map(
		({ parentId: _parentId, phoneMenuOption: _menu, ...rest }) => rest
	) as unknown as ResourceDto[]
	expect(pickHelplines(stale)[0]?.rows[0]?.chatUrl).toBeNull()
})

test("a helpline id missing from the data throws, so the build fails", () => {
	const without121 = helplineRows.filter((r) => r.id !== 121)
	expect(() => pickHelplines(without121)).toThrow("helpline id 121 is missing from the data")
})

test("a renamed row that no longer contains its landing label throws, so the build fails", () => {
	const renamed = helplineRows.map((r) => (r.id === 2 ? { ...r, name: "SOS-linjen" } : r))
	expect(() => pickHelplines(renamed)).toThrow(
		'helpline label "Kirkens SOS" is not part of "SOS-linjen" (id 2)'
	)
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
