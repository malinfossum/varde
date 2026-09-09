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
			<div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
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
