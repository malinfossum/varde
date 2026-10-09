import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { leave } from "../src/services/quickExit.ts"
import { stubDataFiles } from "./stubData.ts"

vi.mock("../src/services/quickExit.ts", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../src/services/quickExit.ts")>()
	return { ...actual, leave: vi.fn() }
})

afterEach(() => {
	vi.mocked(leave).mockClear()
})

test("Shift three times leaves, also while typing in the search box", async () => {
	stubDataFiles()
	const user = userEvent.setup()
	render(<App />)
	await user.click(screen.getByRole("searchbox", { name: /Søk/ }))
	await user.keyboard("{Shift}{Shift}{Shift}")
	expect(leave).toHaveBeenCalledTimes(1)
})

test("typing capitals in the search box never leaves", async () => {
	stubDataFiles()
	const user = userEvent.setup()
	render(<App />)
	await user.click(screen.getByRole("searchbox", { name: /Søk/ }))
	await user.keyboard("{Shift>}H{/Shift}{Shift>}A{/Shift}{Shift>}M{/Shift}{Shift>}A{/Shift}")
	expect(leave).not.toHaveBeenCalled()
})

test("the exit link still works as a plain link before any script runs", () => {
	stubDataFiles()
	render(<App />)
	expect(screen.getByRole("link", { name: "Forlat siden" })).toHaveAttribute(
		"href",
		"https://www.google.com"
	)
})
