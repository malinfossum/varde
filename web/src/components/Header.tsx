import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { BrandMark } from "./BrandMark.tsx"
import { LanguageToggle } from "./LanguageToggle.tsx"
import { Link } from "./Link.tsx"
import { QuickExit } from "./QuickExit.tsx"
import { ThemeToggle } from "./ThemeToggle.tsx"

export function Header() {
	const t = useTranslation()
	return (
		<header className="app-header border-b border-border bg-surface">
			{/* flex-wrap, no fixed height: at 320px the action row (language, theme, quick exit)
			    doesn't fit beside the wordmark, so it drops to its own line instead of forcing
			    horizontal scroll (WCAG reflow). Nothing shrinks below its 44px tap target and
			    nothing hides — this is spacing, not content loss. Wide viewports have room for
			    both on one row, same as before. */}
			<div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2">
				<Link
					to="/"
					className="inline-flex min-h-11 items-center gap-2 font-display text-lg text-fg no-underline"
					aria-label={t("header.home")}
				>
					<BrandMark className="h-6 w-6 text-accent" />
					<span>Varde</span>
				</Link>
				<div className="flex items-center gap-2">
					<LanguageToggle />
					<ThemeToggle />
					<QuickExit />
				</div>
			</div>
		</header>
	)
}
