import { useLanguage } from "../i18n/LanguageProvider.tsx"
import { useAnnounce } from "./StatusRegion.tsx"

export function LanguageToggle() {
	const { lang, setLang } = useLanguage()
	const announce = useAnnounce()
	const next = lang === "nb" ? "en" : "nb"
	const onToggle = () => {
		setLang(next)
		// Announce in the *new* language; the strings object is keyed per language, so read
		// the translation after the switch via a microtask-free direct lookup:
		announce(next === "nb" ? "Språket er nå norsk" : "Language is now English")
	}
	// The button never unmounts, so focus stays on it through the re-render (spec: Focus).
	return (
		<button type="button" onClick={onToggle}>
			{lang === "nb" ? "English" : "Norsk"}
		</button>
	)
}
