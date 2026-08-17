import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { Link } from "./Link.tsx"

export function NotFoundState() {
	const t = useTranslation()
	return (
		<section className="not-found-state">
			<h2>{t("notFound.heading")}</h2>
			<p>{t("notFound.help")}</p>
			<Link to="/">{t("detail.back")}</Link>
		</section>
	)
}
