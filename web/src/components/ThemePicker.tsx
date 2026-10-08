import { useThemeChoice } from "../hooks/useThemeChoice.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { CheckIcon, MoonIcon, SunIcon, SystemIcon } from "./icons.tsx"
import { Picker } from "./Picker.tsx"

const CHOICES = [
	{ choice: "light", key: "header.themeLight", Icon: SunIcon },
	{ choice: "dark", key: "header.themeDark", Icon: MoonIcon },
	{ choice: "system", key: "header.themeSystem", Icon: SystemIcon },
] as const

export function ThemePicker() {
	const t = useTranslation()
	const { state, choose } = useThemeChoice()
	let value: string | null = null
	if (state?.choice === "system") {
		const resolved = t(
			state.theme === "dark" ? "header.themeResolvedDark" : "header.themeResolvedLight"
		)
		value = `${t("header.themeSystem")} (${resolved})`
	} else if (state) {
		value = t(state.choice === "dark" ? "header.themeDark" : "header.themeLight")
	}
	// Before mount (state null) the icon is the sun on the server and in the browser alike.
	const Icon = CHOICES.find((c) => c.choice === state?.choice)?.Icon ?? SunIcon
	return (
		<Picker name={t("header.theme")} value={value} icon={<Icon />}>
			{(closeAndFocus) =>
				CHOICES.map(({ choice, key, Icon: RowIcon }) => {
					const pressed = state?.choice === choice
					return (
						<button
							key={choice}
							type="button"
							className="picker-row"
							aria-pressed={pressed}
							onClick={() => {
								choose(choice)
								closeAndFocus()
							}}
						>
							<RowIcon />
							<span>{t(key)}</span>
							{pressed && <CheckIcon className="picker-check" />}
						</button>
					)
				})
			}
		</Picker>
	)
}
