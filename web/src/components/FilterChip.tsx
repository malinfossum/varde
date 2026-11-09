import { Button, Tag } from "react-aria-components"

// One removable chip inside a react-aria TagList. The row takes its name from textValue, and
// react-aria names the remove button with its own localised "Fjern" / "Remove" plus that row
// name (aria-labelledby), so a screen reader hears "Fjern Hamar", never a row of identical
// "Fjern" buttons. An aria-label here would be overridden by that aria-labelledby and read
// "Fjern Hamar Hamar".
export function FilterChip({ id, label }: { id: string; label: string }) {
	return (
		<Tag id={id} textValue={label} className="filter-chip">
			<span className="filter-chip-label">{label}</span>
			<Button slot="remove" className="filter-chip-remove">
				<span aria-hidden="true">×</span>
			</Button>
		</Tag>
	)
}
