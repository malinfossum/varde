import { useEffect, useState } from "react"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { type HandoverVariant, handoverVariant } from "../services/hoursRule.ts"

// 116 117 copied from api/Varde.Data/Seed/SeedData.cs row 3 (Legevakt).
const LEGEVAKT_PHONE = "116 117"

export function HandoverBanner() {
	const t = useTranslation()
	// null on the first render, prerendered or hydrated alike — the real clock only exists in
	// the browser, so the first paint can't pick fastlege vs legevakt without risking a
	// hydration mismatch. An effect fills in the real variant right after mount, then again
	// whenever the tab regains visibility (an app left open across 15:00 must not keep
	// pointing at a closed fastlege). Not aria-live; it changes only at these moments.
	const [variant, setVariant] = useState<HandoverVariant | null>(null)
	useEffect(() => {
		const update = () => {
			if (!document.hidden) setVariant(handoverVariant(new Date()))
		}
		update()
		document.addEventListener("visibilitychange", update)
		return () => document.removeEventListener("visibilitychange", update)
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
					{/* The only link on the site that sits inside running text: underlined so it is
					    told apart from the sentence by more than colour (axe link-in-text-block). */}
					<a href="https://www.helsenorge.no" rel="noopener noreferrer" className="underline">
						{t("banner.fastlegeLink")}
					</a>
				</p>
			)}
			<p>{legevaktLink}</p>
		</aside>
	)
}
