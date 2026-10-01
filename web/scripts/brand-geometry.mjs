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

const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))

// t is the share of a. Rounds half up, which reproduces the spec's tint table exactly.
export function mix(a, b, t) {
	const [ca, cb] = [rgb(a), rgb(b)]
	const channel = (i) =>
		Math.round(ca[i] * t + cb[i] * (1 - t))
			.toString(16)
			.padStart(2, "0")
	return `#${[0, 1, 2].map(channel).join("")}`
}

// One theme's brand colours. The two banner tints are the accent mixed into the paper at 25 %
// and 50 %, so they follow the tokens instead of being a second palette. Fills only, never text.
export function brandColors(tokens) {
	return {
		accent: tokens.accent,
		ground: tokens.ground,
		text: tokens.text,
		muted: tokens.muted,
		tint1: mix(tokens.accent, tokens.ground, 0.25),
		tint2: mix(tokens.accent, tokens.ground, 0.5),
	}
}

// The app-icon scene: no ring, no clip, no fjord lines. The mountain runs from x -2 to 34 on
// base line 31; the C1 sizing applies about that base.
const SCENE_BASE = 31
const SCENE_MOUNTAIN = [[-2, SCENE_BASE], ...MOUNTAIN.slice(1, -1), [34, SCENE_BASE]]

function sceneShapes() {
	const stones = sized(stackC(), C1.f, C1.k, SCENE_BASE).map(([yT, yB, w]) =>
		stonePoints(16, yT, yB, w)
	)
	return [SCENE_MOUNTAIN.map(aboutBase(C1.f, SCENE_BASE)), ...stones]
}

// translate(tx,ty) scale(s) translate(-16,-16), as numbers.
const place =
	({ s, tx, ty }) =>
	([x, y]) => [tx + s * (x - 16), ty + s * (y - 16)]

export const SCENE_PLACEMENT = { s: 0.72, tx: 16, ty: 16.6 }

export function scene(ink, placement = SCENE_PLACEMENT) {
	const shapes = sceneShapes().map(
		(shape) => `<polygon points="${pointList(shape.map(place(placement)))}"/>`
	)
	return `<g fill="${ink}">${shapes.join("")}</g>`
}

// Centre the scene's bounding box and scale it until the box corners sit on 98 % of the 40 %
// safe radius (12.8 in a 32 box). The 2 % margin keeps antialiasing inside the line. Computed
// from the box, never hand-tuned.
export function maskablePlacement() {
	const points = sceneShapes().flat()
	const xs = points.map(([x]) => x)
	const ys = points.map(([, y]) => y)
	const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
	const s = (0.98 * 0.4 * 32) / Math.hypot((x1 - x0) / 2, (y1 - y0) / 2)
	return { s, tx: 16 - s * ((x0 + x1) / 2 - 16), ty: 16 - s * ((y0 + y1) / 2 - 16) }
}

// Paper disc, accent ring mark, transparent outside the disc: favicon.ico and the "any" icons,
// which land on backgrounds I don't control.
export function medallion(colors, points = ringMarkPoints()) {
	return svgDoc(
		32,
		32,
		`<circle cx="16" cy="16" r="16" fill="${colors.ground}"/>${ringMark(colors.accent, { points })}`
	)
}

// Full-bleed accent plate with the scene in paper: apple-touch (iOS rounds the corners) and,
// with maskablePlacement(), the maskable icons.
export function plateIcon(colors, placement = SCENE_PLACEMENT) {
	return svgDoc(
		32,
		32,
		`<rect width="32" height="32" fill="${colors.accent}"/>${scene(colors.ground, placement)}`
	)
}

