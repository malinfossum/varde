import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { type ReactNode, useRef, useState } from "react"
import { describe, expect, test, vi } from "vitest"
import { axe } from "vitest-axe"
import { ActiveFilters } from "../src/components/ActiveFilters.tsx"
import { AnnouncerProvider } from "../src/components/StatusRegion.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import { applyPatch, CLEAR_ALL, type Filters } from "../src/services/filters.ts"
import type { Lang } from "../src/services/urlState.ts"
import { catalog, f } from "./filterFixture.ts"

const axeOptions = { rules: { "color-contrast": { enabled: false } } }

function Wrapper({ lang = "nb", children }: { lang?: Lang; children: ReactNode }) {
	return (
		<LanguageProvider lang={lang}>
			<AnnouncerProvider>{children}</AnnouncerProvider>
		</LanguageProvider>
	)
}

function renderRow(filters: Partial<Filters>, lang: Lang = "nb") {
	const onPatch = vi.fn()
	const view = render(
		<Wrapper lang={lang}>
			<ActiveFilters
				filters={f(filters)}
				catalog={catalog}
				onPatch={onPatch}
				focusResults={() => {}}
			/>
		</Wrapper>
	)
	return { onPatch, container: view.container }
}

// Stands in for ListPage: the heading is the empty state's, every patch goes through applyPatch
// as the URL would, and a focus request is answered at once. The real ListPage waits for the
// next answer first; list.test.tsx covers that against <App />.
function Stateful({ initial }: { initial: Partial<Filters> }) {
	const [filters, setFilters] = useState(f(initial))
	const headingRef = useRef<HTMLHeadingElement>(null)
	return (
		<Wrapper>
			<h1 ref={headingRef} tabIndex={-1}>
				Ingen treff
			</h1>
			<ActiveFilters
				filters={filters}
				catalog={catalog}
				focusResults={() => headingRef.current?.focus()}
				onPatch={(patch) => setFilters((current) => applyPatch(current, patch))}
			/>
		</Wrapper>
	)
}

const chipLabels = () =>
	[...document.querySelectorAll(".filter-chip-label")].map((el) => el.textContent)
const chipRow = (label: string) =>
	screen.getByText(label, { selector: ".filter-chip-label" }).closest<HTMLElement>('[role="row"]')

test("nothing set shows nothing", () => {
	renderRow({})
	expect(screen.queryByRole("grid")).not.toBeInTheDocument()
	expect(screen.queryByRole("button")).not.toBeInTheDocument()
})

test("one chip per active value under Valgte filtre, each with a named remove button", () => {
	renderRow({ municipalities: ["3403"], national: "exclude", categories: ["rus"] })
	expect(screen.getByRole("grid", { name: "Valgte filtre" })).toBeInTheDocument()
	expect(chipLabels()).toEqual(["Hamar", "Skjul nasjonale", "Rus og avhengighet"])
	expect(screen.getByRole("button", { name: "Fjern Hamar" })).toBeInTheDocument()
})

test("removing a chip patches only its own value", async () => {
	const { onPatch } = renderRow({ municipalities: ["3403"], categories: ["rus"] })
	await userEvent.click(screen.getByRole("button", { name: "Fjern Rus og avhengighet" }))
	expect(onPatch).toHaveBeenCalledWith({ categories: [] })
})

test("Delete on a chip moves focus to the next chip, or the one before when it was last", async () => {
	const user = userEvent.setup()
	render(
		<Stateful initial={{ municipalities: ["3403"], national: "exclude", categories: ["rus"] }} />
	)
	chipRow("Skjul nasjonale")?.focus()
	await user.keyboard("{Delete}")
	await waitFor(() => expect(chipRow("Rus og avhengighet")).toHaveFocus())
	await user.keyboard("{Delete}")
	await waitFor(() => expect(chipRow("Hamar")).toHaveFocus())
})

// Review Focus 2.
test("removing the last chip on an empty list sends focus to the empty state's heading", async () => {
	const user = userEvent.setup()
	render(<Stateful initial={{ search: "zzz", categories: ["rus"] }} />)
	await user.click(screen.getByRole("button", { name: "Fjern Rus og avhengighet" }))
	await waitFor(() =>
		expect(screen.getByRole("heading", { level: 1, name: "Ingen treff" })).toHaveFocus()
	)
	expect(document.body).not.toHaveFocus()
	// The search text is still set, so Nullstill alt stays.
	expect(screen.getByRole("button", { name: "Nullstill alt" })).toBeInTheDocument()
})

test.each<[string, Partial<Filters>]>([
	["search text", { search: "hamar" }],
	["a kommune", { municipalities: ["3403"] }],
	["Bare nasjonale", { national: "only" }],
	["an Egenskap", { features: ["lavterskel"] }],
])("Nullstill alt shows with %s alone and clears everything", async (_name, filters) => {
	const { onPatch } = renderRow(filters)
	await userEvent.click(screen.getByRole("button", { name: "Nullstill alt" }))
	expect(onPatch).toHaveBeenCalledWith(CLEAR_ALL)
})

test("Nullstill alt takes the row with it and sends focus to the heading", async () => {
	const user = userEvent.setup()
	render(<Stateful initial={{ search: "zzz", categories: ["rus"] }} />)
	await user.click(screen.getByRole("button", { name: "Nullstill alt" }))
	await waitFor(() =>
		expect(screen.getByRole("heading", { level: 1, name: "Ingen treff" })).toHaveFocus()
	)
	expect(screen.queryByRole("button", { name: "Nullstill alt" })).not.toBeInTheDocument()
})

test("English labels", () => {
	renderRow({ municipalities: ["3403"], national: "exclude" }, "en")
	expect(screen.getByRole("grid", { name: "Selected filters" })).toBeInTheDocument()
	expect(chipLabels()).toEqual(["Hamar", "Hide national"])
	expect(screen.getByRole("button", { name: "Remove Hamar" })).toBeInTheDocument()
	expect(screen.getByRole("button", { name: "Clear all" })).toBeInTheDocument()
})

describe.each(["nb", "en"] as const)("%s", (lang) => {
	test("has no axe violations", async () => {
		const { container } = renderRow(
			{ counties: ["34"], categories: ["rus"], costs: ["free"] },
			lang
		)
		expect(await axe(container, axeOptions)).toHaveNoViolations()
	})
})
