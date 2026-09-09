// Runs before the stylesheet so the first paint is already the right theme. Mirrors
// src/services/theme.ts (resolveTheme / readStoredTheme) — it cannot import, so the test in
// tests/theme.test.ts evaluates this file against the same cases to keep them in step.
;(() => {
	var stored = null
	try {
		stored = window.localStorage.getItem("theme")
	} catch (_) {
		stored = null
	}
	var prefersDark =
		typeof window.matchMedia === "function" &&
		window.matchMedia("(prefers-color-scheme: dark)").matches
	var theme = stored === "dark" || stored === "light" ? stored : prefersDark ? "dark" : "light"
	document.documentElement.dataset.theme = theme
})()