// The banner's three ranges in banner units (1280x320), back to front.
const RANGES = {
	back: "M520,320 L660,210 L720,236 L850,96 L915,150 L975,122 L1110,215 L1190,170 L1280,212 L1280,320Z",
	middle:
		"M600,320 L740,246 L790,262 L880,190 L940,222 L1070,178 L1180,250 L1230,236 L1280,262 L1280,320Z",
	front:
		"M680,320 L810,276 L860,288 L965,214 L1010,206 L1055,214 L1130,266 L1165,256 L1280,296 L1280,320Z",
}
const FRONT_SUMMIT = [1010, 206]
const STACK_SCALE = 3.6

// The C1 stack at x3.6 on the front summit. Only k applies: the mountain here is the front
// range, not the icon mountain, so f stays 1.
function bannerStack() {
	const [cx, summit] = FRONT_SUMMIT
	const dy = summit - SUMMIT * STACK_SCALE
	return sized(stackC(), 1, C1.k, 33)
		.map(([yT, yB, w]) => {
			const points = stonePoints(cx, yT * STACK_SCALE + dy, yB * STACK_SCALE + dy, w * STACK_SCALE)
			return `<polygon points="${pointList(points)}"/>`
		})
		.join("")
}

// Ring mark x2.4, name, eyebrow and tagline, in banner units from the block's origin. The font
// families are quoted because "Fraunces 9pt" has a digit-led word.
function textBlock(colors, { x, y, scale }) {
	return [
		`<g transform="translate(${fmt(x)},${fmt(y)}) scale(${fmt(scale)})">`,
		`<g transform="scale(2.4)">${ringMark(colors.accent, { idPrefix: "card" })}</g>`,
		`<text x="96" y="58" font-family="'${FONTS.display}'" font-weight="600" font-size="64" fill="${colors.text}">Varde</text>`,
		`<text x="2" y="132" font-family="'${FONTS.body}'" font-weight="600" font-size="15" letter-spacing="1.5" fill="${colors.muted}">HJELPETJENESTER I NORGE</text>`,
		`<text x="0" y="168" font-family="'${FONTS.display}'" font-weight="600" font-size="30" fill="${colors.text}">Finn riktig hjelp, der du bor.</text>`,
		"</g>",
	].join("")
}

// land scales the landscape (pinned to the bottom-right corner); text places the text block.
// banner is the spec's 1280x320 exactly. og and social are the starting layouts Malin approves
// on the contact sheet.
export const LAYOUTS = {
	banner: { width: 1280, height: 320, land: 1, text: { x: 72, y: 84, scale: 1 } },
	og: { width: 1200, height: 630, land: 1.25, text: { x: 72, y: 96, scale: 1.35 } },
	social: { width: 1280, height: 640, land: 1.3, text: { x: 80, y: 100, scale: 1.4 } },
}

export function landscapeCard(colors, { width, height, land, text }) {
	const ranges = [
		`<g transform="translate(${fmt(width - 1280 * land)},${fmt(height - 320 * land)}) scale(${fmt(land)})">`,
		`<path fill="${colors.tint1}" d="${RANGES.back}"/>`,
		`<path fill="${colors.tint2}" d="${RANGES.middle}"/>`,
		`<g fill="${colors.accent}"><path d="${RANGES.front}"/>${bannerStack()}</g>`,
		"</g>",
	].join("")
	// The water band always spans the full width; its two knockouts are paper.
	const band = 32 * land
	const top = height - band
	const water = [
		`<rect x="0" y="${fmt(top)}" width="${width}" height="${fmt(band)}" fill="${colors.accent}"/>`,
		`<rect x="0" y="${fmt(top + 8 * land)}" width="${width}" height="${fmt(5 * land)}" fill="${colors.ground}"/>`,
		`<rect x="0" y="${fmt(top + 20 * land)}" width="${width}" height="${fmt(4 * land)}" fill="${colors.ground}"/>`,
	].join("")
	const ground = `<rect width="${width}" height="${height}" fill="${colors.ground}"/>`
	return svgDoc(width, height, `${ground}${ranges}${water}${textBlock(colors, text)}`)
}
