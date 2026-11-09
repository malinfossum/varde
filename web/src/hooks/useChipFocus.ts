import { useEffect, useRef } from "react"

// Where focus goes after a chip is removed (filter spec, Components): to the chip that took its
// place, or the one before it when it was last in the row, and to `fallback` once none are left.
// Never to <body>. react-aria moves focus between the remaining chips by itself, but when the
// last one goes its TagGroup only focuses its own container, and here the TagGroup unmounts with
// that chip, so I let this hook own every case.
export function useChipFocus(count: number, fallback: () => void) {
	const listRef = useRef<HTMLDivElement>(null)
	const pending = useRef<number | null>(null)
	// biome-ignore lint/correctness/useExhaustiveDependencies: count is the trigger; fallback is read when it fires
	useEffect(() => {
		const index = pending.current
		if (index === null) return
		pending.current = null
		if (count === 0) {
			fallback()
			return
		}
		const rows = listRef.current?.querySelectorAll<HTMLElement>('[role="row"]')
		rows?.[Math.min(index, count - 1)]?.focus()
	}, [count])
	return {
		listRef,
		// Called with the removed chip's index, just before the patch that removes it.
		removing: (index: number) => {
			pending.current = index
		},
	}
}
