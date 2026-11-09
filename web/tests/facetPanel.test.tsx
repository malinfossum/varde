import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { type ReactNode, useState } from "react"
import { describe, expect, test, vi } from "vitest"
import { axe } from "vitest-axe"
import { FacetDialog, FacetSidebar } from "../src/components/FacetPanel.tsx"
import { AnnouncerProvider } from "../src/components/StatusRegion.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { facetCounts } from "../src/services/facets.ts"
import { applyPatch } from "../src/services/filters.ts"
import type { Lang } from "../src/services/urlState.ts"
import { f, places, rows } from "./filterFixture.ts"

// With nothing ticked: rus 3, bolig 1, vold-og-overgrep 1, lavterskel 1, dognapent 1, free 1.
const counts = facetCounts(rows, f(), places)
const axeOptions = { rules: { "color-contrast": { enabled: false } } }

function Wrapper({ lang = "nb", children }: { lang?: Lang; children: ReactNode }) {
	return (
		<LanguageProvider lang={lang}>
			<AnnouncerProvider>{children}</AnnouncerProvider>
		</LanguageProvider>
	)
}

function fieldset(legend: string): HTMLElement {
	const found = screen
		.getAllByRole("group", { name: legend, hidden: true })
		.find((g) => g.tagName === "FIELDSET")
	if (!found) throw new Error(`no fieldset named ${legend}`)
	return found
}
const optionLabels = (legend: string) =>
	[...fieldset(legend).querySelectorAll(".facet-label")].map((el) => el.firstChild?.textContent)

function StatefulDialog({
	lang = "nb",
	totalCount = 7,
}: {
	lang?: Lang
	totalCount?: number | null
}) {
	const [filters, setFilters] = useState(f())
	return (
		<Wrapper lang={lang}>
			<FacetDialog
				filters={filters}
				counts={counts}
				totalCount={totalCount}
				onPatch={(patch) => setFilters((current) => applyPatch(current, patch))}
			/>
		</Wrapper>
	)
}

test("the sidebar holds Kategorier and Egenskaper open, Pris closed, and no Tilbyder", () => {
	render(
		<Wrapper>
			<FacetSidebar loaded filters={f()} counts={counts} onPatch={vi.fn()} />
		</Wrapper>
	)
	const aside = screen.getByRole("complementary", { name: "Filtre" })
	const groups = [...aside.querySelectorAll("details")].map((d) => [
		d.querySelector("summary > span")?.textContent,
		d.open,
	])
	expect(groups).toEqual([
		["Kategorier", true],
		["Egenskaper", true],
		["Pris", false],
	])
	expect(within(aside).queryByText("Tilbyder")).not.toBeInTheDocument()
})

test("the sidebar is an empty column until the catalog has loaded", () => {
	render(
		<Wrapper>
			<FacetSidebar loaded={false} filters={f()} counts={null} onPatch={vi.fn()} />
		</Wrapper>
	)
	expect(screen.getByRole("complementary", { name: "Filtre" })).toBeEmptyDOMElement()
})

test("Kategorier never offers Lavterskeltilbud, and Egenskaper is Lavterskel and Døgnåpent only", () => {
	render(
		<Wrapper>
			<FacetSidebar loaded filters={f()} counts={counts} onPatch={vi.fn()} />
		</Wrapper>
	)
	expect(optionLabels("Kategorier")).toEqual([
		"Økonomi og gjeld",
		"Bolig",
		"Psykisk helse",
		"Rus og avhengighet",
		"Vold og overgrep",
		"Familie og barn",
		"Arbeid",
		"Juridisk hjelp",
		"Nødtjenester",
	])
	// Call C1: the badge strings.
	expect(optionLabels("Egenskaper")).toEqual(["Lavterskel", "Døgnåpent"])
	expect(optionLabels("Pris")).toEqual(["Gratis", "Delvis gratis", "Koster penger"])
})

test("a tick adds its value to its own group and a second tick removes it", async () => {
	const user = userEvent.setup()
	const onPatch = vi.fn()
	render(
		<Wrapper>
			<FacetSidebar loaded filters={f({ categories: ["rus"] })} counts={counts} onPatch={onPatch} />
		</Wrapper>
	)
	await user.click(screen.getByRole("checkbox", { name: "Bolig, 1" }))
	expect(onPatch).toHaveBeenLastCalledWith({ categories: ["rus", "bolig"] })
	await user.click(screen.getByRole("checkbox", { name: "Rus og avhengighet, 3" }))
	expect(onPatch).toHaveBeenLastCalledWith({ categories: [] })
	await user.click(screen.getByRole("checkbox", { name: "Døgnåpent, 1" }))
	expect(onPatch).toHaveBeenLastCalledWith({ features: ["dognapent"] })
	await user.click(screen.getByRole("checkbox", { name: "Gratis, 1", hidden: true }))
	expect(onPatch).toHaveBeenLastCalledWith({ costs: ["free"] })
})

