// What the router keeps on each history entry (spec: Behaviour). `from` marks an entry left from
// /sok (the detail page's "Tilbake til resultater" reads it), `idx` counts entries for browsers
// without the Navigation API, and `scrollY` and `href` record where you were and which link you
// followed when you left the entry with a push.
export type EntryState = { from?: "sok"; idx?: number; scrollY?: number; href?: string }

export type EntryPatch = { [K in keyof EntryState]?: EntryState[K] | undefined }

// history.state can hold anything: an older Varde wrote { from: "sok" } alone, and a fragment
// link leaves null. Only fields of the right type are read; anything else is dropped.
export function readEntry(state: unknown): EntryState {
	if (typeof state !== "object" || state === null || Array.isArray(state)) return {}
	const fields = state as Record<string, unknown>
	const entry: EntryState = {}
	if (fields.from === "sok") entry.from = "sok"
	if (typeof fields.idx === "number" && Number.isInteger(fields.idx) && fields.idx >= 0) {
		entry.idx = fields.idx
	}
	if (typeof fields.scrollY === "number" && Number.isFinite(fields.scrollY)) {
		entry.scrollY = fields.scrollY
	}
	if (typeof fields.href === "string") entry.href = fields.href
	return entry
}

// Every replaceState the router makes keeps the fields already on the entry and changes only its
// own. A field patched to undefined is removed, so a navigation without a link clears an href
// saved by an earlier one.
export function mergeEntry(state: unknown, patch: EntryPatch): EntryState {
	const merged: EntryPatch = { ...readEntry(state), ...patch }
	for (const key of Object.keys(merged) as (keyof EntryState)[]) {
		if (merged[key] === undefined) delete merged[key]
	}
	return merged as EntryState
}
