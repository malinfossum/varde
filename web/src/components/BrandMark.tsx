import { useId } from "react"
import { CLIP_R, FJORD_LINES, MOUNTAIN_POINTS, RING, STONE_POINTS } from "./brandPaths.ts"

// The C1 ring mark (docs/superpowers/specs/2026-10-01-varde-brand-design.md), drawn from the
// generated brandPaths.ts and coloured by CSS through currentColor. Never a fill attribute:
// var() does not resolve in SVG presentation attributes. useId keeps the clip and mask ids
// unique when two marks share a page.
export function BrandMark({ className }: { className?: string }) {
	const id = useId()
	const clip = `${id}-clip`
	const mask = `${id}-mask`
	return (
		<svg viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={className}>
			<defs>
				<clipPath id={clip}>
					<circle cx={RING.cx} cy={RING.cy} r={CLIP_R} />
				</clipPath>
				<mask id={mask} maskUnits="userSpaceOnUse" x="-10" y="-10" width="60" height="60">
					<rect x="-10" y="-10" width="60" height="60" fill="#fff" />
					{FJORD_LINES.map((line) => (
						<path
							key={line.y}
							d={`M-2,${line.y} H34`}
							stroke="#000"
							strokeWidth={line.strokeWidth}
						/>
					))}
				</mask>
			</defs>
			<circle
				cx={RING.cx}
				cy={RING.cy}
				r={RING.r}
				fill="none"
				stroke="currentColor"
				strokeWidth={RING.strokeWidth}
			/>
			<g clipPath={`url(#${clip})`} mask={`url(#${mask})`} fill="currentColor">
				<polygon points={MOUNTAIN_POINTS} />
				{STONE_POINTS.map((points) => (
					<polygon key={points} points={points} />
				))}
			</g>
		</svg>
	)
}
