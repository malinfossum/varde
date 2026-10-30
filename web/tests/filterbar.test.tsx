import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { expect, test, vi } from "vitest"
import { FilterBar } from "../src/components/FilterBar.tsx"
import { AnnouncerProvider } from "../src/components/StatusRegion.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import type { Catalog } from "../src/services/data.ts"
import { CLEAR_ALL, EMPTY_FILTERS, type Filters } from "../src/services/filters.ts"

const catalog: Catalog = {
	municipalities: [
		{ id: 1, name: "Hamar", county: "Innlandet", number: "3403", countyNumber: "34" },
		{ id: 8, name: "Oslo", county: "Oslo", number: "0301", countyNumber: "03" },
	],
	categories: [
		{ id: 1, slug: "bolig", name: "Bolig", isFallbackTranslation: false },
		{ id: 2, slug: "rus", name: "Rus og avhengighet", isFallbackTranslation: false },
	],
	kommuner: [],
	counties: [],
	aliases: [],
}

function renderBar(filters: Partial<Filters> = {}) {
	const onPatch = vi.fn()
	const onSearch = vi.fn()
	const view = render(
		<LanguageProvider lang="nb">
			<AnnouncerProvider>
				<FilterBar
					catalog={catalog}
					filters={{ ...EMPTY_FILTERS, ...filters }}
					onPatch={onPatch}
					onSearch={onSearch}
				/>
			</AnnouncerProvider>
		</LanguageProvider>
	)
	const rerenderWith = (next: Partial<Filters>) =>
		view.rerender(
			<LanguageProvider lang="nb">
				<AnnouncerProvider>
					<FilterBar
						catalog={catalog}
						filters={{ ...EMPTY_FILTERS, ...next }}
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
	expect(onPatch).toHaveBeenCalledWith({ national: "only" })

	rerenderWith({ national: "only" })
	expect(toggle).toHaveAttribute("aria-pressed", "true")
	await user.click(toggle)
	expect(onPatch).toHaveBeenCalledWith({ national: "include" })
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
	expect(onPatch).toHaveBeenCalledWith(CLEAR_ALL)
})

test.each<[string, Partial<Filters>]>([
	["search", { search: "hamar" }],
	["municipality", { municipalities: ["3403"] }],
	["national", { national: "only" }],
])("Nullstill appears when only %s is set", (_name, filters) => {
	renderBar(filters)
	expect(screen.getByRole("button", { name: "Nullstill" })).toBeInTheDocument()
})

test("the municipality field follows a filter change made outside it", async () => {
	// Nullstill, the national toggle, a municipality suggestion, EmptyState's clear button and
	// browser back/forward all change the municipality without touching the combobox, and
	// ListPage is not keyed — so the field has to follow, or it keeps naming a filter that is
	// no longer applied.
	const { rerenderWith } = renderBar({ municipalities: ["3403"] })
	const field = screen.getByRole("combobox", { name: "Kommune" })
	expect(field).toHaveValue("Hamar")

	rerenderWith({ municipalities: [] })
	expect(field).toHaveValue("")

	rerenderWith({ national: "only", municipalities: ["0301"] })
	expect(field).toHaveValue("")
})
