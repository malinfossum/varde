import { fireEvent, render, screen } from "@testing-library/react"
import { expect, test, vi } from "vitest"
import { Link } from "../src/components/Link.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { NavigationContext } from "../src/navigation.ts"
import type { Lang } from "../src/services/urlState.ts"

function renderLink(onNavigate = vi.fn(), lang: Lang = "nb", to = "/resources/1") {
	render(
		<LanguageProvider lang={lang}>
			<NavigationContext.Provider value={onNavigate}>
				<Link to={to}>Krisesenteret</Link>
			</NavigationContext.Provider>
		</LanguageProvider>
	)
	return onNavigate
}

test("a plain click navigates client-side", () => {
	const onNavigate = renderLink()
	fireEvent.click(screen.getByRole("link", { name: "Krisesenteret" }))
	expect(onNavigate).toHaveBeenCalledWith("/resources/1", "", { lang: "nb" })
})

test("ctrl/meta/shift clicks are left alone for the browser to open a new tab", () => {
	const onNavigate = renderLink()
	const link = screen.getByRole("link", { name: "Krisesenteret" })
	fireEvent.click(link, { ctrlKey: true })
	fireEvent.click(link, { metaKey: true })
	fireEvent.click(link, { shiftKey: true })
	expect(onNavigate).not.toHaveBeenCalled()
})

test("alt-clicks are left alone (browser 'save link as' convention)", () => {
	const onNavigate = renderLink()
	fireEvent.click(screen.getByRole("link", { name: "Krisesenteret" }), { altKey: true })
	expect(onNavigate).not.toHaveBeenCalled()
})

test("non-primary button clicks (e.g. middle-click) are left alone for the browser to open a new tab", () => {
	const onNavigate = renderLink()
	fireEvent.click(screen.getByRole("link", { name: "Krisesenteret" }), { button: 1 })
	expect(onNavigate).not.toHaveBeenCalled()
})

test("the href is prefixed with the current language when no override is given", () => {
	renderLink(vi.fn(), "en", "/sok")
	expect(screen.getByRole("link", { name: "Krisesenteret" })).toHaveAttribute("href", "/en/sok")
})

test("an explicit lang overrides the prefix and sets hrefLang", () => {
	render(
		<LanguageProvider lang="en">
			<NavigationContext.Provider value={vi.fn()}>
				<Link to="/sok" lang="nb">
					Krisesenteret
				</Link>
			</NavigationContext.Provider>
		</LanguageProvider>
	)
	const link = screen.getByRole("link", { name: "Krisesenteret" })
	expect(link).toHaveAttribute("href", "/sok")
	expect(link).toHaveAttribute("hreflang", "nb")
})
