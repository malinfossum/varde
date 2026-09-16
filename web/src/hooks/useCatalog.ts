import { useEffect, useState } from "react"
import type { Lang } from "../i18n/LanguageProvider.tsx"
import { type Catalog, clearIndexCache, loadIndex } from "../services/data.ts"

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
		loadIndex(lang)
			.then((index) => {
				if (!cancelled)
					setState({
						kind: "ready",
						catalog: {
							municipalities: index.municipalities,
							categories: index.categories,
							kommuner: index.kommuner,
						},
					})
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