test("the trigger counts ticked facet options, not places or the national choice", () => {
	const view = render(
		<Wrapper>
			<FacetDialog filters={f()} counts={counts} totalCount={7} onPatch={vi.fn()} />
		</Wrapper>
	)
	expect(screen.getByRole("button", { name: "Flere filtre" })).toBeInTheDocument()
	view.rerender(
		<Wrapper>
			<FacetDialog
				filters={f({
					categories: ["rus"],
					features: ["lavterskel"],
					costs: ["free"],
					municipalities: ["3403"],
					national: "exclude",
				})}
				counts={counts}
				totalCount={7}
				onPatch={vi.fn()}
			/>
		</Wrapper>
	)
	expect(screen.getByRole("button", { name: "Flere filtre (3)" })).toBeInTheDocument()
})

test("the dialog applies ticks live and Vis N treff closes it, with focus back on the trigger", async () => {
	const user = userEvent.setup()
	render(<StatefulDialog />)
	await user.click(screen.getByRole("button", { name: "Flere filtre" }))
	const dialog = await screen.findByRole("dialog", { name: "Filtre" })
	await user.click(within(dialog).getByRole("checkbox", { name: "Rus og avhengighet, 3" }))
	expect(within(dialog).getByRole("checkbox", { name: "Rus og avhengighet, 3" })).toBeChecked()
	expect(screen.getByRole("dialog", { name: "Filtre" })).toBeInTheDocument()
	await user.click(within(dialog).getByRole("button", { name: "Vis 7 treff" }))
	await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
	await waitFor(() =>
		expect(screen.getByRole("button", { name: "Flere filtre (1)" })).toHaveFocus()
	)
})

test("the dialog carries its own quick exit, since it covers the header", async () => {
	const user = userEvent.setup()
	render(<StatefulDialog />)
	await user.click(screen.getByRole("button", { name: "Flere filtre" }))
	const dialog = await screen.findByRole("dialog", { name: "Filtre" })
	expect(within(dialog).getByRole("link", { name: "Forlat siden" })).toHaveAttribute(
		"href",
		"https://www.google.com"
	)
})

test("Escape closes the dialog and focus goes back to the trigger", async () => {
	const user = userEvent.setup()
	render(<StatefulDialog />)
	const trigger = screen.getByRole("button", { name: "Flere filtre" })
	await user.click(trigger)
	await screen.findByRole("dialog", { name: "Filtre" })
	await user.keyboard("{Escape}")
	await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
	await waitFor(() => expect(trigger).toHaveFocus())
})

test.each<[Lang, number | null, string]>([
	["nb", 1, "Vis 1 treff"],
	["nb", null, "Vis treff"],
	["en", 1, "Show 1 result"],
	["en", 12, "Show 12 results"],
])("the footer in %s for %s results reads %s", async (lang, totalCount, label) => {
	const user = userEvent.setup()
	render(<StatefulDialog lang={lang} totalCount={totalCount} />)
	await user.click(
		screen.getByRole("button", { name: lang === "nb" ? "Flere filtre" : "More filters" })
	)
	const dialog = await screen.findByRole("dialog")
	expect(within(dialog).getByRole("button", { name: label })).toBeInTheDocument()
})

test("the sidebar and an open dialog never share an id", async () => {
	const user = userEvent.setup()
	render(
		<Wrapper>
			<FacetSidebar loaded filters={f()} counts={counts} onPatch={vi.fn()} />
			<FacetDialog filters={f()} counts={counts} totalCount={7} onPatch={vi.fn()} />
		</Wrapper>
	)
	await user.click(screen.getByRole("button", { name: "Flere filtre" }))
	await screen.findByRole("dialog")
	const ids = [...document.querySelectorAll("[id]")].map((el) => el.id)
	expect(new Set(ids).size).toBe(ids.length)
})

describe.each(["nb", "en"] as const)("%s", (lang) => {
	test("the sidebar and the open dialog have no axe violations", async () => {
		const user = userEvent.setup()
		const sidebar = render(
			<Wrapper lang={lang}>
				<FacetSidebar
					loaded
					filters={f({ categories: ["rus"] })}
					counts={counts}
					onPatch={vi.fn()}
				/>
			</Wrapper>
		)
		expect(await axe(sidebar.container, axeOptions)).toHaveNoViolations()
		sidebar.unmount()
		render(<StatefulDialog lang={lang} />)
		await user.click(
			screen.getByRole("button", { name: lang === "nb" ? "Flere filtre" : "More filters" })
		)
		// Scoped to the dialog: jsdom has no inert, so the trigger behind the modal is aria-hidden
		// there, which a real browser (inert) never reports (Verified fact 6).
		expect(await axe(await screen.findByRole("dialog"), axeOptions)).toHaveNoViolations()
	})
})
