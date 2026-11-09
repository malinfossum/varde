import { cleanup, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { type ReactNode, useState } from "react"
import { describe, expect, test, vi } from "vitest"
import { axe } from "vitest-axe"
import { PlaceField } from "../src/components/PlaceField.tsx"
import { AnnouncerProvider } from "../src/components/StatusRegion.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import type { Catalog } from "../src/services/data.ts"
import { applyPatch, type Filters } from "../src/services/filters.ts"
import type { Lang } from "../src/services/urlState.ts"
import { f, catalog as fixture } from "./filterFixture.ts"

// The shared fixture (Oslo, Hamar, Ringsaker) plus Løten for the diacritics, and one made-up
// alias row (aliases.json ships empty).
const catalog: Catalog = {
	...fixture,
	municipalities: [
		...fixture.municipalities,
		{ id: 6, name: "Løten", county: "Innlandet", number: "3412", countyNumber: "34" },
	],
	aliases: [{ alias: "Brumunddal", number: "3411", source: "test fixture" }],
}
const axeOptions = { rules: { "color-contrast": { enabled: false } } }

function Wrapper({ lang = "nb", children }: { lang?: Lang; children: ReactNode }) {
	return (
		<LanguageProvider lang={lang}>
			<AnnouncerProvider>{children}</AnnouncerProvider>
		</LanguageProvider>
	)
}

function renderField(filters: Partial<Filters> = {}, lang: Lang = "nb") {
	const onPatch = vi.fn()
	const ui = (next: Partial<Filters>) => (
		<Wrapper lang={lang}>
			<PlaceField catalog={catalog} withRows={null} filters={f(next)} onPatch={onPatch} />
		</Wrapper>
	)
	const view = render(ui(filters))
	return {
		onPatch,
		container: view.container,
		rerenderWith: (next: Partial<Filters>) => view.rerender(ui(next)),
	}
}

// Stands in for ListPage: every patch goes through applyPatch, as the URL would.
function Stateful({ initial }: { initial: Partial<Filters> }) {
	const [filters, setFilters] = useState(f(initial))
	return (
		<Wrapper>
			<PlaceField
				catalog={catalog}
				withRows={null}
				filters={filters}
				onPatch={(patch) => setFilters((current) => applyPatch(current, patch))}
			/>
		</Wrapper>
	)
}

const sted = () => screen.getByRole("combobox", { name: "Sted" })
const chipLabels = () =>
	[...document.querySelectorAll(".place-group .filter-chip-label")].map((el) => el.textContent)
const chipRow = (label: string) =>
	screen.getByText(label, { selector: ".filter-chip-label" }).closest<HTMLElement>('[role="row"]')

// A section header labels its group through aria-labelledby, so a missing or unlabelled group
// shows up as a missing or empty entry.
function groupNames(): string[] {
	return screen.getAllByRole("group").map((group) => {
		const id = group.getAttribute("aria-labelledby")
		return (id && document.getElementById(id)?.textContent) || ""
	})
}
const optionNames = () => screen.getAllByRole("option").map((option) => option.textContent ?? "")

test("focus opens the list: Fylker, then Kommuner, each in nb order, Oslo once as the kommune", async () => {
	const user = userEvent.setup()
	renderField()
	await user.click(sted())
	await screen.findByRole("listbox")
	expect(groupNames()).toEqual(["Fylker", "Kommuner"])
	expect(optionNames()).toEqual(["Innlandet", "Hamar", "Løten", "Oslo", "Ringsaker"])
})

test("typing folds diacritics, Enter picks, the list stays open and the text clears", async () => {
	const user = userEvent.setup()
	const { onPatch, rerenderWith } = renderField()
	await user.type(sted(), "lot")
	expect(await screen.findByRole("option", { name: "Løten" })).toBeInTheDocument()
	expect(screen.queryByRole("option", { name: "Hamar" })).not.toBeInTheDocument()
	await user.keyboard("{ArrowDown}{Enter}")
	expect(onPatch).toHaveBeenCalledWith({ counties: [], municipalities: ["3412"] })
	// ListPage answers with the new URL, and the field shows it.
	rerenderWith({ municipalities: ["3412"] })
	expect(screen.getByRole("listbox")).toBeInTheDocument()
	expect(sted()).toHaveValue("")
	expect(chipLabels()).toEqual(["Løten"])
})

test("Escape closes the list without picking", async () => {
	const user = userEvent.setup()
	const { onPatch } = renderField()
	await user.type(sted(), "ham")
	await screen.findByRole("listbox")
	await user.keyboard("{Escape}")
	await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument())
	expect(onPatch).not.toHaveBeenCalled()
})

