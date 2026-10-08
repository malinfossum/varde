import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { HELSENORGE_URL, NAV_URL } from "../services/externalLinks.ts"
import { BrandMark } from "./BrandMark.tsx"
import { LanguagePicker } from "./LanguagePicker.tsx"
import { Link } from "./Link.tsx"
import { QuickExit } from "./QuickExit.tsx"
import { ThemeToggle } from "./ThemeToggle.tsx"

// Same tab on purpose (spec: Header). The arrow is decoration; the hidden text says it.
function ExternalMark() {
	const t = useTranslation()
	return (
		<>
			<span aria-hidden="true">↗</span>
			{/* No leading space: the space before <ExternalMark /> in the link already separates
			    the words, so the name reads "Helsenorge (ekstern side)" with one space. */}
			<span className="visually-hidden">{t("header.external")}</span>
		</>
	)
}

export function Header() {
	const t = useTranslation()
	return (
		<header className="app-header border-b border-border bg-surface">
			{/* DOM order is the desktop order from the spec: brand, nav, pickers, exit. Under
			    1024 px the nav drops to a row of its own below (CSS order), and under 768 px the
			    tools wrap below the brand too (three rows, measured), so a phone's keyboard order
			    runs brand, nav, then the rows above; I keep one DOM order rather than two.
			    flex-wrap keeps 320 px free of horizontal scroll, and every control keeps 44 px. */}
			<div className="header-row mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2">
				<Link
					to="/"
					className="inline-flex min-h-11 items-center gap-2 font-display text-lg text-fg no-underline"
					aria-label={t("header.home")}
				>
					<BrandMark className="h-8 w-8 text-accent" />
					<span>Varde</span>
				</Link>
				<nav aria-label={t("header.navLabel")} className="header-nav">
					<Link to="/sok" className="nav-link">
						{t("header.allServices")}
					</Link>
					<a href={HELSENORGE_URL} className="nav-link">
						Helsenorge <ExternalMark />
					</a>
					<a href={NAV_URL} className="nav-link">
						NAV <ExternalMark />
					</a>
				</nav>
				<div className="header-tools">
					<LanguagePicker />
					<ThemeToggle />
					<QuickExit />
				</div>
			</div>
		</header>
	)
}
