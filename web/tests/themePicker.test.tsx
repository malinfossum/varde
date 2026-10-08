import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test } from "vitest"
import { App } from "../src/App.tsx"
import { render as prerender } from "../src/entry-server.tsx"
import { stubDataFiles } from "./stubData.ts"

// jsdom has no matchMedia. This fake lets a test flip the OS preference and fire "change".
function fakeOsTheme(dark: boolean) {
	const state = { matches: dark }
	const listeners = new Set<() => void>()
	const query = {
		get matches() {
			return state.matches
		},
		addEventListener: (_: string, fn: () => void) => listeners.add(fn),
		removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
	}
	window.matchMedia = (() => query) as unknown as typeof window.matchMedia
	return {
		set(next: boolean) {
			state.matches = next
			for (const fn of listeners) fn()
		},
	}
}

afterEach(() => {
	Reflect.deleteProperty(window, "matchMedia")
	document.documentElement.removeAttribute("data-theme")
})

const name = (text: string) => screen.getByText(text, { selector: ".visually-hidden" })

test("with nothing stored, the trigger says System and the resolved theme", () => {
	fakeOsTheme(false)
	stubDataFiles()
	render(<App />)
	expect(name("Tema: System (lyst)")).toBeInTheDocument()
	expect(screen.getByRole("button", { name: "System" })).toHaveAttribute("aria-pressed", "true")
})

test("Mørkt stores the choice, applies it and returns focus to the trigger", async () => {
	fakeOsTheme(false)
	stubDataFiles()
	render(<App />)
	await userEvent.click(screen.getByRole("button", { name: "Mørkt" }))
	expect(localStorage.getItem("theme")).toBe("dark")
	expect(document.documentElement.dataset.theme).toBe("dark")
	expect(name("Tema: Mørkt")).toBeInTheDocument()
	expect(document.activeElement?.tagName).toBe("SUMMARY")
})

test("System removes the key and follows the OS live", async () => {
	const os = fakeOsTheme(false)
	localStorage.setItem("theme", "light")
	stubDataFiles()
	render(<App />)
	await userEvent.click(screen.getByRole("button", { name: "System" }))
	expect(localStorage.getItem("theme")).toBeNull()
	act(() => os.set(true))
	expect(document.documentElement.dataset.theme).toBe("dark")
	expect(name("Tema: System (mørkt)")).toBeInTheDocument()
})

test("a choice made in another tab is followed here", () => {
	fakeOsTheme(false)
	stubDataFiles()
	render(<App />)
	act(() => {
		localStorage.setItem("theme", "dark")
		window.dispatchEvent(new StorageEvent("storage", { key: "theme" }))
	})
	expect(document.documentElement.dataset.theme).toBe("dark")
	expect(name("Tema: Mørkt")).toBeInTheDocument()
})

// Chrome ("sites can't save data") and Firefox with cookies blocked throw from the
// window.localStorage getter itself. Restored before the shared afterEach clears storage.
function blockStorage() {
	const original = Object.getOwnPropertyDescriptor(window, "localStorage")
	Object.defineProperty(window, "localStorage", {
		configurable: true,
		get() {
			throw new Error("SecurityError")
		},
	})
	return () => {
		if (original) Object.defineProperty(window, "localStorage", original)
	}
}

test("with site data blocked, the page stays up and the trigger still renders", () => {
	fakeOsTheme(false)
	stubDataFiles()
	const restore = blockStorage()
	try {
		render(<App />)
		expect(name("Tema: System (lyst)")).toBeInTheDocument()
	} finally {
		restore()
	}
})

test("with site data blocked, Mørkt survives an OS change", async () => {
	const os = fakeOsTheme(true)
	stubDataFiles()
	const restore = blockStorage()
	try {
		render(<App />)
		await userEvent.click(screen.getByRole("button", { name: "Mørkt" }))
		act(() => os.set(false))
		expect(document.documentElement.dataset.theme).toBe("dark")
		expect(name("Tema: Mørkt")).toBeInTheDocument()
	} finally {
		restore()
	}
})

test("the prerendered trigger says only Tema, so hydration cannot mismatch", async () => {
	const { html } = await prerender("/", {})
	expect(html).toContain('<span class="visually-hidden">Tema</span>')
})
