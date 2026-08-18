import { translate, useLanguage } from "../i18n/LanguageProvider.tsx"
import { useNavigate } from "../navigation.ts"
import { useAnnounce } from "./StatusRegion.tsx"

export function LanguageToggle() {
	const { lang, setLang } = useLanguage()
	const announce = useAnnounce()
	const navigate = useNavigate()
	const next = lang === "nb" ? "en" : "nb"
	const onToggle = () => {
		setLang(next)
		// Announce in the *new* language; useTranslation() would still read the pre-switch
		// language until the re-render lands, so look the string up directly in the target
		// language's dictionary (single source of truth: status.langChanged in i18n/*.json).
		announce(translate(next, "status.langChanged"))
		// Reflect the choice in the URL (base spec: provider updates document.lang, URL, and
		// announces). navigate() replaces state via pushState on the current path — one
		// history entry per toggle, no extra localStorage write beyond the setLang above.
		const params = new URLSearchParams(window.location.search)
		params.set("lang", next)
		// A different language can change the result set entirely, so a language switch resets
		// paging the same way a search/filter change does (spec).
		params.delete("page")
		navigate(window.location.pathname, `?${params.toString()}`)
	}
	// The button never unmounts, so focus stays on it through the re-render (spec: Focus).
	return (
		<button type="button" onClick={onToggle}>
			{lang === "nb" ? "English" : "Norsk"}
		</button>
	)
}
