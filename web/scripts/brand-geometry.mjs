// web/scripts/brand-geometry.mjs
// The Varde mark, once. Every drawing in the brand pack comes from the C1 numbers in
// docs/superpowers/specs/2026-10-01-varde-brand-design.md. Pure: colours come in as arguments
// and nothing touches the disk, so tests call it directly. scripts/brand.mjs writes the output
// and renders the PNGs.

// Family names exactly as the bundled TTFs declare them (docs/brand/fonts/SOURCE.md). resvg
// loads no system fonts and quietly falls back to the first font loaded when a name does not
// match, so a wrong name here renders the wrong face (tests/brand.test.ts catches it).
export const FONTS = { display: "Fraunces 9pt", body: "Figtree" }

// Repo-relative, so the build script and the tests resolve them from the same root.
export const FONT_FILES = [
	"docs/brand/fonts/Fraunces-SemiBold.ttf",
	"docs/brand/fonts/Figtree-SemiBold.ttf",
]

// Two decimals, the precision the brainstorm files used. Keeps the SVG text stable.
export const fmt = (n) => String(Math.round(n * 100) / 100)
export const pointList = (points) => points.map(([x, y]) => `${fmt(x)},${fmt(y)}`).join(" ")

// One stone as fractions of (w, h) from its top-left corner: flat base, ends chopped at angles.
const STONE = [
	[0.05, 1],
	[0, 0.5],
	[0.1, 0.04],
	[0.55, 0],
	[0.74, 0.08],
	[0.9, 0.2],
	[1, 0.62],
	[0.95, 1],
]

export const SUMMIT = 18.8
export const MOUNTAIN = [
	[-4, 33],
	[5, 22.2],
	[7.6, 23.8],
	[12.2, 20.2],
	[16, SUMMIT],
	[19.8, 20.2],
	[23.2, 23.6],
	[25.6, 22.2],
	[36, 33],
]
export const C1 = { f: 1.15, k: 0.871 }
export const RING = { cx: 16, cy: 16, r: 14.6, strokeWidth: 2.4 }
export const CLIP_R = 13.6
export const FJORD_LINES = [
	{ y: 25.9, strokeWidth: 1.2 },
	{ y: 28.3, strokeWidth: 1 },
]

// Variant C, top stone first. Built up from the summit: the bottom stone ends one gap above it.
const HEIGHTS = [4.4, 4.8, 5.2]
const WIDTHS = [7.8, 11, 13]
const GAP = 0.7

export function stackC() {
	const out = []
	let y = SUMMIT - GAP
	for (let i = 2; i >= 0; i--) {
		out.unshift([y - HEIGHTS[i], y, WIDTHS[i]])
		y -= HEIGHTS[i] + GAP
	}
	return out
}

// C1 sizing: the mountain scales by f about its base line, so the summit moves to sm; the stack
// scales by k and rests on the new summit.
export function sized(stack, f, k, base) {
	const sm = base - f * (base - SUMMIT)
	return stack.map(([yT, yB, w]) => [sm - k * (SUMMIT - yT), sm - k * (SUMMIT - yB), w * k])
}

export function stonePoints(cx, yT, yB, w) {
	const h = yB - yT
	const x0 = cx - w / 2
	return STONE.map(([a, b]) => [x0 + a * w, yT + b * h])
}

// translate(16,base) scale(f) translate(-16,-base), applied to the numbers directly so every
// output is plain coordinates (BrandMark.tsx draws them without transforms).
export const aboutBase =
	(f, base) =>
	([x, y]) => [16 + f * (x - 16), base - f * (base - y)]

// The ring's scene transform: translate(16,17.2) scale(0.8) translate(-16,-16).
const intoRing = ([x, y]) => [16 + 0.8 * (x - 16), 17.2 + 0.8 * (y - 16)]

export function ringMarkPoints({ stack = stackC(), mountain = MOUNTAIN, f = C1.f, k = C1.k } = {}) {
	return {
		mountain: pointList(mountain.map(aboutBase(f, 33)).map(intoRing)),
		stones: sized(stack, f, k, 33).map(([yT, yB, w]) =>
			pointList(stonePoints(16, yT, yB, w).map(intoRing))
		),
	}
}

// The ring medallion: the ring, then the scene clipped to a smaller circle so the mountain fuses
// into the ring, with the two fjord lines knocked out by a mask.
export function ringMark(ink, { idPrefix = "varde", points = ringMarkPoints() } = {}) {
	const clip = `${idPrefix}-clip`
	const mask = `${idPrefix}-mask`
	return [
		`<defs><clipPath id="${clip}"><circle cx="${RING.cx}" cy="${RING.cy}" r="${CLIP_R}"/></clipPath>`,
		`<mask id="${mask}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="60" height="60">`,
		`<rect x="-10" y="-10" width="60" height="60" fill="#fff"/>`,
		...FJORD_LINES.map(
			(line) => `<path d="M-2,${line.y} H34" stroke="#000" stroke-width="${line.strokeWidth}"/>`
		),
		"</mask></defs>",
		`<circle cx="${RING.cx}" cy="${RING.cy}" r="${RING.r}" fill="none" stroke="${ink}" stroke-width="${RING.strokeWidth}"/>`,
		`<g clip-path="url(#${clip})" mask="url(#${mask})" fill="${ink}">`,
		`<polygon points="${points.mountain}"/>`,
		...points.stones.map((stone) => `<polygon points="${stone}"/>`),
		"</g>",
	].join("")
}

export function svgDoc(width, height, body) {
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">${body}</svg>\n`
}
