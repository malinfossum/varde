import { useEffect, useState } from "react"
import { useHistoryEvents, useNavigate } from "../navigation.ts"
import { type HistoryStatus, navigationOf, readHistoryStatus } from "../services/historyCounter.ts"

// The state and actions behind both layouts (spec: Behaviour). Back goes back when there is an
// entry behind, goes home through the router when there is none, and is disabled on the landing
// page then. Forward goes forward or is disabled.
export function useHistoryButtons(atLanding: boolean) {
	const navigate = useNavigate()
	const { subscribe, counter } = useHistoryEvents()
	// null until mounted: the prerender and the first client render show both buttons disabled,
	// so the two renders match (spec: Before hydration).
	const [status, setStatus] = useState<HistoryStatus | null>(null)

	useEffect(() => {
		const nav = navigationOf(window)
		const update = () => setStatus(readHistoryStatus(nav, counter))
		update()
		const unsubscribe = subscribe(update)
		nav?.addEventListener("currententrychange", update)
		// A page restored from the back/forward cache keeps the state it had when it was left.
		window.addEventListener("pageshow", update)
		return () => {
			unsubscribe()
			nav?.removeEventListener("currententrychange", update)
			window.removeEventListener("pageshow", update)
		}
	}, [subscribe, counter])

	const canGoBack = status?.canGoBack ?? false
	return {
		backDisabled: status === null || (!canGoBack && atLanding),
		forwardDisabled: !(status?.canGoForward ?? false),
		back: () => (canGoBack ? window.history.back() : navigate("/", "")),
		forward: () => window.history.forward(),
	}
}
