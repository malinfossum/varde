import { useEffect, useState } from "react"
import type { Lang } from "../i18n/LanguageProvider.tsx"
import { clearIndexCache, type Index, loadIndex, peekIndex } from "../services/data.ts"
import { type FacetCounts, facetCounts } from "../services/facets.ts"
import { type Filters, resolveFilters } from "../services/filters.ts"
import { kommunerWithRows } from "../services/placeOptions.ts"
import { applyFilters } from "../services/query.ts"
import { loadRows } from "../services/rows.ts"
import type { PagedResult, ResourceDto } from "../types/api.ts"

// One filter state's answer: the page of results, the facet counts and the kommuner that have
// rows (the Sted list offers only those). Counts exist only here, so while rows load there are
// none to render (filter spec, Loading and failure).
export type FilterResult = {
	data: PagedResult<ResourceDto>
	counts: FacetCounts
	withRows: ReadonlySet<number>
}

export type ResourcesState =
	| { kind: "loading" }
	| { kind: "error" }
	| ({ kind: "ready" } & FilterResult)

// The kommuner with rows depend on the index alone, so I work them out once per index and not
// on every keystroke. They read every row, not loadRows: once spec B loads only the picked
// places' rows, the Sted list must still offer the others, and spec B then owns this list.
const withRowsByIndex = new WeakMap<Index, ReadonlySet<number>>()
function withRowsOf(index: Index): ReadonlySet<number> {
	let ids = withRowsByIndex.get(index)
	if (!ids) {
		ids = kommunerWithRows(index.resources)
		withRowsByIndex.set(index, ids)
	}
	return ids
}

// An old link's places resolve against the index before matching, so ?municipality=1 still
// finds Hamar on the very first render. Filtering and counting read the same rows.
function compute(index: Index, filters: Filters): FilterResult {
	const resolved = resolveFilters(filters, index.municipalities, index.counties)
	const rows = loadRows(index, resolved)
	return {
		data: applyFilters(rows, resolved, index.municipalities),
		counts: facetCounts(rows, resolved, index.municipalities),
		withRows: withRowsOf(index),
	}
}

// When the index is already settled, filtering is pure computation over data already in
// memory. That is what lets a filter change (every keystroke in the search box, say) apply
// synchronously below, instead of round-tripping through a "loading" state for a fetch that
// never happens.
function readyFromCache(lang: Lang, filters: Filters): ResourcesState | null {
	const index = peekIndex(lang)
	return index ? { kind: "ready", ...compute(index, filters) } : null
}

export function useResources(filters: Filters, lang: Lang) {
	const [state, setState] = useState<ResourcesState>(
		() => readyFromCache(lang, filters) ?? { kind: "loading" }
	)
	const [attempt, setAttempt] = useState(0)

	// biome-ignore lint/correctness/useExhaustiveDependencies: attempt only forces a re-fetch
	useEffect(() => {
		let cancelled = false
		const ready = readyFromCache(lang, filters)
		if (ready) {
			setState(ready)
			return
		}
		setState({ kind: "loading" })
		loadIndex(lang).then(
			(index) => {
				if (!cancelled) setState({ kind: "ready", ...compute(index, filters) })
			},
			() => {
				if (!cancelled) setState({ kind: "error" })
			}
		)
		return () => {
			cancelled = true
		}
	}, [filters, lang, attempt])

	return {
		state,
		retry: () => {
			clearIndexCache()
			setAttempt((n) => n + 1)
		},
	}
}
