import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { BrandMark } from "./BrandMark.tsx"
import { HeaderLinks } from "./HeaderLinks.tsx"
import { HeaderMenu } from "./HeaderMenu.tsx"
import { HistoryButtons } from "./HistoryButtons.tsx"
import { LanguagePicker } from "./LanguagePicker.tsx"
import { Link } from "./Link.tsx"
import { QuickExit } from "./QuickExit.tsx"
import type { ThemeApi } from "./ThemeRows.tsx"

export function Header({ theme, atLanding }: { theme: ThemeApi; atLanding: boolean }) {
	const t = useTranslation()
	return (
		<header className="app-header border-b border-border bg-surface">
			{/* One row at every width (spec: Header). DOM order is history icons (installed app, from
			    1024 px), brand, nav, language picker, Meny, exit. CSS shows the nav and the language
			    picker from 1024 px and the Meny below it, never both, so the keyboard meets only the
			    one on screen. flex-wrap is a safety net only: the header check holds it to one row at
			    default text size, and with text at 200 % it wraps rather than scrolling sideways
			    (spec: The header row rule). */}
			<div className="header-row mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-2">
				<HistoryButtons layout="icons" atLanding={atLanding} />
				<Link
					to="/"
					className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 font-display text-lg text-fg no-underline"
					aria-label={t("header.home")}
				>
					<BrandMark className="h-8 w-8 text-accent" />
					<span className="brand-word">Varde</span>
				</Link>
				<nav aria-label={t("header.navLabel")} className="header-nav">
					<HeaderLinks className="nav-link" />
				</nav>
				<div className="header-tools">
					<LanguagePicker />
				</div>
				<HeaderMenu theme={theme} />
				<QuickExit />
			</div>
		</header>
	)
}
