import { type FocusEvent, type KeyboardEvent, useCallback, useEffect, useRef } from "react"

// Behaviour ported from Workbench DS 3.8.0 components/picker.js. Workbench binds one set of
// listeners to the document from a classic script; Varde is React with a prerendered DOM and a
// CSP that hashes its one inline script, so the same rules live here, per picker. The edge
// shift below is the one inline style, set after mount, never in rendered markup.
const EDGE_GAP = 8
const KEYS = ["ArrowDown", "ArrowUp", "Home", "End"]

export function usePicker() {
	const ref = useRef<HTMLDetailsElement>(null)

	useEffect(() => {
		const onPointerDown = (event: PointerEvent) => {
			const details = ref.current
			if (details?.open && !details.contains(event.target as Node)) details.open = false
		}
		document.addEventListener("pointerdown", onPointerDown)
		return () => document.removeEventListener("pointerdown", onPointerDown)
	}, [])

	const rows = () => Array.from(ref.current?.querySelectorAll<HTMLElement>(".picker-row") ?? [])

	const closeAndFocus = useCallback(() => {
		const details = ref.current
		if (!details) return
		details.open = false
		details.querySelector("summary")?.focus()
	}, [])

	const onToggle = () => {
		const details = ref.current
		if (!details) return
		const list = details.querySelector<HTMLElement>(".picker-list")
		if (list) list.style.translate = ""
		if (!details.open) return
		for (const other of document.querySelectorAll<HTMLDetailsElement>("details.picker[open]")) {
			if (other !== details) other.open = false
		}
		if (list) {
			const overflow = EDGE_GAP - list.getBoundingClientRect().left
			if (overflow > 0) list.style.translate = `${overflow}px 0`
		}
		const all = rows()
		const active = all.find(
			(row) => row.hasAttribute("aria-current") || row.getAttribute("aria-pressed") === "true"
		)
		;(active ?? all[0])?.focus()
	}

	const onKeyDown = (event: KeyboardEvent<HTMLDetailsElement>) => {
		if (!ref.current?.open) return
		if (event.key === "Escape") {
			event.preventDefault()
			closeAndFocus()
			return
		}
		if (!KEYS.includes(event.key)) return
		event.preventDefault()
		const all = rows()
		if (all.length === 0) return
		const at = all.indexOf(document.activeElement as HTMLElement)
		let next: number
		if (event.key === "Home") next = 0
		else if (event.key === "End") next = all.length - 1
		else {
			const step = event.key === "ArrowDown" ? 1 : -1
			next = at === -1 ? (step === 1 ? 0 : all.length - 1) : (at + step + all.length) % all.length
		}
		all[next].focus()
	}

	// A null relatedTarget (the window lost focus) is left to the pointer-down handler.
	const onBlur = (event: FocusEvent<HTMLDetailsElement>) => {
		const details = ref.current
		const to = event.relatedTarget
		if (details?.open && to instanceof Node && !details.contains(to)) details.open = false
	}

	return { ref, onToggle, onKeyDown, onBlur, closeAndFocus }
}
