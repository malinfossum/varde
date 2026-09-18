import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { telHref } from "../services/emergency.ts"
import type { ResourceDto } from "../types/api.ts"
import { Link } from "./Link.tsx"
import { ResourceBadges } from "./ResourceBadges.tsx"

export function ResourceCard({
	resource,
	headingLevel = 2,
	kommuneSlug,
}: {
	resource: ResourceDto
	headingLevel?: 2 | 3
	kommuneSlug?: string
}) {
	const t = useTranslation()
	// h2 under a results h1 (the list and landing pages); h3 inside KommunePage, whose "Tjenester
	// i {name}" / "Nasjonale tjenester" sections are already h2 — so heading levels never skip.
	const Heading = headingLevel === 3 ? "h3" : "h2"
	return (
		<li className="grid content-start gap-3 rounded-xl border border-border bg-surface p-4">
			<Heading className="text-lg font-semibold leading-snug">
				<Link to={`/resources/${resource.id}`} className="text-fg">
					{resource.name}
				</Link>
			</Heading>
			<ResourceBadges resource={resource} />
			{resource.municipalityName &&
				(kommuneSlug ? (
					<p className="text-sm text-muted">
						<Link to={`/kommune/${kommuneSlug}`}>{resource.municipalityName}</Link>
					</p>
				) : (
					<p className="text-sm text-muted">{resource.municipalityName}</p>
				))}
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
