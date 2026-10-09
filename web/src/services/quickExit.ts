// The quick exit's one destination: neutral and unremarkable. location.replace, so this page
// does not survive the back button (base spec, "Browser history and the quick exit").
export const EXIT_URL = "https://www.google.com"

export function leave(): void {
	window.location.replace(EXIT_URL)
}

export type KeyLike = { key: string; repeat: boolean; isComposing: boolean }

const WINDOW_MS = 5000

// GOV.UK's "Exit this page" shortcut: Shift pressed and released three times on its own.
// A Shift held while another key went down (a capital letter, a shortcut) does not count,
// and that other key resets the count. Key repeat from holding Shift counts once. The count
// restarts 5 seconds after its first press, so a slow third press does nothing.
export function createShiftCounter(onTrigger: () => void, now: () => number = Date.now) {
	let count = 0
	let first = 0
	let clean = false
	return {
		keydown(event: KeyLike) {
			if (event.isComposing) return
			if (event.key !== "Shift") {
				count = 0
				clean = false
				return
			}
			if (!event.repeat) clean = true
		},
		keyup(event: KeyLike) {
			if (event.isComposing || event.key !== "Shift" || !clean) return
			clean = false
			const at = now()
			if (count === 0 || at - first > WINDOW_MS) {
				count = 0
				first = at
			}
			count += 1
			if (count === 3) {
				count = 0
				onTrigger()
			}
		},
	}
}
