import { useEffect, useState } from "react"
import type { Lang } from "../i18n/LanguageProvider.tsx"
import {
	type Catalog,
	catalogOf,
	clearIndexCache,
	type Index,
	loadIndex,
	peekIndex,
} from "../services/data.ts"

export type { Catalog }

export type CatalogState =
	| { kind: "loading" }
	| { kind: "error" }
	| { kind: "ready"; catalog: Catalog }

function toReady(index: Index): CatalogState {
	return { kind: "ready", catalog: catalogOf(index) }
}

// Ready from the first render when the index has already settled, as useResources is. Back to
// /sok mounts the list page again and restores the scroll in that first commit; a catalog that
// started at "loading" grew the filter column above the results a moment later, so the restored
// spot slid (34 px at 375 px wide once the chips outgrew the column's min-height).
function readyFromCache(lang: Lang): CatalogState | null {
	const index = peekIndex(lang)
	return index ? toReady(index) : null
}

export function useCatalog(lang: Lang) {
	const [state, setState] = useState<CatalogState>(
		() => readyFromCache(lang) ?? { kind: "loading" }
	)
	const [attempt, setAttempt] = useState(0)

	// biome-ignore lint/correctness/useExhaustiveDependencies: attempt only forces a re-fetch
	useEffect(() => {
		let cancelled = false
		const ready = readyFromCache(lang)
		if (ready) {
			setState(ready)
			return
		}
		setState({ kind: "loading" })
		loadIndex(lang)
			.then((index) => {
				if (!cancelled) setState(toReady(index))
			})
			.catch(() => {
				if (!cancelled) setState({ kind: "error" })
			})
		return () => {
			cancelled = true
		}
	}, [lang, attempt])

	return {
		state,
		retry: () => {
			clearIndexCache()
			setAttempt((n) => n + 1)
		},
	}
}
