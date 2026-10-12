import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"
import { AcuteStrip } from "../src/components/AcuteStrip.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { emergencyLines } from "../src/services/emergency.ts"

test("the strip lists every emergency line as a tel link with the digits visible", () => {
	render(
		<LanguageProvider lang="nb">
			<AcuteStrip />
		</LanguageProvider>
	)
	const region = screen.getByRole("region", { name: "Nødnumre" })
	for (const line of emergencyLines) {
		const link = screen.getByRole("link", { name: new RegExp(line.phone) })
		expect(link).toHaveAttribute("href", `tel:${line.phone.replaceAll(" ", "")}`)
		expect(region).toContainElement(link)
	}
	expect(screen.getByRole("link", { name: "Alle nødtjenester" })).toHaveAttribute(
		"href",
		"/sok?category=nodtjenester"
	)
})

// Labels, not running text, so each starts with a capital. The short English label for 116 117
// wraps to at most two lines at 320 px; the full term would wrap to three.
test("the strip's labels start with a capital in both languages", () => {
	const labels = {
		nb: ["Brann", "Politi", "Ambulanse", "Legevakt"],
		en: ["Fire", "Police", "Ambulance", "Out-of-hours service"],
	} as const
	for (const lang of ["nb", "en"] as const) {
		const { unmount } = render(
			<LanguageProvider lang={lang}>
				<AcuteStrip />
			</LanguageProvider>
		)
		const items = screen.getAllByRole("listitem").slice(0, 4)
		expect(items.map((li) => li.querySelector("span")?.textContent)).toEqual(labels[lang])
		unmount()
	}
})
