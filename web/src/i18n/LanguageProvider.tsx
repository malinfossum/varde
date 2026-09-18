import { createContext, type ReactNode, useContext, useEffect } from "react"
import { I18nProvider } from "react-aria-components"
import type { Lang } from "../services/urlState.ts"
import en from "./en.json"
import nb from "./nb.json"

export type { Lang }
export const LANG_STORAGE_KEY = "varde.lang"
const strings: Record<Lang, Record<string, string>> = { nb, en }

const LanguageContext = createContext<{ lang: Lang } | null>(null)

// The URL is the only source of the language (spec: URL and language model). Storage is
// written by the toggle alone and read by public/theme-init.js alone, before first paint.
export function LanguageProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
	useEffect(() => {
		document.documentElement.lang = lang
	}, [lang])
	// react-aria speaks for itself: the combobox's listbox label, "N alternativer finnes" and
	// the group-change announcements all come from its own locale bundle, and without a locale
	// it reads navigator.language — so an English-locale browser would narrate a Norwegian UI in
	// English. The combobox deliberately has no hand-rolled live region because those native
	// announcements are the accessible name; feeding them the same lang the toggle sets is what
	// makes that hold.
	return (
		<LanguageContext.Provider value={{ lang }}>
			<I18nProvider locale={lang}>{children}</I18nProvider>
		</LanguageContext.Provider>
	)
}

export function useLanguage() {
	const context = useContext(LanguageContext)
	if (!context) throw new Error("useLanguage requires a LanguageProvider")
	return context
}

// Shared by useTranslation (current language) and callers that need a specific language's
// string regardless of what's currently active — e.g. announcing a switch in the language
// being switched to, before the provider's own re-render has caught up.
export function translate(lang: Lang, key: string): string {
	return strings[lang][key] ?? strings.nb[key] ?? key
}

export function useTranslation(): (key: string) => string {
	const { lang } = useLanguage()
	return (key) => translate(lang, key)
}
