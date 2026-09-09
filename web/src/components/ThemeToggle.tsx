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
	// One span carries the accessible name unconditionally; the md+ visible copy is
	// aria-hidden so a query on the name never sees the label twice (there's no real CSS in
	// the test environment to hide either copy the way a browser's media query would).
	const label = t(next === "dark" ? "header.themeDark" : "header.themeLight")
	return (
		<button
			type="button"
			className="btn-secondary min-w-11"
			aria-pressed={theme === "dark"}
			onClick={onToggle}
		>
			<span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
			<span aria-hidden="true" className="hidden md:inline">
				{label}
			</span>
			<span className="visually-hidden">{label}</span>
		</button>
	)
}
