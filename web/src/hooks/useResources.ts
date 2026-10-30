import { useEffect, useState } from "react"
import type { Lang } from "../i18n/LanguageProvider.tsx"
import { clearIndexCache, type Index, loadIndex, peekIndex } from "../services/data.ts"
import { type Filters, resolveFilters } from "../services/filters.ts"
import { applyFilters } from "../services/query.ts"
import { loadRows } from "../services/rows.ts"
import type { PagedResult, ResourceDto } from "../types/api.ts"

export type ResourcesState =
	| { kind: "loading" }
	| { kind: "error" }
	| { kind: "ready"; data: PagedResult<ResourceDto> }

// An old link's places resolve against the index before matching, so ?municipality=1 still
// finds Hamar on the very first render.
function compute(index: Index, filters: Filters): PagedResult<ResourceDto> {
	const resolved = resolveFilters(filters, index.municipalities, index.counties)
	return applyFilters(loadRows(index, resolved), resolved, index.municipalities)
}

// When the index is already settled, filtering is pure computation over data already in
// memory — this is what lets a filter change (e.g. every keystroke in the search box) apply
// synchronously below, instead of round-tripping through a "loading" state for a fetch that
// never actually happens.
function readyFromCache(lang: Lang, filters: Filters): ResourcesState | null {
	const index = peekIndex(lang)
	return index ? { kind: "ready", data: compute(index, filters) } : null
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
				if (!cancelled) setState({ kind: "ready", data: compute(index, filters) })
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
