import { useEffect, useState } from "react"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { applyTheme, currentTheme, type Theme } from "../services/theme.ts"

export function ThemeToggle() {
	const t = useTranslation()
	// "light" on the first render, prerendered or hydrated alike — the real theme lives on
	// document.documentElement, which doesn't exist yet during prerendering and would risk a
	// hydration mismatch if read synchronously. An effect syncs it right after mount.
	const [theme, setTheme] = useState<Theme>("light")
	useEffect(() => {
		setTheme(currentTheme())
	}, [])
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
