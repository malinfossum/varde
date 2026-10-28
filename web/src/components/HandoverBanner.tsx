import { useSyncExternalStore } from "react"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { type HandoverVariant, handoverVariant } from "../services/hoursRule.ts"

// 116 117 copied from api/Varde.Data/Seed/SeedData.cs row 3 (Legevakt).
const LEGEVAKT_PHONE = "116 117"

function subscribe(onChange: () => void): () => void {
	document.addEventListener("visibilitychange", onChange)
	return () => document.removeEventListener("visibilitychange", onChange)
}

const readClock = (): HandoverVariant => handoverVariant(new Date())

export function HandoverBanner() {
	const t = useTranslation()
	// null in the prerender and on the hydrating render: the real clock only exists in the
	// browser, so the first paint can't pick fastlege vs legevakt without risking a hydration
	// mismatch. React reads the clock right after hydration, and again whenever the tab regains
	// visibility (an app left open across 15:00 must not keep pointing at a closed fastlege).
	// A mount on the client after that (Back to /sok) reads it on its first render: ListPage
	// restores the scroll in an effect, and a fastlege line arriving one render later pushed
	// the list down under it. Not aria-live; it changes only at these moments.
	const variant = useSyncExternalStore(subscribe, readClock, () => null)

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
