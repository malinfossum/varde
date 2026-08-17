import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// @testing-library/react's auto-cleanup only registers itself when it finds a global
// `afterEach` (jest-style globals). This project doesn't enable vitest's `test.globals`,
// so without this, render() output accumulates in document.body across tests in the same
// file — the first symptom is a "multiple elements found" query failure once a file calls
// render() more than once (verified: tests/shell.test.tsx's two App renders).
afterEach(() => {
	cleanup()
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
