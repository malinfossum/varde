import { useNavigate } from "../App.tsx"
import { useLanguage } from "../i18n/LanguageProvider.tsx"
import { useAnnounce } from "./StatusRegion.tsx"

export function LanguageToggle() {
	const { lang, setLang } = useLanguage()
	const announce = useAnnounce()
	const navigate = useNavigate()
	const next = lang === "nb" ? "en" : "nb"
	const onToggle = () => {
		setLang(next)
		// Announce in the *new* language; the strings object is keyed per language, so read
		// the translation after the switch via a microtask-free direct lookup:
		announce(next === "nb" ? "Språket er nå norsk" : "Language is now English")
		// Reflect the choice in the URL (base spec: provider updates document.lang, URL, and
		// announces). navigate() replaces state via pushState on the current path — one
		// history entry per toggle, no extra localStorage write beyond the setLang above.
		const params = new URLSearchParams(window.location.search)
		params.set("lang", next)
		navigate(window.location.pathname, `?${params.toString()}`)
	}
	// The button never unmounts, so focus stays on it through the re-render (spec: Focus).
	return (
		<button type="button" onClick={onToggle}>
			{lang === "nb" ? "English" : "Norsk"}
		</button>
	)
}
