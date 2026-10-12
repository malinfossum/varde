import { fireEvent, render, screen, within } from "@testing-library/react"
import { expect, test } from "vitest"
import { AcuteStrip } from "../src/components/AcuteStrip.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { emergencyLines } from "../src/services/emergency.ts"

const renderStrip = (lang: "nb" | "en") =>
	render(
		<LanguageProvider lang={lang}>
			<AcuteStrip />
		</LanguageProvider>
	)

// Spec: Acute strip, one line. Each number is one link holding a decorative icon and the digits;
// the service label is not shown but starts the link's name.
test("the strip lists every emergency line as one tel link named by its label and number", () => {
	const labels = {
		nb: ["Brann", "Politi", "Ambulanse", "Legevakt"],
		en: ["Fire", "Police", "Ambulance", "Out-of-hours service"],
	} as const
	for (const lang of ["nb", "en"] as const) {
		const { unmount } = renderStrip(lang)
		const region = screen.getByRole("region", {
			name: lang === "nb" ? "Nødnumre" : "Emergency numbers",
		})
		for (const [i, line] of emergencyLines.entries()) {
			const link = within(region).getByRole("link", { name: `${labels[lang][i]} ${line.phone}` })
			expect(link).toHaveAttribute("href", `tel:${line.phone.replaceAll(" ", "")}`)
			expect(link.querySelector("svg")).toHaveAttribute("aria-hidden", "true")
			// The digits are the link's own text; the label only sits in the hidden tooltip.
			const ownText = [...link.childNodes].filter((node) => node.nodeType === Node.TEXT_NODE)
			expect(ownText.map((node) => node.textContent).join("")).toBe(line.phone)
		}
		unmount()
	}
})

// The full name is kept for screen readers; below 768 px the visible text is the short word,
// which is the start of the name (WCAG 2.5.3, label in name).
test("the last link is named for all emergency services and shows a short word", () => {
	for (const [lang, name, short] of [
		["nb", "Alle nødtjenester", "Alle"],
		["en", "All emergency services", "All"],
	] as const) {
		const { unmount } = renderStrip(lang)
		const link = screen.getByRole("link", { name })
		expect(link).toHaveAttribute("href", `${lang === "en" ? "/en" : ""}/sok?category=nodtjenester`)
		expect(link.textContent).toContain(short)
		expect(name.startsWith(short)).toBe(true)
		unmount()
	}
})

// Spec: Acute strip, one line. On a device with a mouse each number shows its label as a tooltip
// on hover and keyboard focus. The tooltip repeats the link's name, so it is hidden from screen
// readers, and Escape closes it (WCAG 1.4.13) until the pointer or focus moves to a link again.
test("each tel link holds its label as a hidden tooltip that Escape closes", () => {
	const { container } = renderStrip("nb")
	const strip = container.querySelector(".acute-strip")
	const link = screen.getByRole("link", { name: "Brann 110" })
	const tip = link.querySelector(".strip-tip")
	expect(tip).toHaveTextContent("Brann")
	expect(tip).toHaveAttribute("aria-hidden", "true")
	expect(container.querySelectorAll(".strip-tip")).toHaveLength(4)
	fireEvent.keyDown(document, { key: "Escape" })
	expect(strip).toHaveAttribute("data-tips", "hidden")
	fireEvent.focus(screen.getByRole("link", { name: "Politi 112" }))
	expect(strip).not.toHaveAttribute("data-tips")
})
