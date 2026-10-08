import { useArrivalFocus } from "../hooks/useArrivalFocus.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { generalReportHref, REPORT_ADDRESS } from "../services/contactActions.ts"
import { PageHead } from "./PageHead.tsx"

// The day the about.* text last changed. Bump it in the same commit as any edit to those
// strings, in both languages.
export const ABOUT_UPDATED = "2026-10-08"

const plainSections = [
	["what", "about.whatHeading", "about.whatBody"],
	["not", "about.notHeading", "about.notBody"],
	["sources", "about.sourcesHeading", "about.sourcesBody"],
	["liability", "about.liabilityHeading", "about.liabilityBody"],
] as const

export function AboutPage({ arrival }: { arrival: number }) {
	const t = useTranslation()
	const { ref } = useArrivalFocus<HTMLHeadingElement>(arrival, true)
	const [beforeAddress, afterAddress] = t("about.reportBody").split("{address}")
	return (
		<article className="about mx-auto grid max-w-prose gap-6">
			<PageHead title={t("about.pageTitle")} description={t("about.description")} path="/om" />
			<h1 ref={ref} tabIndex={-1} className="text-4xl">
				{t("about.heading")}
			</h1>
			{plainSections.map(([id, heading, body]) => (
				<section key={id} aria-labelledby={`about-${id}`} className="grid gap-2">
					<h2 id={`about-${id}`} className="text-2xl">
						{t(heading)}
					</h2>
					<p>{t(body)}</p>
				</section>
			))}
			{/* The footer's "Meld feil" link lands here. The address is plain text so it can be
			    copied on a device with no mail app, where a bare mailto: link does nothing. */}
			<section aria-labelledby="meld-feil" className="grid gap-2">
				<h2 id="meld-feil" className="text-2xl">
					{t("about.reportHeading")}
				</h2>
				<p>
					{beforeAddress}
					<strong className="select-all">{REPORT_ADDRESS}</strong>
					{afterAddress}
				</p>
				<p>
					<a
						href={generalReportHref(t("about.reportSubject"))}
						className="inline-flex min-h-11 items-center"
					>
						{t("about.reportLink")}
					</a>
				</p>
			</section>
			<section aria-labelledby="about-privacy" className="grid gap-2">
				<h2 id="about-privacy" className="text-2xl">
					{t("about.privacyHeading")}
				</h2>
				<p>{t("about.privacyBody")}</p>
			</section>
			<section aria-labelledby="about-source" className="grid gap-2">
				<h2 id="about-source" className="text-2xl">
					{t("about.sourceHeading")}
				</h2>
				<p>{t("about.sourceBody")}</p>
				<p>
					<a
						href="https://github.com/malinfossum/varde"
						rel="noopener noreferrer"
						className="inline-flex min-h-11 items-center"
					>
						{t("footer.source")}
					</a>
				</p>
			</section>
			<p className="text-sm text-muted">{t("about.updated").replace("{date}", ABOUT_UPDATED)}</p>
		</article>
	)
}
