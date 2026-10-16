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

export function MenuIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M4 6h16M4 12h16M4 18h16" />
		</Svg>
	)
}

// The acute strip's four services. Each sits inside its tel link, whose hidden text names it.
export function FlameIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M12 3c3 4 6 6.5 6 11a6 6 0 0 1-12 0c0-2.5 1.2-4.2 2.5-5.5.2 2 1 3 2 3.5-.3-3.5.3-6 1.5-9z" />
		</Svg>
	)
}

export function ShieldIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M12 3l7 3v5.5c0 4.3-2.9 7.6-7 9.5-4.1-1.9-7-5.2-7-9.5V6z" />
		</Svg>
	)
}

export function AmbulanceIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M5.25 17.5H3V8a1 1 0 0 1 1-1h10v10.5M8.75 17.5h6.5M14 10h3.5l3.5 3.5v4h-2.25M8.5 9.5v5M6 12h5" />
			<circle cx="7" cy="17.5" r="1.75" />
			<circle cx="17" cy="17.5" r="1.75" />
		</Svg>
	)
}

export function StethoscopeIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M5 3h2M13 3h2M6 3v5a4 4 0 0 0 8 0V3M10 12v2.5a4.5 4.5 0 0 0 9 0V13" />
			<circle cx="19" cy="11" r="2" />
		</Svg>
	)
}

// A telephone handset, drawn upright with its ends down and then turned so the handle sits at the
// bottom left and the earpiece and mouthpiece point to the top right.
export function PhoneIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path
				transform="translate(0 -3.5) rotate(-135 12 15.5)"
				d="M3 15.5c0-1 .5-1.6 1.4-2C6 12.8 8 12 12 12s6 .8 7.6 1.5c.9.4 1.4 1 1.4 2V17a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 15 17v-1c0-.5-.5-.8-1-1a8 8 0 0 0-4 0c-.5.2-1 .5-1 1v1a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 3 17z"
			/>
		</Svg>
	)
}

export function ChatIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 21l1.9-5.3A8.5 8.5 0 1 1 21 11.5z" />
		</Svg>
	)
}
