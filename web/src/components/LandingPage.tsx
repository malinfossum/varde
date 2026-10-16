import { useArrivalFocus } from "../hooks/useArrivalFocus.ts"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { CATEGORY_SLUGS } from "../services/categories.ts"
import { emergencyLines, telHref } from "../services/emergency.ts"
import { Helplines } from "./Helplines.tsx"
import { LandingSearch } from "./LandingSearch.tsx"
import { Link } from "./Link.tsx"
import { PageHead } from "./PageHead.tsx"

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
			{/* The phone layout scaled up (decided 2026-10-15, replaces the 10-02 two columns): the
			    hero is centred at every width. Below it, calling for help and someone to talk to stack
			    under 1024 px and sit side by side from 1024 px, split by a divider either way, since
			    the helplines are not emergency services. From 1024 px the page fits one 1920 x 950
			    screen (decided 2026-10-15): one-line heading, no eyebrow, Nødtjenester beside the grid
			    and tighter spacing. Every gap grows with the window height (--air in main.css, 2026-10-16)
			    and the help sections are a step smaller, so the search and the chips lead the page. */}
			<section className="hero relative py-6 text-center lg:pt-[calc(0.25rem+var(--air)*4)] lg:pb-0">
				<p className="entrance text-xs uppercase tracking-[0.24em] text-muted lg:hidden">
					{t("landing.eyebrow")}
				</p>
				<h1
					ref={ref}
					tabIndex={-1}
					className="mx-auto mt-3 max-w-2xl text-4xl leading-[1.1] text-balance md:text-6xl lg:mt-0 lg:max-w-none"
				>
					{t("landing.headline")}
				</h1>
				<p className="entrance entrance-2 mx-auto mt-4 max-w-xl text-muted lg:mt-[calc(1rem+var(--air)*0.5)]">
					{t("landing.subtitle")}
				</p>
				<div className="entrance entrance-3 mt-6 lg:mt-[calc(0.75rem+var(--air))]">
					<LandingSearch />
				</div>
				<p className="entrance entrance-4 mt-6 lg:mt-[calc(0.75rem+var(--air))] text-xs uppercase tracking-[0.18em] text-muted">
					{t("landing.browse")}
				</p>
				<div className="entrance entrance-5 mx-auto mt-3 grid max-w-3xl gap-2 lg:mt-2 lg:max-w-4xl lg:grid-cols-[auto_1fr] lg:items-center">
					<Link
						to="/sok?category=nodtjenester"
						className="chip chip-acute justify-self-center lg:justify-self-end"
					>
						{t("category.nodtjenester")}
					</Link>
					<ul className="chip-grid grid grid-cols-2 gap-2 md:grid-cols-4">
						{GRID_SLUGS.map((slug) => (
							<li key={slug}>
								<Link to={`/sok?category=${slug}`} className="chip h-full w-full">
									{t(`category.${slug}`)}
								</Link>
							</li>
						))}
					</ul>
				</div>
			</section>

			{/* The divider spans the page; the two help sections sit in a narrower block under it,
			    narrower than the chip row, so the search and the chips lead (2026-10-16). From 1024 px
			    the emergency numbers stack as one list, which leaves the helplines the wider column. */}
			<div className="landing-help mt-6 border-t border-border pt-6 lg:mt-[calc(1rem+var(--air)*4)] lg:pt-[calc(1rem+var(--air))] lg:pb-[var(--air)]">
				<div className="grid lg:mx-auto lg:max-w-3xl lg:grid-cols-[2fr_3fr] lg:items-start">
					<section aria-labelledby="emergency" className="lg:pr-8">
						<h2 id="emergency" className="text-2xl lg:text-xl">
							{t("landing.emergencyHeading")}
						</h2>
						<p className="mt-2 text-muted lg:mt-1 lg:text-sm">{t("landing.emergencyIntro")}</p>
						{/* All four buttons share one height (auto-rows-fr). The number and its label sit on
						    one line when they fit and wrap as two whole pieces when they do not. */}
						<ul className="mt-3 grid auto-rows-fr grid-cols-2 gap-3 lg:mt-2 lg:grid-cols-1 lg:gap-2">
							{emergencyLines.map((line) => (
								<li key={line.id}>
									<a
										href={telHref(line.phone)}
										className="btn-primary h-full w-full flex-wrap gap-x-2 gap-y-0 px-2 py-1.5 text-center text-lg lg:text-base"
									>
										<span className="whitespace-nowrap">{line.phone}</span>{" "}
										<span className="text-base font-normal text-balance lg:text-sm">
											{t(`strip.short.${line.id}`)}
										</span>
									</a>
								</li>
							))}
						</ul>
					</section>
					<Helplines className="mt-8 border-t border-border pt-8 lg:mt-0 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8" />
				</div>
			</div>
		</div>
	)
}
