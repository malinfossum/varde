import { z } from "zod"

// One unit, one id. Brreg org number first; without one, the Kartverket address id plus a
// name slug, so two services at one address stay apart. The address id is opaque here;
// PR 2 decides which Kartverket fields build it, as long as it has no colon or space.
export const UnitId = z.string().regex(/^(?:org:\d{9}|adr:[^:\s]+:[a-z0-9-]+)$/)

export function slugify(name: string): string {
	return name
		.toLowerCase()
		.replace(/æ/g, "ae")
		.replace(/ø/g, "o")
		.replace(/å/g, "a")
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
}

export function unitId(input: { orgNumber?: string; addressId?: string; name: string }): string {
	if (input.orgNumber !== undefined) {
		if (!/^\d{9}$/.test(input.orgNumber)) throw new Error("an org number has nine digits")
		return `org:${input.orgNumber}`
	}
	if (input.addressId !== undefined) return `adr:${input.addressId}:${slugify(input.name)}`
	throw new Error("a unit needs an org number or a Kartverket address id")
}
