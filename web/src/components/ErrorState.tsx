import { nationalFallbacks } from "../i18n/fallbacks.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { telHref } from "../services/emergency.ts"

// level 1 is for when this is the only content on the page (a lone fetch failure, or the
// catalog and resources failing together — ListPage never stacks two ErrorStates). level 2 is
// for when the catalog fails but something else (loading, empty, or results) is still the
// page's primary content: the catalog panel becomes a secondary region instead of the heading.
export function ErrorState({ onRetry, level = 1 }: { onRetry: () => void; level?: 1 | 2 }) {
	const t = useTranslation()
	// The strip above every page already carries 110/112/113 — the only fallback worth
	// repeating here is Legevakt, since a failed directory is exactly when "who do I call
	// instead" matters most.
	const legevakt = nationalFallbacks.filter((service) => service.id === 3)
	return (
		<section className="grid gap-3 rounded-xl border border-akutt bg-akutt-soft p-5">
			{level === 1 ? (
				<h1 className="text-xl text-fg">{t("error.heading")}</h1>
			) : (
				<h2 className="text-xl text-fg">{t("error.heading")}</h2>
			)}
			<p>{t("error.help")}</p>
			{/* The directory being down must never mean "no number to call" — the national lines
			    are always reachable and live in the bundle, not behind the failed request. */}
			<p>{t("error.fallbacks")}</p>
			<ul className="grid gap-1 pl-5">
				{legevakt.map((service) => (
					<li key={service.id}>
						<a href={telHref(service.phone)}>
							{service.name} – {service.phone}
						</a>
					</li>
				))}
			</ul>
			<button type="button" onClick={onRetry} className="btn-secondary justify-self-start">
				{t("error.retry")}
			</button>
		</section>
	)
}
