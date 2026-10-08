import { useEffect } from "react"
import { createShiftCounter, leave } from "../services/quickExit.ts"

// Mounted once, in App's shell. Capture phase, so a widget that stops propagation (the
// react-aria combobox) cannot swallow the shortcut. It fires inside inputs too, as on GOV.UK.
export function useShiftExit(onExit: () => void = leave): void {
	useEffect(() => {
		const counter = createShiftCounter(onExit)
		const down = (event: KeyboardEvent) => counter.keydown(event)
		const up = (event: KeyboardEvent) => counter.keyup(event)
		document.addEventListener("keydown", down, true)
		document.addEventListener("keyup", up, true)
		return () => {
			document.removeEventListener("keydown", down, true)
			document.removeEventListener("keyup", up, true)
		}
	}, [onExit])
}
