import type { useThemeChoice } from "../hooks/useThemeChoice.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { CheckIcon, MoonIcon, SunIcon, SystemIcon } from "./icons.tsx"

export type ThemeApi = ReturnType<typeof useThemeChoice>

export const THEME_CHOICES = [
	{ choice: "light", key: "header.themeLight", Icon: SunIcon },
	{ choice: "dark", key: "header.themeDark", Icon: MoonIcon },
	{ choice: "system", key: "header.themeSystem", Icon: SystemIcon },
] as const

// One source for the theme rows, rendered only in the Meny (the footer pill has its own
// buttons). The Meny keeps the row focused so a screen reader hears its new pressed state,
// and announces the label it gets.
export function ThemeRows({
	theme,
	icons,
	onChosen,
}: {
	theme: ThemeApi
	icons: boolean
	onChosen: (row: HTMLButtonElement, label: string) => void
}) {
	const t = useTranslation()
	return (
		<>
			{THEME_CHOICES.map(({ choice, key, Icon }) => {
				const pressed = theme.state?.choice === choice
				return (
					<button
						key={choice}
						type="button"
						className="picker-row"
						aria-pressed={pressed}
						onClick={(event) => {
							theme.choose(choice)
							onChosen(event.currentTarget, t(key))
						}}
					>
						{icons && <Icon />}
						<span>{t(key)}</span>
						{pressed && <CheckIcon className="picker-check" />}
					</button>
				)
			})}
		</>
	)
}
