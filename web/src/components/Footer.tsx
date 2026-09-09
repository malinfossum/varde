import { useTranslation } from "../i18n/LanguageProvider.tsx"

export function Footer() {
	const t = useTranslation()
	return (
		<footer className="mt-12 border-t border-border">
			<div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-muted">
				<p>{t("footer.noTracking")}</p>
				<a
					href="https://github.com/malinfossum/varde"
					rel="noopener noreferrer"
					className="inline-flex min-h-11 items-center"
				>
					{t("footer.source")}
				</a>
			</div>
		</footer>
	)
}
