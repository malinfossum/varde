import { nationalFallbacks } from "../i18n/fallbacks.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import type { Suggestion } from "../services/match.ts"
import { telHref } from "./ResourceCard.tsx"
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
			<h2>{t("empty.heading")}</h2>
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
