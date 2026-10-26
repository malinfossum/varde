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
	// A list, not a <p>: Chromium drops the paragraph role from a flex container, which left each
	// badge a loose span in an unnamed generic, and NVDA skipped them in browse mode. As list items
	// they are read as "list, N items", then each badge, in this order.
	return (
		<ul className="m-0 flex list-none flex-wrap gap-1 p-0">
			{isAkutt && (
				<li>
					<span className="badge badge-akutt">{t("badge.akutt")}</span>
				</li>
			)}
			{resource.isNational && (
				<li>
					<span className="badge text-muted">{t("badge.national")}</span>
				</li>
			)}
			{resource.isAlwaysOpen && (
				<li>
					<span className="badge text-accent">{t("badge.alwaysOpen")}</span>
				</li>
			)}
			{resource.isLowThreshold && (
				<li>
					<span className="badge text-accent">{t("badge.lowThreshold")}</span>
				</li>
			)}
			{resource.cost && (
				<li>
					<span className="badge text-muted">{t(`badge.cost.${resource.cost}`)}</span>
				</li>
			)}
		</ul>
	)
}
