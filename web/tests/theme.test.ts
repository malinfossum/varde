import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "vitest"
import { applyTheme, readStoredTheme, resolveTheme } from "../src/services/theme.ts"

test("stored value wins over the system preference", () => {
	expect(resolveTheme("dark", false)).toBe("dark")
	expect(resolveTheme("light", true)).toBe("light")
})

test("system preference decides when nothing is stored; light when neither", () => {
	expect(resolveTheme(null, true)).toBe("dark")
	expect(resolveTheme(null, false)).toBe("light")
	expect(resolveTheme("purple", false)).toBe("light")
})

test("a throwing storage reads as null instead of crashing", () => {
	const storage = {
		getItem: () => {
			throw new Error("SecurityError")
		},
	}
	expect(readStoredTheme(storage)).toBeNull()
	expect(readStoredTheme(undefined)).toBeNull()
})

test("applyTheme sets data-theme and survives a throwing storage", () => {
	const original = Object.getOwnPropertyDescriptor(window, "localStorage")
	Object.defineProperty(window, "localStorage", {
		configurable: true,
		get() {
			throw new Error("SecurityError")
		},
	})
	try {
		applyTheme("dark")
		expect(document.documentElement.dataset.theme).toBe("dark")
	} finally {
		if (original) Object.defineProperty(window, "localStorage", original)
	}
})

test("the public init script agrees with resolveTheme", () => {
	// The script cannot import the service, so this evaluates it against the same cases.
	// jsdom replaces the global URL constructor, and on Windows that replacement mis-resolves a
	// relative path against a file:// base, so I go through node:path/node:url instead of
	// `new URL("../public/theme-init.js", import.meta.url)` (same fix as tokens.test.ts).
	const scriptPath = join(dirname(fileURLToPath(import.meta.url)), "../public/theme-init.js")
	const script = readFileSync(scriptPath, "utf8")
	const run = (stored: string | null, prefersDark: boolean) => {
		document.documentElement.removeAttribute("data-theme")
		localStorage.clear()
		if (stored) localStorage.setItem("theme", stored)
		window.matchMedia = (() => ({ matches: prefersDark })) as unknown as typeof window.matchMedia
		new Function(script)()
		return document.documentElement.dataset.theme
	}
	expect(run(null, false)).toBe("light")
	expect(run(null, true)).toBe("dark")
	expect(run("dark", false)).toBe("dark")
	expect(run("light", true)).toBe("light")
})
