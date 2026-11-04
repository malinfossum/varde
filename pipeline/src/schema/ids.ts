import { z } from "zod"
import { foldNorwegian } from "../text/normalise.ts"

// One unit, one id. Brreg org number first; without one, the Kartverket adresseid plus a
// name slug, so two services at one address stay apart.
export const UnitId = z.string().regex(/^(?:org:\d{9}|adr:[^:\s]+:[a-z0-9-]+)$/)

export function slugify(name: string): string {
	return foldNorwegian(name)
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
}

export function unitId(input: { orgNumber?: string; addressId?: string; name: string }): string {
	let id: string
	if (input.orgNumber !== undefined) {
		if (!/^\d{9}$/.test(input.orgNumber)) throw new Error("an org number has nine digits")
		id = `org:${input.orgNumber}`
	} else if (input.addressId !== undefined) {
		id = `adr:${input.addressId}:${slugify(input.name)}`
	} else {
		throw new Error("a unit needs an org number or a Kartverket address id")
	}
	// An empty address id, one with a space or a colon, or a name with no letter or digit
	// would build an id the schema refuses. Errors never quote the input: logs are public.
	if (!UnitId.safeParse(id).success)
		throw new Error("the address id or name cannot build a unit id")
	return id
}
