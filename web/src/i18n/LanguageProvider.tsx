import { createContext, type ReactNode, useContext, useEffect, useState } from "react"
import en from "./en.json"
import nb from "./nb.json"

export type Lang = "nb" | "en"
const STORAGE_KEY = "varde.lang"
const strings: Record<Lang, Record<string, string>> = { nb, en }

function isLang(value: string | null): value is Lang {
	return value === "nb" || value === "en"
}

export function resolveLang(urlLang: string | null): Lang {
	if (isLang(urlLang)) return urlLang
	const stored = localStorage.getItem(STORAGE_KEY)
	return isLang(stored) ? stored : "nb"
}

const LanguageContext = createContext<{ lang: Lang; setLang: (next: Lang) => void } | null>(null)

export function LanguageProvider({
	initialLang,
	children,
}: {
	initialLang: string | null
	children: ReactNode
}) {
	const [lang, setLangState] = useState<Lang>(() => resolveLang(initialLang))

	useEffect(() => {
		document.documentElement.lang = lang
	}, [lang])

	// localStorage is written only here — an explicit toggle — never from URL resolution.
	const setLang = (next: Lang) => {
		localStorage.setItem(STORAGE_KEY, next)
		setLangState(next)
	}

	return <LanguageContext.Provider value={{ lang, setLang }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
	const context = useContext(LanguageContext)
	if (!context) throw new Error("useLanguage requires a LanguageProvider")
	return context
}

export function useTranslation(): (key: string) => string {
	const { lang } = useLanguage()
	return (key) => strings[lang][key] ?? strings.nb[key] ?? key
}
