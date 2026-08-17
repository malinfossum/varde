import "@testing-library/jest-dom/vitest"

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
