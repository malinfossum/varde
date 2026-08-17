import { useEffect, useState } from "react"
import type { Lang } from "../i18n/LanguageProvider.tsx"
import { fetchResources } from "../services/api.ts"
import type { Filters } from "../services/urlState.ts"
import type { PagedResult, ResourceDto } from "../types/api.ts"
import { useDebounced } from "./useDebounced.ts"

export type ResourcesState =
	| { kind: "loading" }
	| { kind: "error" }
	| { kind: "ready"; data: PagedResult<ResourceDto> }

export function useResources(filters: Filters, lang: Lang, debounceMs = 300) {
	const [state, setState] = useState<ResourcesState>({ kind: "loading" })
	const [attempt, setAttempt] = useState(0)
	const search = useDebounced(filters.search, debounceMs)

	// One string key so the effect has a single, comparable dependency.
	const key = JSON.stringify({ ...filters, search, lang, attempt })

	// biome-ignore lint/correctness/useExhaustiveDependencies: key encodes every input
	useEffect(() => {
		const controller = new AbortController()
		setState({ kind: "loading" })
		fetchResources(
			{
				search: search || undefined,
				categories: filters.categories,
				municipality: filters.municipality ?? undefined,
				national: filters.national || undefined,
				lang,
				page: filters.page,
			},
			controller.signal
		)
			.then((data) => setState({ kind: "ready", data }))
			.catch((error: unknown) => {
				// Cleanup aborted us — a newer request owns the state now.
				if (error instanceof DOMException && error.name === "AbortError") return
				setState({ kind: "error" })
			})
		return () => controller.abort()
	}, [key])

	return { state, retry: () => setAttempt((n) => n + 1) }
}
