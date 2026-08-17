import { useTranslation } from "../i18n/LanguageProvider.tsx"
import type { Suggestion } from "../services/match.ts"

export function Suggestions({
	suggestions,
	onPick,
}: {
	suggestions: Suggestion[]
	onPick: (suggestion: Suggestion) => void
}) {
	const t = useTranslation()
	if (suggestions.length === 0) return null
	return (
		<ul className="suggestions" aria-label={t("search.suggestions")}>
			{suggestions.map((suggestion) => {
				const kindLabel =
					suggestion.kind === "municipality"
						? t("search.suggestionMunicipality")
						: t("search.suggestionCategory")
				const key = suggestion.kind === "municipality" ? `m${suggestion.id}` : `c${suggestion.slug}`
				return (
					<li key={key}>
						<button type="button" onClick={() => onPick(suggestion)}>
							{suggestion.name} ({kindLabel})
						</button>
					</li>
				)
			})}
		</ul>
	)
}
