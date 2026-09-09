import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactNode } from "react"
import { expect, test, vi } from "vitest"
import { MunicipalityCombobox } from "../src/components/MunicipalityCombobox.tsx"
import { AnnouncerProvider } from "../src/components/StatusRegion.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"

const municipalities = [
	{ id: 1, name: "Hamar", county: "Innlandet" },
	{ id: 6, name: "Løten", county: "Innlandet" },
	{ id: 8, name: "Oslo", county: "Oslo" },
]

function Wrapper({ children }: { children: ReactNode }) {
	return (
		<LanguageProvider initialLang="nb">
			<AnnouncerProvider>{children}</AnnouncerProvider>
		</LanguageProvider>
	)
}

// The county headers label their group through aria-labelledby, so this is the group's own
// accessible name — a missing or unlabelled group shows up as a missing or empty entry.
function groupNames(): string[] {
	return screen.getAllByRole("group").map((group) => {
		const id = group.getAttribute("aria-labelledby")
		return (id && document.getElementById(id)?.textContent) || ""
	})
}

function optionNames(): string[] {
	return screen.getAllByRole("option").map((option) => option.textContent ?? "")
}

function renderBox(
	selectedId: number | null = null,
	onSelect = vi.fn(),
	onNoMatchNational = vi.fn()
) {
	render(
		<Wrapper>
			<MunicipalityCombobox
				municipalities={municipalities}
				selectedId={selectedId}
				onSelect={onSelect}
				onNoMatchNational={onNoMatchNational}
			/>
		</Wrapper>
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
	await screen.findByRole("listbox")
	// Read the group labels themselves, in order — an indexOf comparison over the listbox text
	// would pass on a county that stopped rendering (indexOf returns -1, which is below every
	// real index) and would never notice a group losing its label.
	expect(groupNames()).toEqual(["Agder", "Ærlig", "Østfold"])
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
	await screen.findByRole("listbox")
	expect(groupNames()).toEqual(["Vestland"])
	expect(optionNames()).toEqual(["Alle kommuner", "Bergen", "Åsane"])
})

test("Alle kommuner is still offered after a municipality is selected", async () => {
	// The spec's way out of a filter: "Choosing 'Alle kommuner' clears the filter." Selecting
	// puts the municipality's name in the input, so an empty-input-only guard would hide the row
	// exactly when someone wants to undo their choice.
	const user = userEvent.setup()
	const { onSelect } = renderBox(1)
	await user.click(screen.getByRole("combobox", { name: "Kommune" }))
	await screen.findByRole("listbox")
	expect(optionNames()).toEqual(["Alle kommuner", "Hamar"])
	await user.click(screen.getByRole("option", { name: "Alle kommuner" }))
	expect(onSelect).toHaveBeenCalledWith(null)
})

test("typing a new query hides Alle kommuner so it never sits in the way of a search", async () => {
	const user = userEvent.setup()
	renderBox()
	const input = screen.getByRole("combobox", { name: "Kommune" })
	await user.type(input, "ham")
	await screen.findByRole("listbox")
	expect(optionNames()).toEqual(["Hamar"])
})

test("the input follows selectedId when it changes from outside the component", async () => {
	// Nothing inside the combobox drives this: "Nullstill", the national toggle, a suggestion
	// and browser back/forward all change selectedId while the component stays mounted.
	const { rerender } = render(
		<Wrapper>
			<MunicipalityCombobox
				municipalities={municipalities}
				selectedId={1}
				onSelect={vi.fn()}
				onNoMatchNational={vi.fn()}
			/>
		</Wrapper>
	)
	const input = screen.getByRole("combobox", { name: "Kommune" })
	expect(input).toHaveValue("Hamar")

	rerender(
		<Wrapper>
			<MunicipalityCombobox
				municipalities={municipalities}
				selectedId={null}
				onSelect={vi.fn()}
				onNoMatchNational={vi.fn()}
			/>
		</Wrapper>
	)
	expect(input).toHaveValue("")

	rerender(
		<Wrapper>
			<MunicipalityCombobox
				municipalities={municipalities}
				selectedId={8}
				onSelect={vi.fn()}
				onNoMatchNational={vi.fn()}
			/>
		</Wrapper>
	)
	expect(input).toHaveValue("Oslo")
})

test("react-aria announces in the app's language, not the browser's", async () => {
	// react-aria names the listbox and counts options from its own locale bundle, which falls
	// back to navigator.language without an I18nProvider. The combobox has no hand-rolled live
	// region precisely because these announcements are native, so they have to follow the toggle.
	const user = userEvent.setup()
	renderBox()
	await user.click(screen.getByRole("combobox", { name: "Kommune" }))
	expect(await screen.findByRole("listbox")).toHaveAttribute("aria-label", "Forslag")

	cleanup()
	render(
		<LanguageProvider initialLang="en">
			<AnnouncerProvider>
				<MunicipalityCombobox
					municipalities={municipalities}
					selectedId={null}
					onSelect={vi.fn()}
					onNoMatchNational={vi.fn()}
				/>
			</AnnouncerProvider>
		</LanguageProvider>
	)
	await user.click(screen.getByRole("combobox", { name: "Municipality" }))
	expect(await screen.findByRole("listbox")).toHaveAttribute("aria-label", "Suggestions")
})
