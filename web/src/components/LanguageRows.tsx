import { LANG_STORAGE_KEY, translate, useLanguage } from "../i18n/LanguageProvider.tsx"
import { LANGUAGES } from "../i18n/languages.ts"
import { useCurrentUrl } from "../navigation.ts"
import { parseUrl, routePath } from "../services/urlState.ts"
import { CheckIcon } from "./icons.tsx"
import { Link } from "./Link.tsx"
import { useAnnounce } from "./StatusRegion.tsx"

// One source for the language rows, rendered by the desktop language picker and by the Meny
// (spec: One source, two layouts). onDone closes whichever list holds them and returns focus to
// its trigger.
export function LanguageRows({ onDone }: { onDone: () => void }) {
	const { lang } = useLanguage()
	const announce = useAnnounce()
	const { pathname, search } = useCurrentUrl()
	// A different language can change the result set entirely, so a switch resets paging the
	// same way a search or filter change does (spec).
	const params = new URLSearchParams(search)
	params.delete("page")
	const query = params.toString()
	const to = `${routePath(parseUrl(pathname).route)}${query ? `?${query}` : ""}`
	return (
		<>
			{LANGUAGES.map((language) => {
				const isCurrent = language.code === lang
				return (
					<Link
						key={language.code}
						to={to}
						lang={language.code}
						className="picker-row"
						aria-current={isCurrent ? "page" : undefined}
						onNavigate={() => {
							// The language you are already in: stay on the page (a navigation would push
							// a duplicate history entry and drop page). The row stays a real link, so
							// without JavaScript it still reloads the page.
							if (isCurrent) {
								onDone()
								return false
							}
							try {
								localStorage.setItem(LANG_STORAGE_KEY, language.code)
							} catch {}
							// Announced in the language being switched to: useTranslation() would
							// still read the old one until the re-render lands.
							announce(translate(language.code, "status.langChanged"))
							onDone()
						}}
					>
						<span>{language.name}</span>
						<span className="picker-code" aria-hidden="true">
							{language.short}
						</span>
						{isCurrent && <CheckIcon className="picker-check" />}
					</Link>
				)
			})}
		</>
	)
}
