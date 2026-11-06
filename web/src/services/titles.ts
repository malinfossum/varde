// The page title of a service (spec 2026-11-06, decision 4). The place is added only when the
// name lacks it, and " – Varde" goes when the title would pass 60 characters. A name is never
// cut: the title is also what a screen reader and a browser tab show.
const SUFFIX = " – Varde"
const MAX = 60

function escapeRegExp(text: string): string {
	return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// The place counts as present when it starts a word: "Stangehjelpa" has Stange, but Hol is not
// found inside "Alkoholvern".
function hasPlace(name: string, place: string): boolean {
	return new RegExp(`(?<!\\p{L})${escapeRegExp(place)}`, "iu").test(name)
}

export function serviceTitle(resource: { name: string; municipalityName: string | null }): string {
	const { name, municipalityName: place } = resource
	const base = place && !hasPlace(name, place) ? `${name}, ${place}` : name
	const full = `${base}${SUFFIX}`
	return full.length <= MAX ? full : base
}
