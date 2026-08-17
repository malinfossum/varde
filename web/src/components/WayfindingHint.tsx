import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { findHint } from "../services/hints.ts"

export function WayfindingHint({ query }: { query: string }) {
	const t = useTranslation()
	const hint = findHint(query)
	if (!hint) return null
	// Static text and href — the user's query is never interpolated into either.
	return (
		<p className="wayfinding-hint muted">
			<a href={hint.href} rel="noopener noreferrer">
				{t(`hint.${hint.id}`)}
			</a>
		</p>
	)
}
