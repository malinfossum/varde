import { useSyncExternalStore } from "react"
import { LANG_STORAGE_KEY, translate, useLanguage } from "../i18n/LanguageProvider.tsx"
import { LANGUAGES } from "../i18n/languages.ts"
import { useCurrentUrl } from "../navigation.ts"
import { type Lang, parseUrl, routePath, systemLang } from "../services/urlState.ts"
import { CheckIcon } from "./icons.tsx"
import { Link } from "./Link.tsx"
import { useAnnounce } from "./StatusRegion.tsx"

// The stored choice and the browser's language, shared by both copies of the rows (desktop picker
// and Meny) so a choice in one moves the mark in the other. The server snapshots are null: the
// prerendered HTML cannot know either, so hydration matches and the real values arrive after it.
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
	listeners.add(listener)
	window.addEventListener("storage", listener)
	window.addEventListener("languagechange", listener)
	return () => {
		listeners.delete(listener)
		window.removeEventListener("storage", listener)
		window.removeEventListener("languagechange", listener)
	}
}

function readStored(): string | null {
	try {
		return window.localStorage.getItem(LANG_STORAGE_KEY)
	} catch {
		return null
	}
}

function store(choice: Lang | "system") {
	try {
		window.localStorage.setItem(LANG_STORAGE_KEY, choice)
	} catch {}
	for (const listener of listeners) listener()
}

const readBrowserLang = () => systemLang(window.navigator.languages ?? [])
const serverSnapshot = () => null

// One source for the language rows, rendered by the desktop language picker and by the Meny
// (spec: One source, two layouts). onDone closes whichever list holds them and returns focus to
// its trigger.
export function LanguageRows({ onDone }: { onDone: () => void }) {
	const { lang } = useLanguage()
	const announce = useAnnounce()
	const { pathname, search } = useCurrentUrl()
	const followsBrowser = useSyncExternalStore(subscribe, readStored, serverSnapshot) === "system"
	// Before hydration the browser's language is unknown, so System links to this page as it is.
	const browserLang = useSyncExternalStore(subscribe, readBrowserLang, serverSnapshot) ?? lang
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
				const isChosen = isCurrent && !followsBrowser
				return (
					<Link
						key={language.code}
						to={to}
						lang={language.code}
						className="picker-row"
						aria-current={isChosen ? "page" : undefined}
						onNavigate={() => {
							store(language.code)
							// The language you are already in: stay on the page (a navigation would push
							// a duplicate history entry and drop page). The row stays a real link, so
							// without JavaScript it still reloads the page.
							if (isCurrent) {
								if (followsBrowser) announce(translate(lang, "status.langChanged"))
								onDone()
								return false
							}
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
						{isChosen && <CheckIcon className="picker-check" />}
					</Link>
				)
			})}
			{/* System (#80): remembers "follow the browser" and links to this page in the browser's
			    language. The label is in the page language, whatever language the link leads to. */}
			<Link
				to={to}
				lang={browserLang}
				className="picker-row"
				aria-current={followsBrowser ? "true" : undefined}
				onNavigate={() => {
					store("system")
					announce(translate(browserLang, "status.langSystem"))
					onDone()
					if (browserLang === lang) return false
				}}
			>
				<span lang={lang}>{translate(lang, "header.languageSystem")}</span>
				{followsBrowser && <CheckIcon className="picker-check" />}
			</Link>
		</>
	)
}
