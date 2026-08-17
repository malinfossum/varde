import { useTranslation } from "../i18n/LanguageProvider.tsx"

export function QuickExit() {
	const t = useTranslation()
	// location.replace: the current page does not survive in back-history (base spec,
	// "Browser history and the quick exit"). Destination is a neutral, unremarkable site.
	return (
		<button
			type="button"
			className="quick-exit"
			onClick={() => window.location.replace("https://www.google.com")}
		>
			{t("app.quickExit")}
		</button>
	)
}
