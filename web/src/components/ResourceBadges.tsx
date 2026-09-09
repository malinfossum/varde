import { useTranslation } from "../i18n/LanguageProvider.tsx"
import type { ResourceDto } from "../types/api.ts"

// Shared by ResourceCard and ResourceDetail so the badge set — Akutt, Nasjonal, Døgnåpent, in
// that fixed order — never drifts between the two views (extracted once both had it, task 11).
export function ResourceBadges({ resource }: { resource: ResourceDto }) {
	const t = useTranslation()
	const isAkutt = resource.categories.some((c) => c.slug === "nodtjenester")
	if (!isAkutt && !resource.isNational && !resource.isAlwaysOpen) return null
	return (
		<p className="flex flex-wrap gap-1">
			{isAkutt && <span className="badge badge-akutt">{t("badge.akutt")}</span>}
			{resource.isNational && <span className="badge text-muted">{t("badge.national")}</span>}
			{resource.isAlwaysOpen && <span className="badge text-accent">{t("badge.alwaysOpen")}</span>}
		</p>
	)
}
