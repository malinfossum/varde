export type HistoryStatus = { canGoBack: boolean; canGoForward: boolean }

// The slice of the Navigation API (Baseline 2026) the buttons read. Typed here, so nothing
// depends on whether the installed TypeScript lib knows the API yet.
export type NavigationLike = {
	canGoBack: boolean
	canGoForward: boolean
	addEventListener(type: "currententrychange", listener: () => void): void
	removeEventListener(type: "currententrychange", listener: () => void): void
}

export function navigationOf(win: Window): NavigationLike | undefined {
	return (win as Window & { navigation?: NavigationLike }).navigation
}

// Without the Navigation API the router counts entries itself (spec: Knowing what is behind and
// ahead). `idx` is where you are and `highest` the furthest entry Forward can reach. A push drops
// every entry ahead, so the new entry becomes the highest. After a reload the highest is not
// known, so it starts at the current entry and Forward stays off: the safe direction.
export type HistoryCounter = {
	push(): number
	arrive(idx: number): void
	status(): HistoryStatus
}

export function createHistoryCounter(): HistoryCounter {
	let idx = 0
	let highest = 0
	return {
		push() {
			idx += 1
			highest = idx
			return idx
		},
		arrive(at) {
			idx = at
			highest = Math.max(highest, at)
		},
		status: () => ({ canGoBack: idx > 0, canGoForward: idx < highest }),
	}
}

export function readHistoryStatus(
	nav: NavigationLike | undefined,
	counter: HistoryCounter
): HistoryStatus {
	return nav ? { canGoBack: nav.canGoBack, canGoForward: nav.canGoForward } : counter.status()
}
