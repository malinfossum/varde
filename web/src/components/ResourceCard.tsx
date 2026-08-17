import { useTranslation } from "../i18n/LanguageProvider.tsx"
import type { ResourceDto } from "../types/api.ts"
import { Link } from "./Link.tsx"

export function telHref(phone: string): string {
	return `tel:${phone.replaceAll(" ", "")}`
}

export function ResourceCard({ resource }: { resource: ResourceDto }) {
	const t = useTranslation()
	const isAkutt = resource.categories.some((c) => c.slug === "nodtjenester")
	return (
		<li className="card resource-card">
			<h3>
				<Link to={`/resources/${resource.id}`}>{resource.name}</Link>
			</h3>
			<p className="badges">
				{resource.isNational && <span className="badge">{t("badge.national")}</span>}
				{isAkutt && <span className="badge badge-akutt">{t("badge.akutt")}</span>}
				{resource.isAlwaysOpen && <span className="badge">{t("badge.alwaysOpen")}</span>}
			</p>
			{resource.isFallbackTranslation && <p className="muted">{t("card.fallback")}</p>}
			<p>{resource.description}</p>
			{resource.openingHours && (
				<p>
					{t("card.hours")}: {resource.openingHours}
				</p>
			)}
			{resource.phone && <a href={telHref(resource.phone)}>{resource.phone}</a>}
			{resource.website && (
				<a href={resource.website} rel="noopener noreferrer">
					{t("detail.website")}
				</a>
			)}
			<p className="muted verified">
				{t("card.lastVerified")} {resource.lastVerified}
			</p>
		</li>
	)
}
