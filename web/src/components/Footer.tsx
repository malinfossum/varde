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
				{/* The 113 link keeps the text tight (a normal word space each side) and gets its 44 x 44 px
				    target from an ::after box centred on the number. py-3 on this paragraph leaves room
				    for that box, so it does not overlap the links in the row underneath. */}
				<p className="py-3">
					{t("footer.liability")}{" "}
					{ambulance && (
						<a
							href={telHref(ambulance.phone)}
							className="relative inline-block font-semibold after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2"
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
