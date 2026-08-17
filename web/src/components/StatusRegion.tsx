import { createContext, type ReactNode, useContext, useState } from "react"

const AnnouncerContext = createContext<(message: string) => void>(() => {})

export function AnnouncerProvider({ children }: { children: ReactNode }) {
	const [message, setMessage] = useState("")
	return (
		<AnnouncerContext.Provider value={setMessage}>
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
