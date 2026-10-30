import type { ResourceDto } from "../types/api.ts"
import type { Index } from "./data.ts"
import type { Filters } from "./filters.ts"

// The rows filtering and facet counts work on. Today every row lives in one file per language,
// so the picked places narrow nothing here yet. Spec B (storage) can make this load only the
// picked places' files without touching the filter code (filter spec, Data contract).
export function loadRows(
	index: Pick<Index, "resources">,
	_places: Pick<Filters, "counties" | "municipalities">
): ResourceDto[] {
	return index.resources
}
