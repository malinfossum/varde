import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { Link } from "./Link.tsx"

export function AkuttShortcut() {
	const t = useTranslation()
	return (
		<Link to="/?category=nodtjenester" className="akutt-shortcut">
			{t("app.akuttShortcut")}
		</Link>
	)
}
