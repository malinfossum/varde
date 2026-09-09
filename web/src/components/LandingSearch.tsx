import { useEffect, useMemo, useState } from "react"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { useNavigate } from "../navigation.ts"
import { type Catalog, loadCatalog, prefetchCatalog } from "../services/catalogCache.ts"
import { type Suggestion, suggest } from "../services/match.ts"
import { buildSearch, type Filters } from "../services/urlState.ts"
import { Suggestions } from "./Suggestions.tsx"

const empty: Filters = { search: "", categories: [], municipality: null, national: false, page: 1 }

export function LandingSearch() {
	const { lang } = useLanguage()
	const t = useTranslation()
	const navigate = useNavigate()
	const [value, setValue] = useState("")
	const [catalog, setCatalog] = useState<Catalog | null>(null)

	// The landing fetches nothing on render. The first sign of intent — focus or the pointer
	// reaching the box — starts the catalog request so suggestions are ready for the first
	// keystroke. A failed catalog is silent here: plain search still works.
	const warm = () => prefetchCatalog(lang)

	useEffect(() => {
		if (!value) return
		let cancelled = false
		loadCatalog(lang)
			.then((c) => {
				if (!cancelled) setCatalog(c)
			})
			.catch(() => {})
		return () => {
			cancelled = true
		}
	}, [value, lang])

	const suggestions: Suggestion[] = useMemo(
		() => (catalog && value ? suggest(value, catalog) : []),
		[catalog, value]
	)

	const go = (patch: Partial<Filters>) =>
		navigate("/sok", buildSearch({ ...empty, ...patch }, lang))
	const onPick = (s: Suggestion) =>
		s.kind === "municipality" ? go({ municipality: s.id }) : go({ categories: [s.slug] })

	return (
		<search className="mx-auto w-full max-w-xl">
			<form
				className="flex items-center gap-2 rounded-xl border border-border bg-surface p-1.5 pl-4"
				onSubmit={(event) => {
					event.preventDefault()
					go({ search: value.trim() })
				}}
			>
				<label htmlFor="landing-search" className="visually-hidden">
					{t("landing.searchLabel")}
				</label>
				<input
					id="landing-search"
					type="search"
					value={value}
					onChange={(event) => setValue(event.target.value)}
					onFocus={warm}
					onPointerEnter={warm}
					placeholder={t("landing.searchPlaceholder")}
					autoComplete="off"
					className="min-h-11 flex-1 bg-transparent text-fg outline-none"
				/>
				<button type="submit" className="btn-primary">
					{t("landing.searchButton")}
				</button>
			</form>
			<Suggestions suggestions={suggestions} onPick={onPick} />
		</search>
	)
}