// Review Focus 5.
test("text typed but never picked filters nothing and makes no chip, also after Tab", async () => {
	const user = userEvent.setup()
	const { onPatch } = renderField()
	await user.type(sted(), "ham")
	await screen.findByRole("option", { name: "Hamar" })
	await user.tab()
	expect(onPatch).not.toHaveBeenCalled()
	expect(screen.queryByRole("grid", { name: "Sted" })).not.toBeInTheDocument()
	expect(sted()).toHaveValue("")
})

test("no match shows the coverage note, and its link asks for national services only", async () => {
	const user = userEvent.setup()
	const { onPatch } = renderField()
	await user.type(sted(), "zzz")
	expect(await screen.findByText(/Fant ikke kommunen din/)).toBeInTheDocument()
	await user.click(
		screen.getByRole("button", { name: "Se nasjonale tjenester som gjelder hele landet" })
	)
	expect(onPatch).toHaveBeenCalledWith({ national: "only" })
})

test("a town alias offers its kommune and picks it", async () => {
	const user = userEvent.setup()
	const { onPatch } = renderField()
	await user.type(sted(), "brum")
	expect(await screen.findByRole("option", { name: "Ringsaker (Brumunddal)" })).toBeInTheDocument()
	await user.keyboard("{ArrowDown}{Enter}")
	expect(onPatch).toHaveBeenCalledWith({ counties: [], municipalities: ["3411"] })
})

// Review Focus 1: the chips are the URL's, never the field's own memory.
test("the chips follow the URL, so Back, Forward and every outside change show at once", () => {
	const { rerenderWith } = renderField({ municipalities: ["3403"] })
	expect(chipLabels()).toEqual(["Hamar"])
	rerenderWith({})
	expect(screen.queryByRole("grid", { name: "Sted" })).not.toBeInTheDocument()
	rerenderWith({ counties: ["34"], municipalities: ["0301"] })
	expect(chipLabels()).toEqual(["Innlandet", "Oslo"])
})

test("removing a chip moves focus to the next chip, and the last one to the input", async () => {
	const user = userEvent.setup()
	render(<Stateful initial={{ counties: ["34"], municipalities: ["3403"] }} />)
	expect(chipLabels()).toEqual(["Innlandet", "Hamar"])
	await user.click(screen.getByRole("button", { name: "Fjern Innlandet" }))
	await waitFor(() => expect(chipRow("Hamar")).toHaveFocus())
	await user.click(screen.getByRole("button", { name: "Fjern Hamar" }))
	await waitFor(() => expect(sted()).toHaveFocus())
	expect(document.body).not.toHaveFocus()
})

test("labels and react-aria's own words follow the app's language", async () => {
	// react-aria names the listbox from its own locale bundle. It said Forslag / Suggestions for
	// the single combobox; if multiple mode names it differently, assert what each language
	// gives now. The point is that nb and en differ.
	const user = userEvent.setup()
	renderField({}, "nb")
	await user.click(sted())
	expect(await screen.findByRole("listbox")).toHaveAttribute("aria-label", "Forslag")
	cleanup()
	renderField({ municipalities: ["3403"] }, "en")
	const place = screen.getByRole("combobox", { name: "Place" })
	expect(place).toHaveAttribute("placeholder", "County, municipality or town")
	expect(screen.getByRole("button", { name: "Remove Hamar" })).toBeInTheDocument()
	await user.click(place)
	expect(await screen.findByRole("listbox")).toHaveAttribute("aria-label", "Suggestions")
	expect(groupNames()).toEqual(["Counties", "Municipalities"])
})

describe.each(["nb", "en"] as const)("%s", (lang) => {
	test("has no axe violations, closed and open", async () => {
		const user = userEvent.setup()
		const { container } = renderField({ counties: ["34"], municipalities: ["3403"] }, lang)
		expect(await axe(container, axeOptions)).toHaveNoViolations()
		await user.click(screen.getByRole("combobox"))
		expect(await axe(await screen.findByRole("listbox"), axeOptions)).toHaveNoViolations()
	})
})
