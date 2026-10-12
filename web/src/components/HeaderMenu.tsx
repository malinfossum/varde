import { useId } from "react"
import { usePicker } from "../hooks/usePicker.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { HeaderLinks } from "./HeaderLinks.tsx"
import { MenuIcon } from "./icons.tsx"
import { LanguageRows } from "./LanguageRows.tsx"
import { useAnnounce } from "./StatusRegion.tsx"
import { type ThemeApi, ThemeRows } from "./ThemeRows.tsx"

// Below 1024 px the three links and both pickers live here (spec: Below 1024 px: Meny). The
// picker shell and behaviour, with two differences: opening focuses the first row, and a theme
// row keeps the Meny open with focus on it, so a screen reader hears its new pressed state,
// and writes one status line as the confirmation.
// The trigger's name is the word itself, visible from 768 px and visually hidden below.
export function HeaderMenu({ theme }: { theme: ThemeApi }) {
	const t = useTranslation()
	const announce = useAnnounce()
	const { ref, onToggle, onKeyDown, onBlur, closeAndFocus } = usePicker({
		focusOnOpen: "first",
	})
	const languageId = useId()
	const themeId = useId()
	return (
		// The Meny's own landmark, with the desktop nav's name. CSS shows one of the two, so a
		// screen reader finds one navigation landmark at every width.
		<nav aria-label={t("header.navLabel")} className="menu-nav">
			<details
				ref={ref}
				className="picker header-menu"
				onToggle={onToggle}
				onKeyDown={onKeyDown}
				onBlur={onBlur}
			>
				<summary className="btn-secondary min-w-11">
					<span aria-hidden="true" className="inline-flex">
						<MenuIcon />
					</span>
					<span className="menu-word">{t("header.menu")}</span>
				</summary>
				<div className="picker-list menu-list">
					<div className="menu-group">
						{/* Every link closes the Meny and returns focus to the trigger, never into a
						    closed list. A route change then moves focus on to the new heading; a link
						    to the route already shown, or a new tab, leaves it on the trigger. */}
						<HeaderLinks className="picker-row" onFollow={closeAndFocus} />
					</div>
					{/* biome-ignore lint/a11y/useSemanticElements: Workbench picker markup, as in Picker.tsx */}
					<div className="menu-group" role="group" aria-labelledby={languageId}>
						<span id={languageId} className="menu-group-label">
							{t("header.language")}
						</span>
						<LanguageRows onDone={closeAndFocus} />
					</div>
					{/* biome-ignore lint/a11y/useSemanticElements: Workbench picker markup, as in Picker.tsx */}
					<div className="menu-group" role="group" aria-labelledby={themeId}>
						<span id={themeId} className="menu-group-label">
							{t("header.theme")}
						</span>
						{/* Safari does not focus a button on click, so the row is focused explicitly.
						    The status line is the confirmation; the pressed state alone is not
						    reliably spoken (spec: Below 1024 px: Meny, Behaviour). */}
						<ThemeRows
							theme={theme}
							icons={false}
							onChosen={(row, label) => {
								row.focus()
								announce(`${t("header.theme")}: ${label}`)
							}}
						/>
					</div>
				</div>
			</details>
		</nav>
	)
}
