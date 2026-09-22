import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test, vi } from "vitest"
import { applyTheme, readStoredTheme, resolveTheme } from "../src/services/theme.ts"
import { legacyRedirect } from "../src/services/urlState.ts"

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

// The init script is inline in index.html (first paint must not wait on a second request) and
// cannot import the services it mirrors, so these tests evaluate the shipped text against the
// same cases. jsdom replaces the global URL constructor, and on Windows that replacement
// mis-resolves a relative path against a file:// base, so I go through node:path/node:url
// instead of `new URL("../index.html", import.meta.url)` (same fix as tokens.test.ts).
function inlineInitScript() {
	const htmlPath = join(dirname(fileURLToPath(import.meta.url)), "../index.html")
	const html = readFileSync(htmlPath, "utf8")
	const start = html.indexOf("<script>")
	const end = html.indexOf("</script>", start)
	if (start === -1 || end === -1) throw new Error("index.html has no inline <script>")
	return html.slice(start + "<script>".length, end)
}

test("the inline init script agrees with resolveTheme", () => {
	const script = inlineInitScript()
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

test("the inline init script redirects exactly like legacyRedirect", () => {
	const script = inlineInitScript()
	const run = (pathname: string, search: string, storedLang: string | null) => {
		const store = new Map<string, string>([["theme", "light"]])
		if (storedLang) store.set("varde.lang", storedLang)
		const replace = vi.fn()
		const fakeWindow = {
			localStorage: { getItem: (k: string) => store.get(k) ?? null },
			matchMedia: () => ({ matches: false }),
			location: { pathname, search, replace },
		}
		new Function("window", "document", script)(fakeWindow, document)
		return replace.mock.calls.length ? replace.mock.calls[0][0] : null
	}
	const cases: [string, string, string | null][] = [
		["/", "?lang=en", null],
		["/sok", "?lang=en&search=nav", null],
		["/resources/5", "?lang=nb", "en"],
		// The double-hop case: an explicit ?lang=nb on the bare landing page must not still
		// bounce to /en/ once the stripped-query navigation reloads with the stored "en"
		// preference in play — both mirrors must return null here, not "/".
		["/", "?lang=nb", "en"],
		["/", "?category=rus", null],
		["/", "", "en"],
		["/", "", null],
		["/en/", "", "en"],
		["/sok", "?search=nav", null],
	]
	for (const [pathname, search, stored] of cases) {
		expect(run(pathname, search, stored), `${pathname}${search} stored=${stored}`).toBe(
			legacyRedirect(pathname, search, stored)
		)
	}
})
