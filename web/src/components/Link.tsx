import type { MouseEvent, ReactNode } from "react"
import { useNavigate } from "../navigation.ts"

export function Link({
	to,
	className,
	children,
}: {
	to: string
	className?: string
	children: ReactNode
}) {
	const navigate = useNavigate()
	const onClick = (event: MouseEvent) => {
		// Let the browser handle modified clicks (new tab / save-as) and non-primary buttons
		// (e.g. middle-click also opens a new tab).
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
			return
		event.preventDefault()
		const url = new URL(to, window.location.origin)
		navigate(url.pathname, url.search)
	}
	return (
		<a href={to} className={className} onClick={onClick}>
			{children}
		</a>
	)
}
