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

// A speech bubble: a rounded rectangle (3 to 21 across, 4 to 17 down, corner radius 3) with a
// square-cornered tail dropping from its bottom edge at the left. No circle and no curved tail,
// so it reads as a bubble at 16 px without borrowing any other set's outline.
export function ChatIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M6 4h12a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-6.5L7 20.5V17H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" />
		</Svg>
	)
}

// An envelope: a rounded rectangle with the flap drawn as a shallow V from the top corners.
export function MailIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<rect x="3" y="5" width="18" height="14" rx="2" />
			<path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
		</Svg>
	)
}

// The detail page's actions. Each sits in a control whose aria-label names it.

// Two offset rounded squares: the front one whole, the back one showing only its top-left edge.
export function CopyIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<rect x="8" y="8" width="12" height="12" rx="2" />
			<path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
		</Svg>
	)
}

// An arrow rising out of an open box.
export function ShareIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M12 15V3M7.5 7.5L12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
		</Svg>
	)
}

// A pole with a flag whose free edge is notched.
export function FlagIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M5 21V4M5 4h13l-3.5 4.5L18 13H5" />
		</Svg>
	)
}

// GitHub's own mark, the one filled brand icon among the stroke icons, on purpose: a brand mark
// is drawn the way its owner draws it. Path copied from primer/octicons mark-github-24.svg (MIT,
// checked 2026-10-17), used unaltered as a link to the repository, as GitHub's logo
// guidelines allow. Never recolour it beyond currentColor.
export function GitHubIcon({ className }: IconProps) {
	return (
		<svg
			className={className}
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
			focusable="false"
		>
			<path d="M10.226 17.284c-2.965-.36-5.054-2.493-5.054-5.256 0-1.123.404-2.336 1.078-3.144-.292-.741-.247-2.314.09-2.965.898-.112 2.111.36 2.83 1.01.853-.269 1.752-.404 2.853-.404 1.1 0 1.999.135 2.807.382.696-.629 1.932-1.1 2.83-.988.315.606.36 2.179.067 2.942.72.854 1.101 2 1.101 3.167 0 2.763-2.089 4.852-5.098 5.234.763.494 1.28 1.572 1.28 2.807v2.336c0 .674.561 1.056 1.235.786 4.066-1.55 7.255-5.615 7.255-10.646C23.5 6.188 18.334 1 11.978 1 5.62 1 .5 6.188.5 12.545c0 4.986 3.167 9.12 7.435 10.669.606.225 1.19-.18 1.19-.786V20.63a2.9 2.9 0 0 1-1.078.224c-1.483 0-2.359-.808-2.987-2.313-.247-.607-.517-.966-1.034-1.033-.27-.023-.359-.135-.359-.27 0-.27.45-.471.898-.471.652 0 1.213.404 1.797 1.235.45.651.921.943 1.483.943.561 0 .92-.202 1.437-.719.382-.381.674-.718.944-.943" />
		</svg>
	)
}

// The history chevrons, the same paths Rookdex uses (spec: Layout).
export function BackIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M15 5l-7 7 7 7" />
		</Svg>
	)
}

export function ForwardIcon({ className }: IconProps) {
	return (
		<Svg className={className}>
			<path d="M9 5l7 7-7 7" />
		</Svg>
	)
}
