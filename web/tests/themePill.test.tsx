import { act, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test } from "vitest"
import { App } from "../src/App.tsx"
import { render as prerender } from "../src/entry-server.tsx"
import { menu } from "./scope.ts"
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

afterEach(() => {
	Reflect.deleteProperty(window, "matchMedia")
	document.documentElement.removeAttribute("data-theme")
	window.history.replaceState(null, "", "/")
})

// The Meny holds a group named Tema too, so the pill is found inside the footer.
const pill = (name = "Tema") =>
	within(within(screen.getByRole("contentinfo")).getByRole("group", { name }))
const tip = (button: HTMLElement) => button.querySelector(".footer-tip")?.textContent

test("three buttons, Lyst, System, Mørkt; with nothing stored System is pressed", () => {
	fakeOsTheme(false)
	stubDataFiles()
	render(<App />)
	const buttons = pill().getAllByRole("button") as [HTMLElement, HTMLElement, HTMLElement]
	expect(buttons).toHaveLength(3)
	expect(buttons[0]).toHaveAccessibleName("Lyst")
	expect(buttons[1]).toHaveAccessibleName("System")
	expect(buttons[2]).toHaveAccessibleName("Mørkt")
	expect(buttons[1]).toHaveAttribute("aria-pressed", "true")
	expect(buttons[0]).toHaveAttribute("aria-pressed", "false")
	expect(tip(buttons[1])).toBe("System (lyst)")
	expect(buttons[2].querySelector(".footer-tip")).toHaveClass("footer-tip-end")
})

test("the English pill is named Theme, with Light, System and Dark", () => {
	fakeOsTheme(false)
	stubDataFiles()
	window.history.replaceState(null, "", "/en/")
	render(<App />)
	const buttons = pill("Theme").getAllByRole("button")
	expect(buttons.map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "true", "false"])
	expect(buttons[0]).toHaveAccessibleName("Light")
	expect(buttons[2]).toHaveAccessibleName("Dark")
})

test("Mørkt stores the choice, applies it, keeps focus and says so", async () => {
	fakeOsTheme(false)
	stubDataFiles()
	render(<App />)
	const mørkt = pill().getByRole("button", { name: "Mørkt" })
	await userEvent.click(mørkt)
	expect(localStorage.getItem("theme")).toBe("dark")
	expect(document.documentElement.dataset.theme).toBe("dark")
	expect(mørkt).toHaveAttribute("aria-pressed", "true")
	expect(mørkt).toHaveFocus()
	expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent("Tema: Mørkt")
})

test("pressing the pressed button changes nothing", async () => {
	fakeOsTheme(false)
	localStorage.setItem("theme", "dark")
	stubDataFiles()
	render(<App />)
	const mørkt = pill().getByRole("button", { name: "Mørkt" })
	expect(mørkt).toHaveAttribute("aria-pressed", "true")
	await userEvent.click(mørkt)
	expect(localStorage.getItem("theme")).toBe("dark")
	expect(mørkt).toHaveAttribute("aria-pressed", "true")
})

test("System removes the key and follows the OS live", async () => {
	const os = fakeOsTheme(false)
	localStorage.setItem("theme", "light")
	stubDataFiles()
	render(<App />)
	const system = pill().getByRole("button", { name: "System" })
	await userEvent.click(system)
	expect(localStorage.getItem("theme")).toBeNull()
	act(() => os.set(true))
	expect(document.documentElement.dataset.theme).toBe("dark")
	expect(tip(system)).toBe("System (mørkt)")
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
	expect(pill().getByRole("button", { name: "Mørkt" })).toHaveAttribute("aria-pressed", "true")
})

test("a pill choice updates the Meny's pressed row", async () => {
	fakeOsTheme(false)
	stubDataFiles()
	render(<App />)
	await userEvent.click(pill().getByRole("button", { name: "Mørkt" }))
	expect(menu().getByRole("button", { name: "Mørkt" })).toHaveAttribute("aria-pressed", "true")
})

test("with site data blocked, the page stays up and the pill still renders", () => {
	fakeOsTheme(false)
	stubDataFiles()
	const restore = blockStorage()
	try {
		render(<App />)
		expect(pill().getByRole("button", { name: "System" })).toHaveAttribute("aria-pressed", "true")
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
		await userEvent.click(pill().getByRole("button", { name: "Mørkt" }))
		act(() => os.set(false))
		expect(document.documentElement.dataset.theme).toBe("dark")
		expect(pill().getByRole("button", { name: "Mørkt" })).toHaveAttribute("aria-pressed", "true")
	} finally {
		restore()
	}
})

test("the prerendered pill presses nothing, so hydration cannot mismatch", async () => {
	const { html } = await prerender("/", {})
	const footerHtml = html.slice(html.indexOf("<footer"))
	expect(footerHtml).toContain('aria-label="Tema"')
	expect(footerHtml.match(/aria-pressed="false"/g)).toHaveLength(3)
	expect(footerHtml).not.toContain('aria-pressed="true"')
})

test("the desktop header has no theme control any more", () => {
	fakeOsTheme(false)
	stubDataFiles()
	render(<App />)
	expect(document.querySelector(".header-tools")).not.toHaveTextContent(/Tema/)
})
