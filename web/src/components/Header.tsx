import { useThemeChoice } from "../hooks/useThemeChoice.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { BrandMark } from "./BrandMark.tsx"
import { HeaderLinks } from "./HeaderLinks.tsx"
import { LanguagePicker } from "./LanguagePicker.tsx"
import { Link } from "./Link.tsx"
import { QuickExit } from "./QuickExit.tsx"
import { ThemePicker } from "./ThemePicker.tsx"

export function Header() {
	const t = useTranslation()
	// One theme state for the desktop picker and the Meny, so a choice made in one is already
	// shown in the other when the window crosses 1024 px.
	const theme = useThemeChoice()
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
					<HeaderLinks className="nav-link" />
				</nav>
				<div className="header-tools">
					<LanguagePicker />
					<ThemePicker theme={theme} />
					<QuickExit />
				</div>
			</div>
		</header>
	)
}
