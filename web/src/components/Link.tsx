import type { MouseEvent, ReactNode } from "react"
import { useLanguage } from "../i18n/LanguageProvider.tsx"
import { useNavigate } from "../navigation.ts"
import { type Lang, pathFor } from "../services/urlState.ts"

export function Link({
	to,
	lang,
	className,
	children,
	onNavigate,
}: {
	to: string
	lang?: Lang
	className?: string
	children: ReactNode
	onNavigate?: () => void
}) {
	const navigate = useNavigate()
	const { lang: current } = useLanguage()
	const target = lang ?? current
	const href = pathFor(target, to)
	const onClick = (event: MouseEvent) => {
		// Let the browser handle modified clicks (new tab / save-as) and non-primary buttons
		// (e.g. middle-click also opens a new tab).
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
			return
		event.preventDefault()
		onNavigate?.()
		const url = new URL(to, window.location.origin)
		navigate(url.pathname, url.search, { lang: target })
	}
	return (
		<a href={href} className={className} hrefLang={lang} lang={lang} onClick={onClick}>
			{children}
		</a>
	)
}
