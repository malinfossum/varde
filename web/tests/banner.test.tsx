import { render, screen } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { HandoverBanner } from "../src/components/HandoverBanner.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { handoverVariant } from "../src/services/hoursRule.ts"

afterEach(() => vi.useRealTimers())

test("variant follows the weekday 08-15 window", () => {
	expect(handoverVariant(new Date(2026, 7, 19, 10, 0))).toBe("fastlege") // Wed 10:00
	expect(handoverVariant(new Date(2026, 7, 19, 15, 0))).toBe("legevakt") // Wed 15:00 sharp
	expect(handoverVariant(new Date(2026, 7, 19, 7, 59))).toBe("legevakt") // Wed early morning
	expect(handoverVariant(new Date(2026, 7, 22, 10, 0))).toBe("legevakt") // Saturday
})

test("daytime banner still carries the legevakt fallback line", () => {
	vi.useFakeTimers()
	vi.setSystemTime(new Date(2026, 7, 19, 10, 0))
	render(
		<LanguageProvider initialLang="nb">
			<HandoverBanner />
		</LanguageProvider>
	)
	expect(screen.getByText(/Kontakt fastlegen din/i)).toBeInTheDocument()
	expect(screen.getByRole("link", { name: /116 117/ })).toHaveAttribute("href", "tel:116117")
})

test("evening banner leads with legevakt as a tel link", () => {
	vi.useFakeTimers()
	vi.setSystemTime(new Date(2026, 7, 19, 20, 0))
	render(
		<LanguageProvider initialLang="nb">
			<HandoverBanner />
		</LanguageProvider>
	)
	expect(screen.getByText(/Fastlegen stengt/i)).toBeInTheDocument()
	expect(screen.getByRole("link", { name: /116 117/ })).toHaveAttribute("href", "tel:116117")
})
