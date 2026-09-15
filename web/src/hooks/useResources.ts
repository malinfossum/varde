import { useEffect, useState } from "react"
import type { Lang } from "../i18n/LanguageProvider.tsx"
import { clearIndexCache, loadIndex } from "../services/data.ts"
import { applyQuery } from "../services/query.ts"
import type { Filters } from "../services/urlState.ts"
import type { PagedResult, ResourceDto } from "../types/api.ts"

export type ResourcesState =
	| { kind: "loading" }
	| { kind: "error" }
	| { kind: "ready"; data: PagedResult<ResourceDto> }

export function useResources(filters: Filters, lang: Lang) {
	const [state, setState] = useState<ResourcesState>({ kind: "loading" })
	const [attempt, setAttempt] = useState(0)

	// biome-ignore lint/correctness/useExhaustiveDependencies: attempt only forces a re-fetch
	useEffect(() => {
		let cancelled = false
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
