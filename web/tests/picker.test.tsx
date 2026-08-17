import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test, vi } from "vitest"
import { KommunePicker } from "../src/components/KommunePicker.tsx"
import { AnnouncerProvider } from "../src/components/StatusRegion.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"

const municipalities = [
	{ id: 1, name: "Hamar", county: "Innlandet" },
	{ id: 6, name: "Løten", county: "Innlandet" },
	{ id: 8, name: "Oslo", county: "Oslo" },
]

function renderPicker(onSelect = vi.fn()) {
	render(
		<LanguageProvider initialLang="nb">
			<AnnouncerProvider>
				<KommunePicker
					municipalities={municipalities}
					selectedId={null}
					nationalSelected={false}
					onSelect={onSelect}
				/>
			</AnnouncerProvider>
		</LanguageProvider>
	)
	return onSelect
}

test("shows all municipalities grouped by fylke, national pinned on top", () => {
	renderPicker()
	expect(screen.getByRole("button", { name: "Nasjonale tjenester" })).toBeInTheDocument()
	expect(screen.getByRole("heading", { name: "Innlandet" })).toBeInTheDocument()
	expect(screen.getByRole("heading", { name: "Oslo" })).toBeInTheDocument()
	expect(screen.getByRole("button", { name: "Løten" })).toBeInTheDocument()
})

test("typing filters instantly, diacritic-insensitively", async () => {
	const user = userEvent.setup()
	renderPicker()
	await user.type(screen.getByLabelText("Finn din kommune"), "lot")
	expect(screen.getByRole("button", { name: "Løten" })).toBeInTheDocument()
	expect(screen.queryByRole("button", { name: "Hamar" })).not.toBeInTheDocument()
})

test("no match is not a dead end", async () => {
	const user = userEvent.setup()
	renderPicker()
	await user.type(screen.getByLabelText("Finn din kommune"), "tromsø")
	expect(screen.getByText(/Fant ikke kommunen din/)).toBeInTheDocument()
	expect(screen.getByRole("button", { name: /nasjonale tjenester/i })).toBeInTheDocument()
})

test("selecting reports the pick", async () => {
	const user = userEvent.setup()
	const onSelect = renderPicker()
	await user.click(screen.getByRole("button", { name: "Hamar" }))
	expect(onSelect).toHaveBeenCalledWith({ municipality: 1 })
})
