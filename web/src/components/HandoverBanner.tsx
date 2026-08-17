import { useEffect, useState } from "react"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { type HandoverVariant, handoverVariant } from "../services/hoursRule.ts"

// 116 117 copied from api/Varde.Data/Seed/SeedData.cs row 3 (Legevakt).
const LEGEVAKT_PHONE = "116 117"

export function HandoverBanner() {
	const t = useTranslation()
	const [variant, setVariant] = useState<HandoverVariant>(() => handoverVariant(new Date()))

	// Recompute when the tab regains visibility — an app left open across 15:00 must not
	// keep pointing at a closed fastlege. Not aria-live; it changes only at these moments.
	useEffect(() => {
		const onVisibility = () => {
			if (!document.hidden) setVariant(handoverVariant(new Date()))
		}
		document.addEventListener("visibilitychange", onVisibility)
		return () => document.removeEventListener("visibilitychange", onVisibility)
	}, [])

	const legevaktLink = (
		<a href="tel:116117">
			{variant === "fastlege" ? t("banner.fallback") : `${t("banner.legevakt")} ${LEGEVAKT_PHONE}`}
		</a>
	)

	return (
		<aside className="handover-banner">
			{variant === "fastlege" && (
				<p>
					{t("banner.fastlege")}{" "}
					<a href="https://www.helsenorge.no" rel="noopener noreferrer">
						{t("banner.fastlegeLink")}
					</a>
				</p>
			)}
			<p>{legevaktLink}</p>
		</aside>
	)
}
