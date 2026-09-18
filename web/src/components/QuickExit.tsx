import { useTranslation } from "../i18n/LanguageProvider.tsx"

export function QuickExit() {
	const t = useTranslation()
	// A real anchor with a real href: this is a safety-critical control, so it has to work even
	// if the click handler never runs (JS still loading, prerendered markup before hydration).
	// location.replace on click: the current page does not survive in back-history (base spec,
	// "Browser history and the quick exit"). Destination is a neutral, unremarkable site.
	return (
		<a
			href="https://www.google.com"
			className="btn-secondary"
			onClick={(event) => {
				event.preventDefault()
				window.location.replace("https://www.google.com")
			}}
		>
			{t("app.quickExit")}
		</a>
	)
}
