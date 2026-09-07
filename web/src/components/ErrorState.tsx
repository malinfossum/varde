import { nationalFallbacks } from "../i18n/fallbacks.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { telHref } from "./ResourceCard.tsx"

// First component styled with Tailwind utilities (mapped onto the design-system tokens in
// main.css). The retry button mirrors .btn from the design-system rather than reusing it, so
// the whole component is one honest sample of the utility approach.
export function ErrorState({ onRetry }: { onRetry: () => void }) {
	const t = useTranslation()
	return (
		<section className="grid gap-3 rounded-md border border-danger-line bg-danger-soft p-4">
			<h2 className="text-lg leading-snug text-fg">{t("error.heading")}</h2>
			<p>{t("error.help")}</p>
			{/* The directory being down must never mean "no number to call" — the national lines
			    are always reachable and live in the bundle, not behind the failed request. */}
			<p>{t("error.fallbacks")}</p>
			<ul className="grid gap-1 pl-5">
				{nationalFallbacks.map((service) => (
					<li key={service.id}>
						<a href={telHref(service.phone)}>
							{service.name} – {service.phone}
						</a>
					</li>
				))}
			</ul>
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
