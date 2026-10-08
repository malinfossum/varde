import {
	LANG_STORAGE_KEY,
	translate,
	useLanguage,
	useTranslation,
} from "../i18n/LanguageProvider.tsx"
import { LANGUAGES } from "../i18n/languages.ts"
import { useCurrentUrl } from "../navigation.ts"
import { parseUrl, routePath } from "../services/urlState.ts"
import { CheckIcon, GlobeIcon } from "./icons.tsx"
import { Link } from "./Link.tsx"
import { Picker } from "./Picker.tsx"
import { useAnnounce } from "./StatusRegion.tsx"

export function LanguagePicker() {
	const { lang } = useLanguage()
	const t = useTranslation()
	const announce = useAnnounce()
	const { pathname, search } = useCurrentUrl()
	// A different language can change the result set entirely, so a switch resets paging the
	// same way a search or filter change does (spec).
	const params = new URLSearchParams(search)
	params.delete("page")
	const query = params.toString()
	const to = `${routePath(parseUrl(pathname).route)}${query ? `?${query}` : ""}`
	const current = LANGUAGES.find((language) => language.code === lang) ?? LANGUAGES[0]
	return (
		<Picker name={t("header.language")} value={current.name} icon={<GlobeIcon />}>
			{(closeAndFocus) =>
				LANGUAGES.map((language) => {
					const isCurrent = language.code === lang
					return (
						<Link
							key={language.code}
							to={to}
							lang={language.code}
							className="picker-row"
							aria-current={isCurrent ? "page" : undefined}
							onNavigate={() => {
								try {
									localStorage.setItem(LANG_STORAGE_KEY, language.code)
								} catch {}
								// Announced in the language being switched to: useTranslation() would
								// still read the old one until the re-render lands.
								if (!isCurrent) announce(translate(language.code, "status.langChanged"))
								closeAndFocus()
							}}
						>
							<span>{language.name}</span>
							<span className="picker-code" aria-hidden="true">
								{language.short}
							</span>
							{isCurrent && <CheckIcon className="picker-check" />}
						</Link>
					)
				})
			}
		</Picker>
	)
}
