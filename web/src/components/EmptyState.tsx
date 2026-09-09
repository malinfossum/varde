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
		<section className="grid gap-3 rounded-xl border border-border bg-surface p-5">
			{/* This state replaces the results heading rather than sitting under it — it is
			    /sok's only heading while showing, so it takes the h1 level (Task 10, R29). */}
			<h1 className="text-xl text-fg">{t("empty.heading")}</h1>
			<p>{t("empty.help")}</p>
			<ul className="grid gap-1 pl-5">
				{nationalFallbacks.map((service) => (
					<li key={service.id}>
						<a href={telHref(service.phone)}>
							{service.name} – {service.phone}
						</a>
					</li>
				))}
			</ul>
			<Suggestions suggestions={suggestions} onPick={onPick} />
			<button type="button" onClick={onClearFilters} className="btn-secondary justify-self-start">
				{t("empty.clearFilters")}
			</button>
		</section>
	)
}
