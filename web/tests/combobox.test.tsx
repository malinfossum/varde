import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test, vi } from "vitest"
import { MunicipalityCombobox } from "../src/components/MunicipalityCombobox.tsx"
import { AnnouncerProvider } from "../src/components/StatusRegion.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"

const municipalities = [
	{ id: 1, name: "Hamar", county: "Innlandet" },
	{ id: 6, name: "Løten", county: "Innlandet" },
	{ id: 8, name: "Oslo", county: "Oslo" },
]

function renderBox(
	selectedId: number | null = null,
	onSelect = vi.fn(),
	onNoMatchNational = vi.fn()
) {
	render(
		<LanguageProvider initialLang="nb">
			<AnnouncerProvider>
				<MunicipalityCombobox
					municipalities={municipalities}
					selectedId={selectedId}
					onSelect={onSelect}
					onNoMatchNational={onNoMatchNational}
				/>
			</AnnouncerProvider>
		</LanguageProvider>
	)
	return { onSelect, onNoMatchNational }
}

test("opening lists every municipality under its county", async () => {
	const user = userEvent.setup()
	renderBox()
	await user.click(screen.getByRole("button", { name: /Kommune/ }))
	const listbox = await screen.findByRole("listbox")
	expect(listbox).toBeInTheDocument()
	expect(screen.getByRole("group", { name: "Innlandet" })).toBeInTheDocument()
	expect(screen.getByRole("group", { name: "Oslo" })).toBeInTheDocument()
	expect(screen.getAllByRole("option")).toHaveLength(4) // 3 + "Alle kommuner"
})

test("typeahead folds diacritics, Enter selects, Escape closes without selecting", async () => {
	const user = userEvent.setup()
	const { onSelect } = renderBox()
	const input = screen.getByRole("combobox", { name: "Kommune" })
	await user.type(input, "lot")
	expect(await screen.findByRole("option", { name: "Løten" })).toBeInTheDocument()
	expect(screen.queryByRole("option", { name: "Hamar" })).not.toBeInTheDocument()
	await user.keyboard("{ArrowDown}{Enter}")
	expect(onSelect).toHaveBeenCalledWith(6)

	await user.clear(input)
	await user.type(input, "ham")
	await user.keyboard("{Escape}")
	expect(onSelect).toHaveBeenCalledTimes(1)
})

test("no match shows the coverage note with the national link; clear resets to all", async () => {
	const user = userEvent.setup()
	const { onSelect, onNoMatchNational } = renderBox(1)
	const input = screen.getByRole("combobox", { name: "Kommune" })
	// selectedId=1 pre-fills the input with "Hamar" — clear it first, otherwise typing "zzz"
	// appends to "Hamar" and the folded substring match (correctly) still finds it.
	await user.clear(input)
	await user.type(input, "zzz")
	expect(await screen.findByText(/Fant ikke kommunen din/)).toBeInTheDocument()
	await user.click(
		screen.getByRole("button", { name: "Se nasjonale tjenester som gjelder hele landet" })
	)
	expect(onNoMatchNational).toHaveBeenCalledTimes(1)
	await user.click(screen.getByRole("button", { name: "Tøm" }))
	expect(onSelect).toHaveBeenCalledWith(null)
})

test("county groups sort with Norwegian collation, not backend order", async () => {
	// Backend order here is deliberately not alphabetical; nb collation sorts a-z, then æ, ø, å —
	// so "Østfold" and "Ærlig" must land after "Agder" despite arriving first.
	const unsorted = [
		{ id: 1, name: "Sarpsborg", county: "Østfold" },
		{ id: 2, name: "Grimstad", county: "Agder" },
		{ id: 3, name: "Nord-Aurdal", county: "Ærlig" },
	]
	const user = userEvent.setup()
	render(
		<LanguageProvider initialLang="nb">
			<AnnouncerProvider>
				<MunicipalityCombobox
					municipalities={unsorted}
					selectedId={null}
					onSelect={vi.fn()}
					onNoMatchNational={() => {}}
				/>
			</AnnouncerProvider>
		</LanguageProvider>
	)
	await user.click(screen.getByRole("button", { name: /Kommune/ }))
	const listbox = await screen.findByRole("listbox")
	const text = listbox.textContent ?? ""
	expect(text.indexOf("Agder")).toBeLessThan(text.indexOf("Ærlig"))
	expect(text.indexOf("Ærlig")).toBeLessThan(text.indexOf("Østfold"))
})

test("municipalities within a county sort with Norwegian collation too", async () => {
	const unsorted = [
		{ id: 1, name: "Åsane", county: "Vestland" },
		{ id: 2, name: "Bergen", county: "Vestland" },
	]
	const user = userEvent.setup()
	render(
		<LanguageProvider initialLang="nb">
			<AnnouncerProvider>
				<MunicipalityCombobox
					municipalities={unsorted}
					selectedId={null}
					onSelect={vi.fn()}
					onNoMatchNational={() => {}}
				/>
			</AnnouncerProvider>
		</LanguageProvider>
	)
	await user.click(screen.getByRole("button", { name: /Kommune/ }))
	const listbox = await screen.findByRole("listbox")
	const text = listbox.textContent ?? ""
	expect(text.indexOf("Bergen")).toBeLessThan(text.indexOf("Åsane"))
})
