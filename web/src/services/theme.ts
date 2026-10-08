export type Theme = "light" | "dark"
const STORAGE_KEY = "theme"

export function resolveTheme(stored: string | null, prefersDark: boolean): Theme {
	if (stored === "dark" || stored === "light") return stored
	return prefersDark ? "dark" : "light"
}

// Some private-browsing modes throw on any localStorage access. Reading through this guard
// means the worst case is "no stored preference", never a dead page.
export function readStoredTheme(storage: Pick<Storage, "getItem"> | undefined): string | null {
	try {
		return storage?.getItem(STORAGE_KEY) ?? null
	} catch {
		return null
	}
}

export type ThemeChoice = Theme | "system"

export function readChoice(storage: Pick<Storage, "getItem"> | undefined): ThemeChoice {
	const stored = readStoredTheme(storage)
	return stored === "light" || stored === "dark" ? stored : "system"
}

export function systemPrefersDark(): boolean {
	return (
		typeof window.matchMedia === "function" &&
		window.matchMedia("(prefers-color-scheme: dark)").matches
	)
}

// Shows a choice without storing it: on mount, and when the OS or another tab changes.
export function showChoice(choice: ThemeChoice): Theme {
	const theme = resolveTheme(choice === "system" ? null : choice, systemPrefersDark())
	document.documentElement.dataset.theme = theme
	return theme
}

// Lyst and Mørkt store the choice; System removes the key, so the inline init script in
// index.html falls back to prefers-color-scheme on the next load. Same key as before, so the
// init script and its CSP hash do not change (spec: Theme picker).
export function chooseTheme(choice: ThemeChoice): Theme {
	try {
		if (choice === "system") window.localStorage.removeItem(STORAGE_KEY)
		else window.localStorage.setItem(STORAGE_KEY, choice)
	} catch {
		// Storage unavailable: the choice lives for this page only.
	}
	return showChoice(choice)
}
