import { useTranslation } from "../i18n/LanguageProvider.tsx"

const placeholders = [0, 1, 2, 3, 4, 5]

export function LoadingState() {
	const t = useTranslation()
	return (
		<div role="status" aria-busy="true" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{/* Hidden as an <h1>, not a <span>: while the results are loading there is nothing
			    else on the page to anchor a heading outline to, and this keeps /sok at exactly
			    one level-1 heading in every state. */}
			<h1 className="visually-hidden">{t("status.loading")}</h1>
			{placeholders.map((n) => (
				<div
					key={n}
					aria-hidden="true"
					className="grid gap-3 rounded-xl border border-border bg-surface p-4"
				>
					<div className="h-5 w-2/3 rounded bg-accent-soft" />
					<div className="h-4 w-1/3 rounded bg-accent-soft" />
					<div className="h-4 w-full rounded bg-accent-soft" />
					<div className="h-11 w-1/2 rounded-xl bg-accent-soft" />
				</div>
			))}
		</div>
	)
}
