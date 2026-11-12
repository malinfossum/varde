import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import type { ReactElement } from "react"
import { describe, expect, test, vi } from "vitest"
import { axe } from "vitest-axe"
import { FacetGroup, FacetOption } from "../src/components/FacetGroup.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import type { Lang } from "../src/services/urlState.ts"

const options = [
	{ value: "rus", label: "Rus og avhengighet" },
	{ value: "bolig", label: "Bolig" },
	{ value: "okonomi", label: "Økonomi og gjeld" },
]
const counts = { rus: 12, bolig: 3, okonomi: 0 }
const axeOptions = { rules: { "color-contrast": { enabled: false } } }

function group({
	checked = [],
	withCounts = true,
	defaultOpen = true,
	onToggle = vi.fn(),
}: {
	checked?: string[]
	withCounts?: boolean
	defaultOpen?: boolean
	onToggle?: (value: string) => void
} = {}): ReactElement {
	return (
		<FacetGroup
			legend="Kategorier"
			options={options}
			checked={checked}
			counts={withCounts ? counts : null}
			defaultOpen={defaultOpen}
			onToggle={onToggle}
		/>
	)
}

const inLang = (lang: Lang, ui: ReactElement) => (
	<LanguageProvider lang={lang}>{ui}</LanguageProvider>
)

test("the group is a fieldset named by its legend, and each count is part of its option's name", () => {
	render(inLang("nb", group()))
	const groups = screen.getAllByRole("group", { name: "Kategorier" })
	expect(groups.map((g) => g.tagName)).toContain("FIELDSET")
	expect(screen.getByRole("checkbox", { name: "Rus og avhengighet, 12" })).not.toBeChecked()
	// A 0 stays visible and enabled, so nothing jumps and nothing is hidden (filter spec).
	expect(screen.getByRole("checkbox", { name: "Økonomi og gjeld, 0" })).toBeEnabled()
})

test("with no counts yet, no number renders and the names are the bare labels", () => {
	render(inLang("nb", group({ withCounts: false })))
	expect(screen.getByRole("checkbox", { name: "Rus og avhengighet" })).toBeInTheDocument()
	expect(screen.queryByText("12")).not.toBeInTheDocument()
	expect(screen.queryByText("0")).not.toBeInTheDocument()
})

test("ticking a box hands its value to onToggle", async () => {
	const onToggle = vi.fn()
	render(inLang("nb", group({ onToggle })))
	await userEvent.click(screen.getByRole("checkbox", { name: "Bolig, 3" }))
	expect(onToggle).toHaveBeenCalledWith("bolig")
})

// Review Focus 1: the boxes are the URL's, so Back and Forward re-tick them.
test("the boxes follow the props on every render", () => {
	const view = render(inLang("nb", group({ checked: ["bolig"] })))
	expect(screen.getByRole("checkbox", { name: "Bolig, 3" })).toBeChecked()
	view.rerender(inLang("nb", group({ checked: [] })))
	expect(screen.getByRole("checkbox", { name: "Bolig, 3" })).not.toBeChecked()
	view.rerender(inLang("nb", group({ checked: ["rus", "bolig"] })))
	expect(screen.getByRole("checkbox", { name: "Rus og avhengighet, 12" })).toBeChecked()
})

test("the summary says how many options are ticked, in both languages", () => {
	const view = render(inLang("nb", group({ checked: ["rus", "bolig"] })))
	expect(screen.getByText("2 valgt")).toBeInTheDocument()
	view.rerender(inLang("en", group({ checked: ["rus", "bolig"] })))
	expect(screen.getByText("2 selected")).toBeInTheDocument()
	view.rerender(inLang("nb", group()))
	expect(screen.queryByText(/valgt/)).not.toBeInTheDocument()
})

test("defaultOpen decides whether the group starts open", () => {
	const view = render(inLang("nb", group({ defaultOpen: false })))
	expect(view.container.querySelector("details")?.open).toBe(false)
	view.unmount()
	const open = render(inLang("nb", group({ defaultOpen: true })))
	expect(open.container.querySelector("details")?.open).toBe(true)
})

test("FacetOption radios share their name and carry their count", () => {
	render(
		<fieldset>
			<legend>Nasjonale tjenester</legend>
			<FacetOption type="radio" name="n" label="Ta med" count={5} checked onChange={vi.fn()} />
			<FacetOption
				type="radio"
				name="n"
				label="Skjul"
				count={4}
				checked={false}
				onChange={vi.fn()}
			/>
		</fieldset>
	)
	expect(screen.getByRole("radio", { name: "Ta med, 5" })).toBeChecked()
	expect(screen.getByRole("radio", { name: "Skjul, 4" })).toHaveAttribute("name", "n")
})

describe.each(["nb", "en"] as const)("%s", (lang) => {
	test("has no axe violations", async () => {
		const { container } = render(inLang(lang, group({ checked: ["rus"] })))
		expect(await axe(container, axeOptions)).toHaveNoViolations()
	})
})
