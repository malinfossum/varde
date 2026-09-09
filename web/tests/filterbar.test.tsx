import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test, vi } from "vitest"
import { FilterBar } from "../src/components/FilterBar.tsx"
import { AnnouncerProvider } from "../src/components/StatusRegion.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import type { Catalog } from "../src/services/catalogCache.ts"
import type { Filters } from "../src/services/urlState.ts"

const catalog: Catalog = {
	municipalities: [
		{ id: 1, name: "Hamar", county: "Innlandet" },
		{ id: 8, name: "Oslo", county: "Oslo" },
	],
	categories: [
		{ id: 1, slug: "bolig", name: "Bolig", isFallbackTranslation: false },
		{ id: 2, slug: "rus", name: "Rus og avhengighet", isFallbackTranslation: false },
	],
}

const noFilters: Filters = {
	search: "",
	categories: [],
	municipality: null,
	national: false,
	page: 1,
}

function renderBar(filters: Partial<Filters> = {}) {
	const onPatch = vi.fn()
	const onSearch = vi.fn()
	const view = render(
		<LanguageProvider initialLang="nb">
			<AnnouncerProvider>
				<FilterBar
					catalog={catalog}
					filters={{ ...noFilters, ...filters }}
					onPatch={onPatch}
					onSearch={onSearch}
				/>
			</AnnouncerProvider>
		</LanguageProvider>
	)
	const rerenderWith = (next: Partial<Filters>) =>
		view.rerender(
			<LanguageProvider initialLang="nb">
				<AnnouncerProvider>
					<FilterBar
						catalog={catalog}
						filters={{ ...noFilters, ...next }}
						onPatch={onPatch}
						onSearch={onSearch}
					/>
				</AnnouncerProvider>
			</LanguageProvider>
		)
	return { onPatch, onSearch, rerenderWith }
}

test("the national toggle turns national services on, and off again", async () => {
	const user = userEvent.setup()
	const { onPatch, rerenderWith } = renderBar()
	const toggle = screen.getByRole("button", { name: "Nasjonale tjenester" })
	expect(toggle).toHaveAttribute("aria-pressed", "false")
	await user.click(toggle)
	expect(onPatch).toHaveBeenCalledWith({ national: true })

	rerenderWith({ national: true })
	expect(toggle).toHaveAttribute("aria-pressed", "true")
	await user.click(toggle)
	expect(onPatch).toHaveBeenCalledWith({ national: false })
})

test("a category chip adds its slug, and clicking an active one removes it", async () => {
	const user = userEvent.setup()
	const { onPatch, rerenderWith } = renderBar()
	const chip = screen.getByRole("button", { name: "Bolig" })
	expect(chip).toHaveAttribute("aria-pressed", "false")
	await user.click(chip)
	expect(onPatch).toHaveBeenCalledWith({ categories: ["bolig"] })

	rerenderWith({ categories: ["bolig", "rus"] })
	const activeChip = screen.getByRole("button", { name: /Bolig/ })
	expect(activeChip).toHaveAttribute("aria-pressed", "true")
	await user.click(activeChip)
	expect(onPatch).toHaveBeenCalledWith({ categories: ["rus"] })
})

test("Nullstill only appears once a filter is set, and clears every one of them", async () => {
	const user = userEvent.setup()
	const { onPatch, rerenderWith } = renderBar()
	expect(screen.queryByRole("button", { name: "Nullstill" })).not.toBeInTheDocument()

	rerenderWith({ categories: ["bolig"] })
	await user.click(screen.getByRole("button", { name: "Nullstill" }))
	expect(onPatch).toHaveBeenCalledWith({
		search: "",
		categories: [],
		municipality: null,
		national: false,
	})
})

test.each([
	["search", { search: "hamar" }],
	["municipality", { municipality: 1 }],
	["national", { national: true }],
])("Nullstill appears when only %s is set", (_name, filters) => {
	renderBar(filters)
	expect(screen.getByRole("button", { name: "Nullstill" })).toBeInTheDocument()
})

test("the municipality field follows a filter change made outside it", async () => {
	// Nullstill, the national toggle, a municipality suggestion, EmptyState's clear button and
	// browser back/forward all change the municipality without touching the combobox, and
	// ListPage is not keyed — so the field has to follow, or it keeps naming a filter that is
	// no longer applied.
	const { rerenderWith } = renderBar({ municipality: 1 })
	const field = screen.getByRole("combobox", { name: "Kommune" })
	expect(field).toHaveValue("Hamar")

	rerenderWith({ municipality: null })
	expect(field).toHaveValue("")

	rerenderWith({ national: true, municipality: 8 })
	expect(field).toHaveValue("")
})
