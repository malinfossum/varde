import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test } from "vitest"
import { Picker } from "../src/components/Picker.tsx"

function Harness() {
	return (
		<>
			<Picker name="Første" value="B" icon={<span />}>
				{(closeAndFocus) =>
					["A", "B", "C"].map((v) => (
						<button
							key={v}
							type="button"
							className="picker-row"
							aria-pressed={v === "B"}
							onClick={closeAndFocus}
						>
							{v}
						</button>
					))
				}
			</Picker>
			<Picker name="Andre" value={null} icon={<span />}>
				{(closeAndFocus) =>
					["X", "Y"].map((v) => (
						<button key={v} type="button" className="picker-row" onClick={closeAndFocus}>
							{v}
						</button>
					))
				}
			</Picker>
			<button type="button">Utenfor</button>
		</>
	)
}

const trigger = (name: string) =>
	screen.getByText(name, { selector: ".visually-hidden" }).closest("summary") as HTMLElement
const details = (name: string) => trigger(name).parentElement as HTMLDetailsElement

async function open(user: ReturnType<typeof userEvent.setup>, name: string) {
	await user.click(trigger(name))
	await waitFor(() => expect(details(name).open).toBe(true))
}

test("the trigger names the setting and its value, or the setting alone before a value exists", () => {
	render(<Harness />)
	expect(trigger("Første: B")).toBeInTheDocument()
	expect(trigger("Andre")).toBeInTheDocument()
	expect(screen.getByRole("group", { name: "Første" })).toBeInTheDocument()
})

test("opening focuses the active row; arrows wrap; Home and End jump", async () => {
	const user = userEvent.setup()
	render(<Harness />)
	await open(user, "Første: B")
	await waitFor(() => expect(screen.getByRole("button", { name: "B" })).toHaveFocus())
	await user.keyboard("{ArrowDown}")
	expect(screen.getByRole("button", { name: "C" })).toHaveFocus()
	await user.keyboard("{ArrowDown}")
	expect(screen.getByRole("button", { name: "A" })).toHaveFocus()
	await user.keyboard("{ArrowUp}")
	expect(screen.getByRole("button", { name: "C" })).toHaveFocus()
	await user.keyboard("{Home}")
	expect(screen.getByRole("button", { name: "A" })).toHaveFocus()
	await user.keyboard("{End}")
	expect(screen.getByRole("button", { name: "C" })).toHaveFocus()
})

test("with no active row, opening focuses the first row", async () => {
	const user = userEvent.setup()
	render(<Harness />)
	await open(user, "Andre")
	await waitFor(() => expect(screen.getByRole("button", { name: "X" })).toHaveFocus())
})

test("Escape closes and returns focus to the trigger", async () => {
	const user = userEvent.setup()
	render(<Harness />)
	await open(user, "Første: B")
	await user.keyboard("{Escape}")
	expect(details("Første: B").open).toBe(false)
	expect(trigger("Første: B")).toHaveFocus()
})

test("choosing a row closes the picker and returns focus to the trigger", async () => {
	const user = userEvent.setup()
	render(<Harness />)
	await open(user, "Første: B")
	await user.click(screen.getByRole("button", { name: "C" }))
	expect(details("Første: B").open).toBe(false)
	expect(trigger("Første: B")).toHaveFocus()
})

test("opening one picker closes the other", async () => {
	const user = userEvent.setup()
	render(<Harness />)
	await open(user, "Første: B")
	act(() => {
		details("Andre").open = true
	})
	await waitFor(() => expect(details("Første: B").open).toBe(false))
})

test("a pointer press outside closes it", async () => {
	const user = userEvent.setup()
	render(<Harness />)
	await open(user, "Første: B")
	await user.click(screen.getByRole("button", { name: "Utenfor" }))
	expect(details("Første: B").open).toBe(false)
})

test("focus leaving the picker closes it", async () => {
	const user = userEvent.setup()
	render(<Harness />)
	await open(user, "Første: B")
	await user.keyboard("{End}")
	await user.tab()
	expect(details("Første: B").open).toBe(false)
})
