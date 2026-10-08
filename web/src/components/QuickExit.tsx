import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { EXIT_URL, leave } from "../services/quickExit.ts"

export function QuickExit() {
	const t = useTranslation()
	// A real anchor with a real href: this is a safety-critical control, so it has to work even
	// if the click handler never runs (JS still loading, prerendered markup before hydration).
	return (
		<a
			href={EXIT_URL}
			className="btn-secondary quick-exit"
			onClick={(event) => {
				event.preventDefault()
				leave()
			}}
		>
			{t("app.quickExit")}
		</a>
	)
}
