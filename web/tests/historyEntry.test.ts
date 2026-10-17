import { expect, test } from "vitest"
import { mergeEntry, readEntry } from "../src/services/historyEntry.ts"

test("an empty or foreign state reads as an empty entry", () => {
	for (const state of [null, undefined, "x", 3, []]) expect(readEntry(state)).toEqual({})
})

test("only the router's fields, with the right types, are read", () => {
	expect(
		readEntry({ from: "sok", idx: 2, scrollY: 480.5, href: "/resources/12", other: true })
	).toEqual({ from: "sok", idx: 2, scrollY: 480.5, href: "/resources/12" })
	expect(readEntry({ from: "list", idx: -1, scrollY: Number.NaN, href: 12 })).toEqual({})
	expect(readEntry({ idx: 1.5 })).toEqual({})
})

test("saving the focus values keeps from and idx", () => {
	expect(mergeEntry({ from: "sok", idx: 3 }, { scrollY: 640, href: "/resources/9" })).toEqual({
		from: "sok",
		idx: 3,
		scrollY: 640,
		href: "/resources/9",
	})
})

test("an entry from the Varde deployed before this one keeps from when it gains idx", () => {
	expect(mergeEntry({ from: "sok" }, { idx: 0 })).toEqual({ from: "sok", idx: 0 })
})

test("a field patched to undefined is removed", () => {
	expect(mergeEntry({ idx: 1, href: "/old" }, { scrollY: 0, href: undefined })).toEqual({
		idx: 1,
		scrollY: 0,
	})
})

test("a saved href keeps quotes and brackets exactly", () => {
	const href = '/sok?search=a"b]c'
	expect(readEntry(mergeEntry(null, { href })).href).toBe(href)
})
