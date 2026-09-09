import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { telHref } from "../services/emergency.ts"
import type { ResourceDto } from "../types/api.ts"
import { Link } from "./Link.tsx"
import { ResourceBadges } from "./ResourceBadges.tsx"

export function ResourceCard({ resource }: { resource: ResourceDto }) {
	const t = useTranslation()
	return (
		<li className="grid content-start gap-3 rounded-xl border border-border bg-surface p-4">
			{/* One level under the results heading (h1) — never h3, so heading levels never skip. */}
			<h2 className="text-lg font-semibold leading-snug">
				<Link to={`/resources/${resource.id}`} className="text-fg">
					{resource.name}
				</Link>
			</h2>
			<ResourceBadges resource={resource} />
			{resource.isFallbackTranslation && <p className="text-sm text-muted">{t("card.fallback")}</p>}
			{/* Full description, never clamped: closure notices and safety lines live here. */}
			<p>{resource.description}</p>
			{resource.openingHours && (
				<p className="text-sm">
					<span className="text-muted">{t("card.hours")}:</span> {resource.openingHours}
				</p>
			)}
			<p className="flex flex-wrap gap-2">
				{resource.phone ? (
					<a href={telHref(resource.phone)} className="btn-primary">
						{t("card.call")} {resource.phone}
					</a>
				) : (
					<span className="self-center text-sm text-muted">{t("card.noPhone")}</span>
				)}
				<Link to={`/resources/${resource.id}`} className="btn-secondary">
					{t("card.details")}
				</Link>
			</p>
			<p className="text-xs text-muted">
				{t("card.lastVerified")} {resource.lastVerified}
			</p>
		</li>
	)
}
