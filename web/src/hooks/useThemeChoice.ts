import { useEffect, useState } from "react"
import {
	chooseTheme,
	readChoice,
	showChoice,
	type Theme,
	type ThemeChoice,
} from "../services/theme.ts"

type ThemeState = { choice: ThemeChoice; theme: Theme }

// null until mount: the prerendered HTML cannot know the reader's theme, so the first render
// is the same on the server and in the browser, and the real value arrives in the effect.
export function useThemeChoice() {
	const [state, setState] = useState<ThemeState | null>(null)
	useEffect(() => {
		const sync = () => {
			const choice = readChoice(window.localStorage)
			setState({ choice, theme: showChoice(choice) })
		}
		sync()
		const media =
			typeof window.matchMedia === "function"
				? window.matchMedia("(prefers-color-scheme: dark)")
				: null
		// Follow the OS only while the choice is System.
		const onMedia = () => {
			if (readChoice(window.localStorage) === "system") sync()
		}
		// Another tab changed or cleared the key (a null key is storage.clear()).
		const onStorage = (event: StorageEvent) => {
			if (event.key === "theme" || event.key === null) sync()
		}
		media?.addEventListener("change", onMedia)
		window.addEventListener("storage", onStorage)
		return () => {
			media?.removeEventListener("change", onMedia)
			window.removeEventListener("storage", onStorage)
		}
	}, [])
	const choose = (choice: ThemeChoice) => setState({ choice, theme: chooseTheme(choice) })
	return { state, choose }
}
