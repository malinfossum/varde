import { useId } from "react"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { EXIT_URL, leave } from "../services/quickExit.ts"

export function QuickExit() {
	const t = useTranslation()
	const hintId = useId()
	// A real anchor with a real href: this is a safety-critical control, so it has to work even
	// if the click handler never runs (JS still loading, prerendered markup before hydration).
	// The Shift shortcut is Varde's own, so no screen reader knows it: the hidden hint is read
	// as the button's description. It stays off screen, where it only confused touch users.
	return (
		<>
			<a
				href={EXIT_URL}
				className="btn-secondary quick-exit"
				aria-describedby={hintId}
				onClick={(event) => {
					event.preventDefault()
					leave()
				}}
			>
				{t("app.quickExit")}
			</a>
			<span id={hintId} className="visually-hidden">
				{t("app.quickExitHint")}
			</span>
		</>
	)
}
