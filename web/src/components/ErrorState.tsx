import { useTranslation } from "../i18n/LanguageProvider.tsx"

export function ErrorState({ onRetry }: { onRetry: () => void }) {
	const t = useTranslation()
	return (
		<section className="error-state">
			<h2>{t("error.heading")}</h2>
			<p>{t("error.help")}</p>
			<button type="button" onClick={onRetry}>
				{t("error.retry")}
			</button>
		</section>
	)
}
