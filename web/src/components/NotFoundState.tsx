import { useArrivalFocus } from "../hooks/useArrivalFocus.ts"
import { useDocumentTitle } from "../hooks/useDocumentTitle.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { Link } from "./Link.tsx"

// level 1 is the route-level "page not found" (/nope); level 2 is a missing resource embedded
// inside ResourceDetail, which already sits under the shell's own h1.
export function NotFoundState({ arrival = 0, level = 1 }: { arrival?: number; level?: 1 | 2 }) {
	const t = useTranslation()
	useDocumentTitle(t("title.notFound"))
	const { ref } = useArrivalFocus<HTMLHeadingElement>(arrival, true)
	return (
		<section className="not-found-state">
			{level === 1 ? (
				<h1 ref={ref} tabIndex={-1}>
					{t("notFound.heading")}
				</h1>
			) : (
				<h2 ref={ref} tabIndex={-1}>
					{t("notFound.heading")}
				</h2>
			)}
			<p>{t("notFound.help")}</p>
			<Link to="/sok">{t("detail.back")}</Link>
		</section>
	)
}
