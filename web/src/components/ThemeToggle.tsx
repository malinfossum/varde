import { useState } from "react"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { applyTheme, currentTheme } from "../services/theme.ts"

export function ThemeToggle() {
	const t = useTranslation()
	const [theme, setTheme] = useState(currentTheme)
	const next = theme === "dark" ? "light" : "dark"
	const onToggle = () => {
		applyTheme(next)
		setTheme(next)
	}
	// The name says what the button does, not what the state is: "Mørkt tema" while light.
	return (
		<button
			type="button"
			className="btn-secondary min-w-11"
			aria-pressed={theme === "dark"}
			onClick={onToggle}
		>
			<span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
			<span className="hidden md:inline">
				{t(next === "dark" ? "header.themeDark" : "header.themeLight")}
			</span>
			<span className="visually-hidden md:hidden">
				{t(next === "dark" ? "header.themeDark" : "header.themeLight")}
			</span>
		</button>
	)
}
