import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { useAnnounce } from "./StatusRegion.tsx"
import { THEME_CHOICES, type ThemeApi } from "./ThemeRows.tsx"

// Light to dark with System between them, so the pill reads as a scale. The Meny
// keeps THEME_CHOICES' own order (Lyst, Mørkt, System).
const PILL = [THEME_CHOICES[0], THEME_CHOICES[2], THEME_CHOICES[1]] as const

// The theme switcher in the footer (spec: The theme pill). Three pressed-state buttons, the same
// model as the Meny's theme rows. Before mount the state is null and nothing is pressed, so the
// prerendered HTML and the first browser render match.
export function ThemePill({ theme, onTip }: { theme: ThemeApi; onTip: () => void }) {
	const t = useTranslation()
	const announce = useAnnounce()
	const { state } = theme
	return (
		// biome-ignore lint/a11y/useSemanticElements: a fieldset would bring its UA border and legend box into the pill
		<div role="group" aria-label={t("header.theme")} className="theme-pill">
			{PILL.map(({ choice, key, Icon }, index) => {
				const pressed = state?.choice === choice
				let tip = t(key)
				// The System tooltip says what System is right now, once the browser knows.
				if (choice === "system" && state) {
					tip += ` (${t(state.theme === "dark" ? "header.themeResolvedDark" : "header.themeResolvedLight")})`
				}
				const edge = index === PILL.length - 1 ? " footer-tip-end" : ""
				return (
					<button
						key={choice}
						type="button"
						aria-pressed={pressed}
						className="theme-pill-btn footer-tip-host"
						onPointerEnter={onTip}
						onFocus={onTip}
						onClick={() => {
							if (pressed) return
							theme.choose(choice)
							announce(`${t("header.theme")}: ${t(key)}`)
						}}
					>
						<Icon />
						<span className="visually-hidden">{t(key)}</span>
						<span className={`footer-tip${edge}`} aria-hidden="true">
							<span className="footer-tip-bubble">{tip}</span>
						</span>
					</button>
				)
			})}
		</div>
	)
}
