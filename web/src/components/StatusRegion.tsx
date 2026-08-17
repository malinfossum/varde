import { createContext, type ReactNode, useContext, useRef, useState } from "react"

const AnnouncerContext = createContext<(message: string) => void>(() => {})

// Two announcements can legitimately land close together (e.g. ListPage's "Laster …" and
// LanguageToggle's language confirmation). Replacing outright would let the second stomp the
// first before a screen reader has a chance to read it. Within this window, compose instead.
const COMPOSE_WINDOW_MS = 1500

export function AnnouncerProvider({ children }: { children: ReactNode }) {
	const [message, setMessage] = useState("")
	const lastAnnouncedAt = useRef<number | null>(null)
	const lastMessage = useRef("")

	const announce = (next: string) => {
		const now = performance.now()
		const withinWindow =
			lastAnnouncedAt.current !== null && now - lastAnnouncedAt.current < COMPOSE_WINDOW_MS
		const composed = withinWindow && lastMessage.current ? `${lastMessage.current}. ${next}` : next
		lastAnnouncedAt.current = now
		lastMessage.current = composed
		setMessage(composed)
	}

	return (
		<AnnouncerContext.Provider value={announce}>
			{children}
			{/* The app's single aria-live region — every async announcement funnels here. */}
			<div aria-live="polite" className="visually-hidden">
				{message}
			</div>
		</AnnouncerContext.Provider>
	)
}

export function useAnnounce() {
	return useContext(AnnouncerContext)
}
