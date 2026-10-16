import { expect, test } from "vitest"
import { childrenOf, familyOf, NO_FAMILY } from "../src/services/family.ts"
import type { ResourceDto } from "../src/types/api.ts"
import { makeResource } from "./stubData.ts"

const parent = makeResource({ id: 1, name: "Hjelpetelefonen (Mental Helse)" })
const chat = makeResource({ id: 122, name: "Sidetmedord (Mental Helse)", parentId: 1 })
const work = makeResource({ id: 9, name: "Arbeidslivstelefonen (Mental Helse)", parentId: 1 })
const other = makeResource({ id: 2, name: "Kirkens SOS" })
const rows = [chat, other, parent, work]

test("children come back in id order, whatever the data order, and only the direct ones", () => {
	expect(childrenOf(1, rows).map((r) => r.id)).toEqual([9, 122])
	expect(childrenOf(2, rows)).toEqual([])
})

test("a child knows its parent by id and data name", () => {
	expect(familyOf(work, rows)).toEqual({
		parent: { id: 1, name: "Hjelpetelefonen (Mental Helse)" },
		children: [],
	})
	expect(familyOf(parent, rows).parent).toBeNull()
	expect(familyOf(parent, rows).children.map((r) => r.id)).toEqual([9, 122])
})

test("a parent missing from the data gives no parent, never a link to a 404", () => {
	expect(familyOf(work, [work, chat]).parent).toBeNull()
})

test("rows cached before parentId existed have no family at all", () => {
	const stale = rows.map(({ parentId: _parentId, ...rest }) => rest) as unknown as ResourceDto[]
	expect(familyOf(stale[2] as ResourceDto, stale)).toEqual(NO_FAMILY)
	expect(familyOf(stale[3] as ResourceDto, stale)).toEqual(NO_FAMILY)
})
