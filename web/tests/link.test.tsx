import { fireEvent, render, screen } from "@testing-library/react"
import { expect, test, vi } from "vitest"
import { Link } from "../src/components/Link.tsx"
import { NavigationContext } from "../src/navigation.ts"

function renderLink(onNavigate = vi.fn()) {
	render(
		<NavigationContext.Provider value={onNavigate}>
			<Link to="/resources/1">Krisesenteret</Link>
		</NavigationContext.Provider>
	)
	return onNavigate
}

test("a plain click navigates client-side", () => {
	const onNavigate = renderLink()
	fireEvent.click(screen.getByRole("link", { name: "Krisesenteret" }))
	expect(onNavigate).toHaveBeenCalledWith("/resources/1", "")
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
