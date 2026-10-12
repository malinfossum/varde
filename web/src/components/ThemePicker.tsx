import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { SunIcon } from "./icons.tsx"
import { Picker } from "./Picker.tsx"
import { THEME_CHOICES, type ThemeApi, ThemeRows } from "./ThemeRows.tsx"

export function ThemePicker({ theme }: { theme: ThemeApi }) {
	const t = useTranslation()
	const { state } = theme
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
	const Icon = THEME_CHOICES.find((c) => c.choice === state?.choice)?.Icon ?? SunIcon
	return (
		<Picker name={t("header.theme")} value={value} icon={<Icon />}>
			{(closeAndFocus) => <ThemeRows theme={theme} icons onChosen={() => closeAndFocus()} />}
		</Picker>
	)
}
