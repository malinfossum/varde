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

export function currentTheme(): Theme {
	return document.documentElement.dataset.theme === "dark" ? "dark" : "light"
}

export function applyTheme(theme: Theme): void {
	document.documentElement.dataset.theme = theme
	try {
		window.localStorage.setItem(STORAGE_KEY, theme)
	} catch {
		// Storage unavailable: the choice lives for this page only.
	}
}
