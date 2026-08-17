import type { MouseEvent, ReactNode } from "react"
import { useNavigate } from "../App.tsx"

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
		if (event.metaKey || event.ctrlKey || event.shiftKey) return // let the browser open tabs
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
