import { expect, test } from "vitest"
import { isIosStandalone, markStandalone } from "../src/services/standalone.ts"

const nav = (standalone: unknown) => ({ standalone }) as unknown as Navigator

test("navigator.standalone true marks <html> as installed", () => {
	const root = document.createElement("html")
	markStandalone(root, nav(true))
	expect(root.hasAttribute("data-standalone")).toBe(true)
})

test("anything but true leaves <html> alone", () => {
	for (const value of [false, undefined, "true", 1]) {
		const root = document.createElement("html")
		markStandalone(root, nav(value))
		expect(root.hasAttribute("data-standalone"), String(value)).toBe(false)
		expect(isIosStandalone(nav(value))).toBe(false)
	}
})
