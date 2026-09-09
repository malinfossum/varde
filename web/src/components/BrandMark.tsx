// Placeholder cairn until the brand pack lands: three stacked stones, coloured by CSS through
// currentColor — never a fill attribute, var() does not resolve in SVG presentation attributes.
export function BrandMark({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			aria-hidden="true"
			focusable="false"
			className={className}
			fill="currentColor"
		>
			<rect x="9" y="3" width="6" height="4" rx="2" />
			<rect x="6" y="9" width="12" height="4.5" rx="2.2" />
			<rect x="3" y="16" width="18" height="5" rx="2.5" />
		</svg>
	)
}
