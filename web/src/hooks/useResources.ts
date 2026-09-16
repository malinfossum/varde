import { useEffect, useState } from "react"
import type { Lang } from "../i18n/LanguageProvider.tsx"
import { clearIndexCache, loadIndex, peekIndex } from "../services/data.ts"
import { applyQuery } from "../services/query.ts"
import type { Filters } from "../services/urlState.ts"
import type { PagedResult, ResourceDto } from "../types/api.ts"

export type ResourcesState =
	| { kind: "loading" }
	| { kind: "error" }
	| { kind: "ready"; data: PagedResult<ResourceDto> }

// When the index is already settled, filtering is pure computation over data already in
// memory — this is what lets a filter change (e.g. every keystroke in the search box) apply
// synchronously below, instead of round-tripping through a "loading" state for a fetch that
// never actually happens.
function readyFromCache(lang: Lang, filters: Filters): ResourcesState | null {
	const index = peekIndex(lang)
	return index ? { kind: "ready", data: applyQuery(index.resources, filters) } : null
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
				if (!cancelled) setState({ kind: "ready", data: applyQuery(index.resources, filters) })
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
