import { useEffect, useState } from "react"
import type { Lang } from "../i18n/LanguageProvider.tsx"
import { fetchCategories, fetchMunicipalities } from "../services/api.ts"
import type { CategoryDto, MunicipalityDto } from "../types/api.ts"

export type Catalog = { municipalities: MunicipalityDto[]; categories: CategoryDto[] }

export function useCatalog(lang: Lang): Catalog | null {
	const [catalog, setCatalog] = useState<Catalog | null>(null)
	useEffect(() => {
		const controller = new AbortController()
		Promise.all([fetchMunicipalities(controller.signal), fetchCategories(lang, controller.signal)])
			.then(([municipalities, categories]) => setCatalog({ municipalities, categories }))
			.catch(() => {}) // the resources request surfaces connectivity errors; the catalog stays null
		return () => controller.abort()
	}, [lang])
	return catalog
}
