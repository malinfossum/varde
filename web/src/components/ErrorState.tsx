import { useTranslation } from "../i18n/LanguageProvider.tsx"

// First component styled with Tailwind utilities (mapped onto the design-system tokens in
// main.css). The retry button mirrors .btn from the design-system rather than reusing it, so
// the whole component is one honest sample of the utility approach.
export function ErrorState({ onRetry }: { onRetry: () => void }) {
	const t = useTranslation()
	return (
		<section className="grid gap-3 rounded-md border border-danger-line bg-danger-soft p-4">
			<h2 className="text-lg leading-snug text-fg">{t("error.heading")}</h2>
			<p>{t("error.help")}</p>
			<button
				type="button"
				onClick={onRetry}
				className="min-h-11 justify-self-start rounded-sm border border-border bg-interactive px-4 text-fg transition-colors hover:border-border-strong hover:bg-surface-5 motion-reduce:transition-none"
			>
				{t("error.retry")}
			</button>
		</section>
	)
}
