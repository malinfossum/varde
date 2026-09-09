import { useArrivalFocus } from "../hooks/useArrivalFocus.ts"
import { useDocumentTitle } from "../hooks/useDocumentTitle.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { CATEGORY_SLUGS } from "../services/categories.ts"
import { emergencyLines, telHref } from "../services/emergency.ts"
import { LandingSearch } from "./LandingSearch.tsx"
import { Link } from "./Link.tsx"

// Copied from README "Data verification" section (first scheduled pass, docs/superpowers/specs/
// 2026-08-12-varde-design.md). Update it there and here together. Six months after the seed
// pass (LastVerified 2026-08-13/08-17), so 2027 — the spec's original 2026 was a typo I
// corrected on 2026-09-09.
const NEXT_VERIFICATION_PASS = "2027-02-17"

const chipOrder = ["nodtjenester", ...CATEGORY_SLUGS.filter((s) => s !== "nodtjenester")]

export function LandingPage({ arrival }: { arrival: number }) {
	const t = useTranslation()
	useDocumentTitle(t("title.app"))
	const { ref } = useArrivalFocus<HTMLHeadingElement>(arrival, true)
	return (
		<div className="landing">
			<section className="hero relative py-10 text-center md:py-16">
				<p className="entrance text-xs uppercase tracking-[0.24em] text-muted">
					{t("landing.eyebrow")}
				</p>
				<h1 ref={ref} tabIndex={-1} className="mx-auto mt-3 max-w-2xl text-4xl md:text-6xl">
					{t("landing.headline")}
				</h1>
				<p className="entrance entrance-2 mx-auto mt-4 max-w-md text-muted">
					{t("landing.subtitle")}
				</p>
				<div className="entrance entrance-3 mt-6">
					<LandingSearch />
				</div>
				<p className="entrance entrance-4 mt-6 text-xs uppercase tracking-[0.18em] text-muted">
					{t("landing.browse")}
				</p>
				<ul className="entrance entrance-5 mt-3 flex flex-wrap justify-center gap-2">
					{chipOrder.map((slug) => (
						<li key={slug}>
							<Link to={`/sok?category=${slug}`} className="btn-secondary rounded-full text-sm">
								{t(`category.${slug}`)}
							</Link>
						</li>
					))}
				</ul>
			</section>

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

			<section aria-labelledby="emergency" className="border-t border-border py-8">
				<h2 id="emergency" className="text-2xl">
					{t("landing.emergencyHeading")}
				</h2>
				<p className="mt-2 max-w-prose text-muted">{t("landing.emergencyIntro")}</p>
				<ul className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
					{emergencyLines.map((line) => (
						<li key={line.id}>
							<a href={telHref(line.phone)} className="btn-primary w-full text-lg">
								{line.phone} <span className="font-normal">{t(`strip.${line.id}`)}</span>
							</a>
						</li>
					))}
				</ul>
			</section>
		</div>
	)
}
