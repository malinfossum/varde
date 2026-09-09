import { useEffect, useState } from "react"
import type { Lang } from "../i18n/LanguageProvider.tsx"
import { type Catalog, clearCatalogCache, loadCatalog } from "../services/catalogCache.ts"

export type { Catalog }

export type CatalogState =
	| { kind: "loading" }
	| { kind: "error" }
	| { kind: "ready"; catalog: Catalog }

export function useCatalog(lang: Lang) {
	const [state, setState] = useState<CatalogState>({ kind: "loading" })
	const [attempt, setAttempt] = useState(0)

	// biome-ignore lint/correctness/useExhaustiveDependencies: attempt only forces a re-fetch
	useEffect(() => {
		let cancelled = false
		setState({ kind: "loading" })
		loadCatalog(lang)
			.then((catalog) => {
				if (!cancelled) setState({ kind: "ready", catalog })
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
			clearCatalogCache()
			setAttempt((n) => n + 1)
		},
	}
}
