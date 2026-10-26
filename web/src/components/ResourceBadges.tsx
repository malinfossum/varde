import { useTranslation } from "../i18n/LanguageProvider.tsx"
import type { ResourceDto } from "../types/api.ts"

// Shared by ResourceCard and ResourceDetail so the badge set (Akutt, Nasjonal, Døgnåpent,
// Lavterskel, then one cost badge, in that fixed order) never drifts between the two views.
// `cost` is tested for truthiness, not against null: data exported before the field existed has
// no `cost` at all, and that must read as "not stated", never as a badge for "undefined".
export function ResourceBadges({ resource }: { resource: ResourceDto }) {
	const t = useTranslation()
	const isAkutt = resource.categories.some((c) => c.slug === "nodtjenester")
	const hasAny =
		isAkutt ||
		resource.isNational ||
		resource.isAlwaysOpen ||
		resource.isLowThreshold ||
		resource.cost
	if (!hasAny) return null
	return (
		<p className="flex flex-wrap gap-1">
			{isAkutt && <span className="badge badge-akutt">{t("badge.akutt")}</span>}
			{resource.isNational && <span className="badge text-muted">{t("badge.national")}</span>}
			{resource.isAlwaysOpen && <span className="badge text-accent">{t("badge.alwaysOpen")}</span>}
			{resource.isLowThreshold && (
				<span className="badge text-accent">{t("badge.lowThreshold")}</span>
			)}
			{resource.cost && (
				<span className="badge text-muted">{t(`badge.cost.${resource.cost}`)}</span>
			)}
		</p>
	)
}
