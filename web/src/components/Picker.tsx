import type { ReactNode } from "react"
import { usePicker } from "../hooks/usePicker.ts"

// The Workbench DS 3.8.0 picker (components/picker.css, same markup and class names): a native
// <details>, so the menu opens and closes before hydration and without JavaScript. The trigger
// carries its name once, in the visually hidden span; the icon and the short visible value are
// aria-hidden so the name is never read twice.
export function Picker({
	name,
	value,
	icon,
	children,
}: {
	name: string
	value: string | null
	icon: ReactNode
	children: (closeAndFocus: () => void) => ReactNode
}) {
	const { ref, onToggle, onKeyDown, onBlur, closeAndFocus } = usePicker()
	return (
		<details ref={ref} className="picker" onToggle={onToggle} onKeyDown={onKeyDown} onBlur={onBlur}>
			<summary className="btn-secondary min-w-11">
				<span aria-hidden="true" className="inline-flex">
					{icon}
				</span>
				<span aria-hidden="true" className="picker-value">
					{value ?? name}
				</span>
				<span className="visually-hidden">{value ? `${name}: ${value}` : name}</span>
			</summary>
			{/* biome-ignore lint/a11y/useSemanticElements: Workbench picker markup; a fieldset would bring its own UA box styles into the ported CSS */}
			<div className="picker-list" role="group" aria-label={name}>
				{children(closeAndFocus)}
			</div>
		</details>
	)
}
