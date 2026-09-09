import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"
import { clearCatalogCache } from "../src/services/catalogCache.ts"

// @testing-library/react's auto-cleanup only registers itself when it finds a global
// `afterEach` (jest-style globals). This project doesn't enable vitest's `test.globals`,
// so without this, render() output accumulates in document.body across tests in the same
// file — the first symptom is a "multiple elements found" query failure once a file calls
// render() more than once (verified: tests/shell.test.tsx's two App renders).
afterEach(() => {
	cleanup()
	// Favourites/language preference live in localStorage; without this a value written by one
	// test (e.g. a language toggle) leaks into the next test file's initial render.
	localStorage.clear()
	// The catalog cache is a module-level singleton (shared by the landing and results pages
	// on purpose); without this a fetch mock installed by one test would still be "cached" for
	// the next test in the same file.
	clearCatalogCache()
})

// vitest 4.1.10's jsdom environment does not provide localStorage by default (verified: removing this breaks i18n storage tests).
// Minimal in-memory implementation, installed only when missing.
if (typeof window !== "undefined" && typeof window.localStorage === "undefined") {
	const store: Record<string, string> = {}
	const storage: Storage = {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => {
			store[key] = value.toString()
		},
		removeItem: (key: string) => {
			delete store[key]
		},
		clear: () => {
			for (const key of Object.keys(store)) {
				delete store[key]
			}
		},
		get length() {
			return Object.keys(store).length
		},
		key: (index: number) => Object.keys(store)[index] ?? null,
	}
	window.localStorage = storage
}

// jsdom does no layout and ships no scrollIntoView. ListPage calls it after paging; a no-op
// keeps that path runnable, and tests spy on it to assert the scroll happened.
Element.prototype.scrollIntoView ??= () => {}

// react-aria-components' popover positioning observes the trigger's size; jsdom has no
// ResizeObserver at all.
globalThis.ResizeObserver ??= class {
	observe() {}
	unobserve() {}
	disconnect() {}
} as unknown as typeof ResizeObserver
