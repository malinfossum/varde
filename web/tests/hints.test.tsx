import { render, screen } from "@testing-library/react"
import { expect, test } from "vitest"
import { WayfindingHint } from "../src/components/WayfindingHint.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { findHint } from "../src/services/hints.ts"

test("keyword queries find the helsenorge hint, others find nothing", () => {
	expect(findHint("bytte fastlege")?.id).toBe("helsenorge")
	expect(findHint("frikort")?.id).toBe("helsenorge")
	expect(findHint("krisesenter")).toBeNull()
	expect(findHint("")).toBeNull()
})

test("hint renders as one quiet link whose href never contains the query", () => {
	render(
		<LanguageProvider initialLang="nb">
			<WayfindingHint query="bytte fastlege" />
		</LanguageProvider>
	)
	const link = screen.getByRole("link")
	expect(link).toHaveAttribute("href", "https://www.helsenorge.no")
	expect(link).toHaveAttribute("rel", "noopener noreferrer")
	expect(link.getAttribute("href")).not.toContain("fastlege")
})

test("no hint renders without a keyword match", () => {
	render(
		<LanguageProvider initialLang="nb">
			<WayfindingHint query="krisesenter" />
		</LanguageProvider>
	)
	expect(screen.queryByRole("link")).not.toBeInTheDocument()
})
