import type { ReactNode } from "react"

// Plain stroke icons drawn for Varde on a 24-unit grid. Decorative at every use: the text
// beside them, or a visually hidden name, carries the meaning.
type IconProps = { className?: string }

function Svg({ className, children }: IconProps & { children: ReactNode }) {
	return (
		<svg
			className={className}
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
			aria-hidden="true"
			focusable="false"
		>
			{children}
		</svg>
	)
}

export function GlobeIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<circle cx="12" cy="12" r="9" />
			<ellipse cx="12" cy="12" rx="4" ry="9" />
			<path d="M3 12h18" />
		</Svg>
	)
}

export function CheckIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M5 12.5l4.5 4.5L19 7.5" />
		</Svg>
	)
}

export function SunIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
		</Svg>
	)
}

export function MoonIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
		</Svg>
	)
}

export function SystemIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<rect x="3" y="4" width="18" height="12" rx="2" />
			<path d="M8 20h8M12 16v4" />
		</Svg>
	)
}

export function ArrowLeftIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M19 12H5M11 18l-6-6 6-6" />
		</Svg>
	)
}
