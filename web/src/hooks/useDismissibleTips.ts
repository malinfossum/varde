import { useEffect, useState } from "react"

// Hover tooltips must be dismissible without moving the pointer (WCAG 1.4.13). Escape hides a
// group's tips until the pointer enters or focus lands on one of its controls, which calls show().
// The acute strip, the footer and the history icons each call this once.
export function useDismissibleTips() {
	const [hidden, setHidden] = useState(false)
	useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") setHidden(true)
		}
		document.addEventListener("keydown", onKeyDown)
		return () => document.removeEventListener("keydown", onKeyDown)
	}, [])
	return { hidden, show: () => setHidden(false) }
}
