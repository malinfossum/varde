import { act, render, screen, within } from "@testing-library/react"
import { renderToStaticMarkup } from "react-dom/server"
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
		<LanguageProvider lang="nb">
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
		<LanguageProvider lang="nb">
			<HandoverBanner />
		</LanguageProvider>
	)
	expect(screen.getByText(/Fastlegen stengt/i)).toBeInTheDocument()
	expect(screen.getByRole("link", { name: /116 117/ })).toHaveAttribute("href", "tel:116117")
})

test("first render is the neutral legevakt line; the fastlege paragraph arrives in an effect", () => {
	vi.useFakeTimers()
	vi.setSystemTime(new Date(2026, 7, 19, 10, 0)) // Wed 10:00 -> "fastlege" per hoursRule

	// Synchronous first paint: this is what a prerender emits, for any hour of the day — the
	// real clock only exists once we're in the browser, so this must not depend on it.
	const markup = renderToStaticMarkup(
		<LanguageProvider lang="nb">
			<HandoverBanner />
		</LanguageProvider>
	)
	const staticContainer = document.createElement("div")
	staticContainer.innerHTML = markup
	expect(staticContainer.querySelectorAll("p")).toHaveLength(1)
	// toBeInTheDocument needs a node attached to the live document; this container never is
	// (that's the point — it's the server markup, inspected before hydration), so this checks
	// the href directly instead.
	expect(within(staticContainer).getByRole("link", { name: /116 117/ })).toHaveAttribute(
		"href",
		"tel:116117"
	)

	// After mount, the effect reads the real clock and adds the fastlege paragraph.
	const { container } = render(
		<LanguageProvider lang="nb">
			<HandoverBanner />
		</LanguageProvider>
	)
	act(() => {})
	expect(container.querySelectorAll("p")).toHaveLength(2)

	vi.useRealTimers()
})
