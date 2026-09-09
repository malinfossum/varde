import { nationalFallbacks } from "../i18n/fallbacks.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { telHref } from "../services/emergency.ts"
import type { Suggestion } from "../services/match.ts"
import { Suggestions } from "./Suggestions.tsx"

export function EmptyState({
	onClearFilters,
	suggestions,
	onPick,
}: {
	onClearFilters: () => void
	suggestions: Suggestion[]
	onPick: (suggestion: Suggestion) => void
}) {
	const t = useTranslation()
	return (
		<section className="empty-state">
			{/* This state replaces the results heading rather than sitting under it — it is
			    /sok's only heading while showing, so it takes the h1 level (Task 10, R29). */}
			<h1>{t("empty.heading")}</h1>
			<p>{t("empty.help")}</p>
			<ul>
				{nationalFallbacks.map((service) => (
					<li key={service.id}>
						<a href={telHref(service.phone)}>
							{service.name} – {service.phone}
						</a>
					</li>
				))}
			</ul>
			<Suggestions suggestions={suggestions} onPick={onPick} />
			<button type="button" onClick={onClearFilters}>
				{t("empty.clearFilters")}
			</button>
		</section>
	)
}
