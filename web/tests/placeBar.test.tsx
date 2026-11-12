import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { type ReactNode, useState } from "react"
import { describe, expect, test, vi } from "vitest"
import { axe } from "vitest-axe"
import { PlaceBar } from "../src/components/PlaceBar.tsx"
import { AnnouncerProvider } from "../src/components/StatusRegion.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { facetCounts } from "../src/services/facets.ts"
import { applyPatch, type Filters } from "../src/services/filters.ts"
import type { Lang } from "../src/services/urlState.ts"
import { catalog, f, places, rows } from "./filterFixture.ts"

const counts = facetCounts(rows, f(), places)
const axeOptions = { rules: { "color-contrast": { enabled: false } } }

function Wrapper({ lang = "nb", children }: { lang?: Lang; children: ReactNode }) {
	return (
		<LanguageProvider lang={lang}>
			<AnnouncerProvider>{children}</AnnouncerProvider>
		</LanguageProvider>
	)
}

function renderBar({
	filters = {},
	withCatalog = true,
	withCounts = true,
	lang = "nb",
}: {
	filters?: Partial<Filters>
	withCatalog?: boolean
	withCounts?: boolean
	lang?: Lang
} = {}) {
	const onPatch = vi.fn()
	const onSearch = vi.fn()
	const ui = (next: Partial<Filters>) => (
		<Wrapper lang={lang}>
			<PlaceBar
				catalog={withCatalog ? catalog : null}
				withRows={null}
				counts={withCounts ? counts : null}
				filters={f(next)}
				onPatch={onPatch}
				onSearch={onSearch}
			/>
		</Wrapper>
	)
	const view = render(ui(filters))
	return {
		onPatch,
		onSearch,
		container: view.container,
		rerenderWith: (next: Partial<Filters>) => view.rerender(ui(next)),
	}
}

function Stateful({ initial }: { initial: Partial<Filters> }) {
	const [filters, setFilters] = useState(f(initial))
	return (
		<Wrapper>
			<PlaceBar
				catalog={catalog}
				withRows={null}
				counts={null}
				filters={filters}
				onPatch={(patch) => setFilters((current) => applyPatch(current, patch))}
				onSearch={vi.fn()}
			/>
		</Wrapper>
	)
}

test("without a catalog only Søk shows", () => {
	renderBar({ withCatalog: false })
	expect(
		screen.getByRole("searchbox", { name: "Søk etter tjeneste, kommune eller tema" })
	).toBeInTheDocument()
	expect(screen.queryByRole("combobox", { name: "Sted" })).not.toBeInTheDocument()
	expect(screen.queryAllByRole("radio")).toEqual([])
})

test("Søk and Sted sit in one bar, and the national choice sits under it with its counts", () => {
	renderBar()
	expect(screen.getByRole("searchbox")).toBeInTheDocument()
	expect(screen.getByRole("combobox", { name: "Sted" })).toBeInTheDocument()
	const national = screen.getByRole("group", { name: "Nasjonale tjenester" })
	expect(national.tagName).toBe("FIELDSET")
	expect(screen.getByRole("radio", { name: "Ta med, 5" })).toBeChecked()
	expect(screen.getByRole("radio", { name: "Skjul, 4" })).not.toBeChecked()
	expect(screen.getByRole("radio", { name: "Bare nasjonale, 1" })).not.toBeChecked()
})

test("no radio count while rows load", () => {
	renderBar({ withCounts: false })
	expect(screen.getByRole("radio", { name: "Ta med" })).toBeChecked()
})

test("choosing a radio patches national, and the radios follow the props", async () => {
	const user = userEvent.setup()
	const { onPatch, rerenderWith } = renderBar()
	await user.click(screen.getByRole("radio", { name: "Skjul, 4" }))
	expect(onPatch).toHaveBeenCalledWith({ national: "exclude" })
	rerenderWith({ national: "only" })
	expect(screen.getByRole("radio", { name: "Bare nasjonale, 1" })).toBeChecked()
	rerenderWith({})
	expect(screen.getByRole("radio", { name: "Ta med, 5" })).toBeChecked()
})

// Review Focus 3.
test("picking a place while Bare nasjonale is on switches the radio to Ta med and shows the chip", async () => {
	const user = userEvent.setup()
	render(<Stateful initial={{ national: "only" }} />)
	expect(screen.getByRole("radio", { name: "Bare nasjonale" })).toBeChecked()
	await user.type(screen.getByRole("combobox", { name: "Sted" }), "ham")
	await screen.findByRole("option", { name: "Hamar" })
	await user.keyboard("{ArrowDown}{Enter}")
	// The list stays open after a pick and hides the rest of the page from role queries.
	await user.keyboard("{Escape}")
	await waitFor(() => expect(screen.getByRole("radio", { name: "Ta med" })).toBeChecked())
	expect(
		[...document.querySelectorAll(".place-group .filter-chip-label")].map((el) => el.textContent)
	).toEqual(["Hamar"])
})

test("typing in Søk hands each value to onSearch", async () => {
	const user = userEvent.setup()
	const { onSearch } = renderBar()
	await user.type(screen.getByRole("searchbox"), "r")
	expect(onSearch).toHaveBeenCalledWith("r")
})

test("English labels", () => {
	renderBar({ lang: "en" })
	expect(screen.getByRole("combobox", { name: "Place" })).toBeInTheDocument()
	expect(screen.getByRole("group", { name: "National services" })).toBeInTheDocument()
	expect(screen.getByRole("radio", { name: "Include, 5" })).toBeChecked()
	expect(screen.getByRole("radio", { name: "Hide, 4" })).toBeInTheDocument()
	expect(screen.getByRole("radio", { name: "National only, 1" })).toBeInTheDocument()
})

describe.each(["nb", "en"] as const)("%s", (lang) => {
	test("has no axe violations", async () => {
		const { container } = renderBar({ lang, filters: { municipalities: ["3403"] } })
		expect(await axe(container, axeOptions)).toHaveNoViolations()
	})
})
