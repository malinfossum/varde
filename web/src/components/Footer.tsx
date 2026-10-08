import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { emergencyLines, telHref } from "../services/emergency.ts"
import { pathFor } from "../services/urlState.ts"
import { Link } from "./Link.tsx"

// 113 comes from emergency.ts, which tests/emergency.test.ts checks against the seed.
const ambulance = emergencyLines.find((line) => line.id === "ambulanse")

export function Footer() {
	const t = useTranslation()
	const { lang } = useLanguage()
	return (
		<footer className="mt-6 border-t border-border">
			<div className="mx-auto grid max-w-6xl gap-1 px-4 py-3 text-sm text-muted">
				<p>
					{t("footer.liability")}{" "}
					{ambulance && (
						<a
							href={telHref(ambulance.phone)}
							className="inline-flex min-h-11 min-w-11 items-center justify-center font-semibold"
						>
							{ambulance.phone}
						</a>
					)}
					.
				</p>
				<p className="flex flex-wrap items-center gap-x-4">
					<Link to="/om" className="inline-flex min-h-11 items-center">
						{t("footer.about")}
					</Link>
					{/* A plain anchor, not <Link>: Link navigates by pathname and search only, so the
					    #meld-feil hash would be lost. A full load of the prerendered /om page lets the
					    browser scroll to the id itself. */}
					<a
						href={`${pathFor(lang, "/om")}#meld-feil`}
						className="inline-flex min-h-11 items-center"
					>
						{t("footer.report")}
					</a>
					<a
						href="https://github.com/malinfossum/varde"
						rel="noopener noreferrer"
						className="inline-flex min-h-11 items-center"
					>
						{t("footer.source")}
					</a>
					<span>{t("footer.noTracking")}</span>
				</p>
			</div>
		</footer>
	)
}
