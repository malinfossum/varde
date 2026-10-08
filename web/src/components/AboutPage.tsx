import { useArrivalFocus } from "../hooks/useArrivalFocus.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { PageHead } from "./PageHead.tsx"

export function AboutPage({ arrival }: { arrival: number }) {
	const t = useTranslation()
	const { ref } = useArrivalFocus<HTMLHeadingElement>(arrival, true)
	return (
		<article className="about mx-auto grid max-w-prose gap-6">
			<PageHead title={t("about.pageTitle")} description={t("about.description")} path="/om" />
			<h1 ref={ref} tabIndex={-1} className="text-4xl">
				{t("about.heading")}
			</h1>
		</article>
	)
}
