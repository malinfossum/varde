import { useArrivalFocus } from "../hooks/useArrivalFocus.ts"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { CATEGORY_SLUGS } from "../services/categories.ts"
import { emergencyLines, telHref } from "../services/emergency.ts"
import { Helplines } from "./Helplines.tsx"
import { LandingSearch } from "./LandingSearch.tsx"
import { Link } from "./Link.tsx"
import { PageHead } from "./PageHead.tsx"

// Copied from README "Data verification" section (first scheduled pass, docs/superpowers/specs/
// 2026-08-12-varde-design.md). Update it there and here together. Six months after the seed
// pass (LastVerified 2026-08-13/08-17), so 2027 — the spec's original 2026 was a typo I
// corrected on 2026-09-09.
const NEXT_VERIFICATION_PASS = "2027-02-17"

const GRID_SLUGS = CATEGORY_SLUGS.filter((s) => s !== "nodtjenester")

const titles = {
	nb: "Varde – finn riktig hjelpetjeneste",
	en: "Varde – find the right help service",
}

export function LandingPage({ arrival }: { arrival: number }) {
	const { lang } = useLanguage()
	const t = useTranslation()
	const { ref } = useArrivalFocus<HTMLHeadingElement>(arrival, true)
	return (
		<div className="landing">
			<PageHead title={titles[lang]} description={t("landing.subtitle")} path="/" />
			{/* Two columns from 1024 px (decided 2026-10-02 so the page fits one 950 px screen):
			    finding help on the left, calling for it on the right. Under 1024 px they stack. */}
			<div className="landing-columns grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-10">
				<section className="hero relative py-6 text-center lg:py-4 lg:text-left">
					<p className="entrance text-xs uppercase tracking-[0.24em] text-muted">
						{t("landing.eyebrow")}
					</p>
					<h1
						ref={ref}
						tabIndex={-1}
						className="mx-auto mt-3 max-w-2xl text-4xl leading-[1.1] text-balance md:text-6xl lg:mx-0"
					>
						{t("landing.headline")}
					</h1>
					<p className="entrance entrance-2 mx-auto mt-4 max-w-xl text-muted lg:mx-0">
						{t("landing.subtitle")}
					</p>
					<div className="entrance entrance-3 mt-6">
						<LandingSearch />
					</div>
					<p className="entrance entrance-4 mt-6 text-xs uppercase tracking-[0.18em] text-muted">
						{t("landing.browse")}
					</p>
					<div className="entrance entrance-5 mt-3 grid gap-2">
						<Link
							to="/sok?category=nodtjenester"
							className="chip chip-acute justify-self-center lg:justify-self-start"
						>
							{t("category.nodtjenester")}
						</Link>
						<ul className="chip-grid grid grid-cols-2 gap-2 md:grid-cols-4">
							{GRID_SLUGS.map((slug) => (
								<li key={slug}>
									<Link to={`/sok?category=${slug}`} className="chip w-full">
										{t(`category.${slug}`)}
									</Link>
								</li>
							))}
						</ul>
					</div>
				</section>

				<div className="landing-help grid gap-6 border-t border-border pt-6 lg:border-0 lg:py-4">
					<section aria-labelledby="emergency">
						<h2 id="emergency" className="text-2xl">
							{t("landing.emergencyHeading")}
						</h2>
						<p className="mt-2 text-muted">{t("landing.emergencyIntro")}</p>
						<ul className="mt-3 grid grid-cols-2 gap-3">
							{emergencyLines.map((line) => (
								<li key={line.id}>
									<a href={telHref(line.phone)} className="btn-primary h-full w-full text-lg">
										{line.phone} <span className="font-normal">{t(`strip.${line.id}`)}</span>
									</a>
								</li>
							))}
						</ul>
					</section>
					<Helplines />
				</div>
			</div>

			<section
				aria-labelledby="trust"
				className="grid gap-4 border-t border-border py-8 md:grid-cols-3"
			>
				<h2 id="trust" className="visually-hidden">
					{t("landing.trustHeading")}
				</h2>
				<p className="text-sm text-muted">{t("landing.trustNoTracking")}</p>
				<p className="text-sm text-muted">{t("landing.trustSources")}</p>
				<p className="text-sm text-muted">
					{t("landing.trustVerified").replace("{date}", NEXT_VERIFICATION_PASS)}
				</p>
			</section>
		</div>
	)
}
