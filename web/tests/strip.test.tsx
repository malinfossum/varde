import { render, screen, within } from "@testing-library/react"
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
			expect(link.textContent).toBe(line.phone)
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
