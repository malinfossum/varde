import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"
import { AcuteStrip } from "../src/components/AcuteStrip.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { emergencyLines } from "../src/services/emergency.ts"

test("the strip lists every emergency line as a tel link with the digits visible", () => {
	render(
		<LanguageProvider initialLang="nb">
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
