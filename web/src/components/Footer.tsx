import { useId } from "react"
import { useDismissibleTips } from "../hooks/useDismissibleTips.ts"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { emergencyLines, telHref } from "../services/emergency.ts"
import { pathFor } from "../services/urlState.ts"
import { GitHubIcon } from "./icons.tsx"
import { Link } from "./Link.tsx"

// 113 comes from emergency.ts, which tests/emergency.test.ts checks against the seed.
const ambulance = emergencyLines.find((line) => line.id === "ambulanse")

// The footer (spec: docs/superpowers/specs/2026-10-16-varde-footer-design.md). One
// DOM order at every width: liability, the links, the note, then the icon controls. Below
// 1024 px it stacks; from 1280 px it is one 44 px row and stays 69 px tall, which the landing
// needs to fit one 1920 x 950 screen. Between 1024 and about 1100 px whole groups wrap.
export function Footer() {
	const t = useTranslation()
	const { lang } = useLanguage()
	const tips = useDismissibleTips()
	const labelId = useId()
	return (
		<footer className="mt-6 border-t border-border lg:mt-4">
			<div
				data-tips={tips.hidden ? "hidden" : undefined}
				className="footer-row mx-auto grid max-w-6xl gap-3 px-4 py-3 text-sm text-muted lg:flex lg:flex-wrap lg:items-center lg:justify-between lg:gap-x-6"
			>
				{/* The 113 link keeps the text tight (a normal word space each side) and gets its 44 x 44 px
				    target from an ::after box centred on the number. py-3 below 1024 px leaves room for
				    that box above the label. From 1024 px the sentence wraps to two lines inside the
				    44 px row. */}
				<p className="footer-liability py-3 lg:max-w-[17rem] lg:flex-none lg:py-0">
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
				{/* The label is visible below 1024 px and names the nav at every width. sr-only, not
				    .visually-hidden: Tailwind makes no lg: variant for a plain component class. */}
				<nav aria-labelledby={labelId} className="grid gap-1 lg:block">
					<span id={labelId} className="footer-label lg:sr-only">
						{t("footer.label")}
					</span>
					<span className="flex flex-wrap items-center gap-x-4 lg:gap-x-3">
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
					</span>
				</nav>
				{/* Two short lines of small text. The dot is decoration, so readers skip it;
				    the space between the lines keeps the words apart for them. */}
				<p className="footer-note lg:flex-none">
					<span className="block">
						© Varde <span aria-hidden="true">·</span> {t("footer.noTracking")}
					</span>{" "}
					<span className="block">{t("footer.noCookies")}</span>
				</p>
				<div className="footer-bar flex items-center justify-between lg:flex-none lg:gap-3">
					{/* -ml-3 below 1024 px lines the glyph up with the text edge; the 44 px target stays
					    whole. */}
					<a
						href="https://github.com/malinfossum/varde"
						rel="noopener noreferrer"
						onPointerEnter={tips.show}
						onFocus={tips.show}
						className="footer-tip-host -ml-3 inline-flex size-11 items-center justify-center text-muted hover:text-fg lg:ml-0"
					>
						<GitHubIcon />
						<span className="visually-hidden">{t("footer.source")}</span>
						<span className="footer-tip footer-tip-start" aria-hidden="true">
							<span className="footer-tip-bubble">{t("footer.source")}</span>
						</span>
					</a>
				</div>
			</div>
		</footer>
	)
}
