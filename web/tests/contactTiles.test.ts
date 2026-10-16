import { expect, test } from "vitest"
import { contactTiles } from "../src/services/contactTiles.ts"
import { childrenOf } from "../src/services/family.ts"
import type { ResourceDto } from "../src/types/api.ts"
import { helplineRows, makeResource } from "./stubData.ts"

const row = (id: number) => helplineRows.find((r) => r.id === id) as ResourceDto

test("Mental Helse: its own phone, then the child chat, then the child phone", () => {
	expect(contactTiles(row(1), childrenOf(1, helplineRows))).toEqual([
		{
			kind: "phone",
			key: "phone-1",
			name: null,
			phone: "116 123",
			menuOption: null,
			alwaysOpen: true,
			href: "tel:116123",
		},
		{
			kind: "chat",
			key: "chat-122",
			name: "Sidetmedord (Mental Helse)",
			href: "https://mentalhelse.no/hjelpechat/",
		},
		{
			kind: "phone",
			key: "phone-9",
			name: "Arbeidslivstelefonen (Mental Helse)",
			phone: "116 123",
			menuOption: 3,
			alwaysOpen: false,
			href: "tel:116123",
		},
	])
})

test("Kirkens SOS: phone then its own chat", () => {
	expect(contactTiles(row(2), []).map((t) => [t.kind, t.name, t.href])).toEqual([
		["phone", null, "tel:22400040"],
		["chat", null, "https://www.soschat.no"],
	])
})

test("a child with neither phone nor safe chat gets no tile, and an unsafe chat never becomes one", () => {
	const parent = makeResource({ id: 1, name: "P", chatUrl: "javascript:alert(1)" })
	const children = [
		makeResource({ id: 5, name: "Nothing", parentId: 1, website: "https://x.test/" }),
		makeResource({ id: 6, name: "Plain", parentId: 1, chatUrl: "http://plain.test/" }),
	]
	expect(contactTiles(parent, children)).toEqual([])
})

test("rows cached before the new fields existed give a plain number, never 'undefined'", () => {
	const { phoneMenuOption: _menu, parentId: _parent, ...stale } = row(9)
	expect(contactTiles(stale as unknown as ResourceDto, [])).toEqual([
		{
			kind: "phone",
			key: "phone-9",
			name: null,
			phone: "116 123",
			menuOption: null,
			alwaysOpen: false,
			href: "tel:116123",
		},
	])
})
