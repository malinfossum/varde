import { LANG_STORAGE_KEY, translate, useLanguage } from "../i18n/LanguageProvider.tsx"
import { useCurrentUrl } from "../navigation.ts"
import { type Lang, parseUrl, routePath } from "../services/urlState.ts"
import { Link } from "./Link.tsx"
import { useAnnounce } from "./StatusRegion.tsx"

export function LanguageToggle() {
	const { lang } = useLanguage()
	const announce = useAnnounce()
	const { pathname, search } = useCurrentUrl()
	const next: Lang = lang === "nb" ? "en" : "nb"
	// A different language can change the result set entirely, so a language switch resets
	// paging the same way a search/filter change does (spec).
	const params = new URLSearchParams(search)
	params.delete("page")
	const query = params.toString()
	const to = `${routePath(parseUrl(pathname).route)}${query ? `?${query}` : ""}`
	const remember = () => {
		try {
			localStorage.setItem(LANG_STORAGE_KEY, next)
		} catch {}
		// Announce in the *new* language; useTranslation() would still read the pre-switch
		// language until the re-render lands, so look the string up directly in the target
		// language's dictionary (single source of truth: status.langChanged in i18n/*.json).
		announce(translate(next, "status.langChanged"))
	}
	return (
		<Link to={to} lang={next} className="btn-secondary min-w-11" onNavigate={remember}>
			{lang === "nb" ? "English" : "Norsk"}
		</Link>
	)
}
