import { expect, test } from "vitest"
import { contactTiles, safeEmail } from "../src/services/contactTiles.ts"
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
	expect(
		contactTiles(row(2), []).map((t) => [t.kind, t.kind === "email" ? null : t.name, t.href])
	).toEqual([
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

test("the service's own email is the last tile", () => {
	const parent = makeResource({
		id: 102,
		name: "Ringsaker",
		phone: "62 33 52 20",
		email: "postmottak.psykisk.helse@ringsaker.kommune.no",
	})
	const tiles = contactTiles(parent, [])
	expect(tiles.map((t) => t.kind)).toEqual(["phone", "email"])
	expect(tiles.at(-1)).toEqual({
		kind: "email",
		key: "email-102",
		address: "postmottak.psykisk.helse@ringsaker.kommune.no",
		href: "mailto:postmottak.psykisk.helse@ringsaker.kommune.no",
	})
})

test("the email tile comes after every child tile, and a child's email never becomes one", () => {
	const parent = makeResource({ id: 1, name: "P", phone: "116 123", email: "post@p.no" })
	const children = [
		makeResource({ id: 5, name: "Chat child", parentId: 1, chatUrl: "https://c.test/" }),
		makeResource({ id: 6, name: "Phone child", parentId: 1, phone: "800 00 000", email: "c@c.no" }),
	]
	expect(contactTiles(parent, children).map((t) => t.key)).toEqual([
		"phone-1",
		"chat-5",
		"phone-6",
		"email-1",
	])
})

test("no email means no email tile", () => {
	expect(
		contactTiles(makeResource({ id: 3, name: "X", phone: "1" }), []).map((t) => t.kind)
	).toEqual(["phone"])
})

test.each([
	"a@b.no?bcc=x@y.no",
	"a@b.no,c@d.no",
	"javascript:x@y.no",
	"a b@c.no",
	"a@b.no;c@d.no",
	"a@b.no%3Fbcc=x@y.no",
	"a@b@c.no",
	"@b.no",
	"a@b",
	"a@.no",
	"a@b.no.",
	"a\\b@c.no",
	"a#b@c.no",
	"<a@b.no>",
	'"a"@b.no',
	"",
])("safeEmail refuses %j", (value) => {
	expect(safeEmail(value)).toBeNull()
})

test.each([
	"postmottak.psykisk.helse@ringsaker.kommune.no",
	"Ola+Varde@Post.Example-Kommune.no",
	"post@nav.no",
])("safeEmail accepts %j unchanged", (value) => {
	expect(safeEmail(value)).toBe(value)
})

test("safeEmail of null is null, and an unsafe address gets no tile", () => {
	expect(safeEmail(null)).toBeNull()
	const row = makeResource({ id: 4, name: "Y", email: "a@b.no?bcc=x@y.no" })
	expect(contactTiles(row, [])).toEqual([])
})
