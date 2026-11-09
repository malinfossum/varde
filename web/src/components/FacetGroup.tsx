import { fill } from "../i18n/fill.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"

export type FacetChoice<T extends string> = { value: T; label: string }

// One option: a native control, its label, and the count once rows have loaded. The comma is
// hidden text at the end of the label's span and a real space sits between that span and the
// count, so a screen reader hears "Rus og avhengighet, 12" (filter spec, Accessibility and look).
// A space inside the hidden span is trimmed away by the name computation ("Rus og
// avhengighet,12" in jsdom), and the flex row drops the outer one visually.
export function FacetOption({
	type,
	name,
	label,
	count,
	checked,
	onChange,
}: {
	type: "checkbox" | "radio"
	name?: string
	label: string
	count: number | null
	checked: boolean
	onChange: () => void
}) {
	return (
		<label className="facet-option">
			<input
				type={type}
				name={name}
				checked={checked}
				onChange={onChange}
				className="facet-input"
			/>
			<span className="facet-label">
				{label}
				{count !== null && <span className="hidden-inline">,</span>}
			</span>
			{count !== null && (
				<>
					{" "}
					<span className="facet-count">{count}</span>
				</>
			)}
		</label>
	)
}

// One facet group (filter spec, FacetGroup). The summary is what a sighted user reads and
// clicks; the legend repeats it for a screen reader, which hears the group before each option.
// With counts null (rows still loading) no count renders at all, because a "0" would read as
// "nothing here". The ticked count shows in the summary, so a closed group still tells.
export function FacetGroup<T extends string>({
	legend,
	options,
	checked,
	counts,
	defaultOpen,
	onToggle,
}: {
	legend: string
	options: readonly FacetChoice<T>[]
	checked: readonly T[]
	counts: Readonly<Record<T, number>> | null
	defaultOpen: boolean
	onToggle: (value: T) => void
}) {
	const t = useTranslation()
	const ticked = options.filter((o) => checked.includes(o.value)).length
	return (
		<details className="facet-group" open={defaultOpen}>
			<summary>
				<span>{legend}</span>
				<span className="facet-summary-end">
					{ticked > 0 && (
						<span className="facet-ticked">{fill(t("filter.ticked"), { n: ticked })}</span>
					)}
					<span aria-hidden="true" className="facet-chevron">
						▾
					</span>
				</span>
			</summary>
			<fieldset className="facet-fieldset">
				<legend className="visually-hidden">{legend}</legend>
				{options.map((o) => (
					<FacetOption
						key={o.value}
						type="checkbox"
						label={o.label}
						count={counts ? (counts[o.value] ?? 0) : null}
						checked={checked.includes(o.value)}
						onChange={() => onToggle(o.value)}
					/>
				))}
			</fieldset>
		</details>
	)
}
