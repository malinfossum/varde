import type { ResourceDto } from "../types/api.ts"

// Mental Helse's sub-services hang off it through parentId, one level deep. Children are never
// exported as a list: every page already holds the whole index, so they are found here by id.
export type Family = { parent: { id: number; name: string } | null; children: ResourceDto[] }

export const NO_FAMILY: Family = { parent: null, children: [] }

export function childrenOf(id: number, resources: readonly ResourceDto[]): ResourceDto[] {
	return resources.filter((r) => r.parentId === id).sort((a, b) => a.id - b.id)
}

// Data cached from before parentId existed has no such key at all, so `?? null` reads a missing
// key as "no parent". A parent missing from the data also gives null, so the page never links
// to a 404.
export function familyOf(resource: ResourceDto, resources: readonly ResourceDto[]): Family {
	const parentId = resource.parentId ?? null
	const parent = parentId === null ? undefined : resources.find((r) => r.id === parentId)
	return {
		parent: parent ? { id: parent.id, name: parent.name } : null,
		children: childrenOf(resource.id, resources),
	}
}
