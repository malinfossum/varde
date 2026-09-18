import { useArrivalFocus } from "../hooks/useArrivalFocus.ts"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { Link } from "./Link.tsx"
import { PageHead } from "./PageHead.tsx"

const titles = { nb: "Fant ikke siden – Varde", en: "Page not found – Varde" }

// Used both for the route-level "page not found" (/nope) and for a missing resource embedded
// inside ResourceDetail — in both cases it is the only content the shell renders in <main>, so
// it always owns the page's one level-1 heading. No caller has a reason to pass a different
// level as long as that stays true.
export function NotFoundState({ arrival = 0 }: { arrival?: number }) {
	const { lang } = useLanguage()
	const t = useTranslation()
	const { ref } = useArrivalFocus<HTMLHeadingElement>(arrival, true)
	return (
		<section className="grid gap-3 py-10 text-center">
			<PageHead title={titles[lang]} description={t("notFound.help")} path="/404" />
			<h1 ref={ref} tabIndex={-1}>
				{t("notFound.heading")}
			</h1>
			<p>{t("notFound.help")}</p>
			<div className="flex flex-wrap justify-center gap-3">
				<Link to="/" className="btn-secondary">
					{t("landing.toHome")}
				</Link>
				<Link to="/sok" className="btn-secondary">
					{t("detail.back")}
				</Link>
			</div>
		</section>
	)
}
