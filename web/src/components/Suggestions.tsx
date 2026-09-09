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
		<ul
			className="m-0 mt-2 list-none rounded-xl border border-border bg-surface p-1"
			aria-label={t("search.suggestions")}
		>
			{suggestions.map((suggestion) => {
				const kindLabel =
					suggestion.kind === "municipality"
						? t("search.suggestionMunicipality")
						: t("search.suggestionCategory")
				const key = suggestion.kind === "municipality" ? `m${suggestion.id}` : `c${suggestion.slug}`
				return (
					<li key={key}>
						<button
							type="button"
							onClick={() => onPick(suggestion)}
							className="flex min-h-11 w-full items-center rounded-lg px-3 text-left text-fg hover:bg-accent-soft"
						>
							{suggestion.name} ({kindLabel})
						</button>
					</li>
				)
			})}
		</ul>
	)
}
