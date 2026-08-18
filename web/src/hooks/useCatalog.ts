import { useEffect, useState } from "react"
import type { Lang } from "../i18n/LanguageProvider.tsx"
import { fetchCategories, fetchMunicipalities } from "../services/api.ts"
import type { CategoryDto, MunicipalityDto } from "../types/api.ts"

export type Catalog = { municipalities: MunicipalityDto[]; categories: CategoryDto[] }

export type CatalogState =
	| { kind: "loading" }
	| { kind: "error" }
	| { kind: "ready"; catalog: Catalog }

export function useCatalog(lang: Lang) {
	const [state, setState] = useState<CatalogState>({ kind: "loading" })
	const [attempt, setAttempt] = useState(0)

	// biome-ignore lint/correctness/useExhaustiveDependencies: attempt only forces a re-fetch, unused in the body
	useEffect(() => {
		const controller = new AbortController()
		setState({ kind: "loading" })
		Promise.all([fetchMunicipalities(controller.signal), fetchCategories(lang, controller.signal)])
			.then(([municipalities, categories]) =>
				setState({ kind: "ready", catalog: { municipalities, categories } })
			)
			.catch((error: unknown) => {
				// Cleanup aborted us — a newer request (new lang, or a retry) owns the state now.
				if (error instanceof DOMException && error.name === "AbortError") return
				setState({ kind: "error" })
			})
		return () => controller.abort()
	}, [lang, attempt])

	return { state, retry: () => setAttempt((n) => n + 1) }
}
