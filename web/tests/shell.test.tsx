import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"

function stubResources() {
	vi.spyOn(globalThis, "fetch").mockResolvedValue(
		new Response(JSON.stringify({ items: [], page: 1, pageSize: 20, totalCount: 0 }), {
			status: 200,
		})
	)
}

test("shell renders skip link, quick exit and akutt shortcut", () => {
	stubResources()
	render(<App />)
	expect(screen.getByRole("link", { name: "Hopp til innhold" })).toBeInTheDocument()
	expect(screen.getByRole("button", { name: "Forlat siden" })).toBeInTheDocument()
	expect(screen.getByRole("link", { name: "Akutt hjelp" })).toBeInTheDocument()
})

test("language toggle switches strings, html lang, keeps focus, announces", async () => {
	stubResources()
	const user = userEvent.setup()
	render(<App />)
	const toggle = screen.getByRole("button", { name: "English" })
	await user.click(toggle)
	expect(document.documentElement.lang).toBe("en")
	expect(toggle).toHaveFocus()
	expect(screen.getByText("Language is now English")).toBeInTheDocument() // the live region
	expect(screen.getByRole("button", { name: "Norsk" })).toBeInTheDocument()
	expect(window.location.search).toContain("lang=en")
})
