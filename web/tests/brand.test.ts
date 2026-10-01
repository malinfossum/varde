import { createHash } from "node:crypto"
import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Resvg } from "@resvg/resvg-js"
import { describe, expect, test } from "vitest"
import {
	brandColors,
	C1,
	type Colors,
	FJORD_LINES,
	FONT_FILES,
	FONTS,
	LAYOUTS,
	type Layout,
	landscapeCard,
	maskablePlacement,
	masters,
	type Point,
	plateIcon,
	ringMark,
	ringMarkPoints,
	SRC,
	type Stone,
	sized,
	stackC,
	svgDoc,
} from "../scripts/brand-geometry.mjs"
import { pngToIco } from "../scripts/ico.mjs"
import { contrastRatio, parseThemeTokens } from "../src/services/contrast.ts"

// jsdom replaces the global URL constructor and mis-resolves relative file URLs on Windows, so
// paths go through node:path/node:url (same fix as tokens.test.ts).
const repo = join(dirname(fileURLToPath(import.meta.url)), "../..")
const FONTS_ABS = FONT_FILES.map((rel) => join(repo, rel))

type Image = { width: number; height: number; pixels: Uint8Array }

// Renders an SVG string to raw RGBA in memory, with only the bundled fonts, exactly as
// scripts/brand.mjs does. No PNG decoder needed.
function render(svg: string, width: number, fontFiles = FONTS_ABS, background?: string): Image {
	const image = new Resvg(svg, {
		fitTo: { mode: "width", value: width },
		background,
		font: { loadSystemFonts: false, fontFiles },
	}).render()
	return { width: image.width, height: image.height, pixels: image.pixels as unknown as Uint8Array }
}

const hexRgb = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))

// Opaque pixels inside box [x0, y0, x1, y1) within `tolerance` (RGB distance) of `hex`.
function inkCount(image: Image, box: number[], hex: string, tolerance = 60) {
	const [r, g, b] = hexRgb(hex)
	const [x0, y0, x1, y1] = box
	let count = 0
	for (let y = y0; y < y1; y++) {
		for (let x = x0; x < x1; x++) {
			const i = (y * image.width + x) * 4
			const p = image.pixels
			if (p[i + 3] > 128 && Math.hypot(p[i] - r, p[i + 1] - g, p[i + 2] - b) < tolerance) count++
		}
	}
	return count
}

const probe = (family: string) =>
	`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100" width="400" height="100"><rect width="400" height="100" fill="#ffffff"/><text x="10" y="75" font-family="${family}" font-weight="600" font-size="64" fill="#000000">Varde</text></svg>`

describe("fonts", () => {
	test.each([FONTS.display, FONTS.body])("resvg renders %s from the bundled TTFs", (family) => {
		expect(inkCount(render(probe(family), 400), [0, 0, 400, 100], "#000000")).toBeGreaterThan(500)
	})

	test("the display and body faces are different fonts, not one fallback", () => {
		const a = render(probe(FONTS.display), 400).pixels
		const b = render(probe(FONTS.body), 400).pixels
		expect(a.some((v, i) => v !== b[i])).toBe(true)
	})

	// resvg does not fail on an unknown family: it silently falls back to the first font loaded, so
	// ink alone cannot prove a name. A matched family renders the same whatever the file order.
	test.each([FONTS.display, FONTS.body])(
		"%s matches its own file, not the first-loaded fallback",
		(family) => {
			const forward = render(probe(family), 400).pixels
			const reversed = render(probe(family), 400, [...FONTS_ABS].reverse()).pixels
			expect(forward.every((v, i) => v === reversed[i])).toBe(true)
		}
	)

	test("with no fonts loaded the same text renders blank, so the gate can fail", () => {
		const blank = render(probe(FONTS.display), 400, [])
		expect(inkCount(blank, [0, 0, 400, 100], "#000000")).toBe(0)
	})
})

// The v6 mark the brainstorm rejected: its mountain left sky above the top fjord line (26 px
// measured in the browser at 640 px). Kept here only to prove the clearance gate can fail.
const V6_STACK: Stone[] = [
	[12.4, 17.6, 13],
	[6.2, 11, 11],
	[0.6, 5, 7.8],
]
const V6_MOUNTAIN: Point[] = [
	[-4, 33],
	[4.5, 25.2],
	[7, 26.6],
	[12.2, 20.2],
	[16, 18.8],
	[19.8, 20.2],
	[23.2, 23.6],
	[25.6, 22.2],
	[36, 33],
]

// Port of marks9.html's touchCheck(): render the ring mark black on transparent at 640 px and
// count see-through pixels inside the clip, in the row just above the top fjord line.
function skyAboveFjord(points = ringMarkPoints()) {
	const size = 640
	const unit = size / 32
	const image = render(svgDoc(32, 32, ringMark("#000000", { points })), size)
	const top = FJORD_LINES[0]
	const row = Math.floor((top.y - top.strokeWidth / 2) * unit) - 2
	let sky = 0
	for (let x = 0; x < size; x++) {
		const inside = Math.hypot(x / unit - 16, row / unit - 16) < 13.2
		if (inside && image.pixels[(row * size + x) * 4 + 3] < 128) sky++
	}
	return sky
}

describe("ring mark geometry", () => {
	test("variant C stacks three stones up from the summit with 0.7 gaps", () => {
		const expected = [2.3, 6.7, 7.8, 7.4, 12.2, 11, 12.9, 18.1, 13]
		expect(stackC().flat()).toEqual(expected.map((n) => expect.closeTo(n, 6)))
	})

	test("C1 keeps the stack top where C had it, at 2.3", () => {
		expect(sized(stackC(), C1.f, C1.k, 33)[0][0]).toBeCloseTo(2.3, 2)
	})

	test("the ring mark draws one mountain and three stones", () => {
		const svg = ringMark("#000000")
		expect(svg.match(/<polygon /g)).toHaveLength(4)
		expect(svg).toContain('r="14.6"')
	})

	test("C1 leaves no sky between the mountain and the top fjord line", () => {
		expect(skyAboveFjord()).toBe(0)
	})

	test("the clearance gate fails on the v6 mark", () => {
		const v6 = ringMarkPoints({ stack: V6_STACK, mountain: V6_MOUNTAIN, f: 1, k: 1 })
		expect(skyAboveFjord(v6)).toBeGreaterThan(0)
	})
})

const themes = parseThemeTokens(readFileSync(join(repo, "web/src/styles/tokens.css"), "utf8"))
const light = brandColors(themes.light)
const dark = brandColors(themes.dark)

describe("colours", () => {
	test("the banner tints are the accent mixed into the paper, matching the spec table", () => {
		expect([light.tint1, light.tint2]).toEqual(["#c3cdc1", "#8fa998"])
		expect([dark.tint1, dark.tint2]).toEqual(["#283b34", "#456857"])
	})

	// WCAG 1.4.11: a graphic that identifies the site needs 3:1 against what it sits on.
	test.each([
		[
			"light accent on paper (medallion, ico, light banner, og, social)",
			light.accent,
			light.ground,
		],
		["dark accent on dark paper (dark banner)", dark.accent, dark.ground],
	])("%s is at least 3:1", (_, ink, ground) => {
		expect(contrastRatio(ink, ground)).toBeGreaterThanOrEqual(3)
	})

	test.each(["#ffffff", "#f0f0f4"])("the favicon's light accent reads on a %s tab", (tab) => {
		expect(contrastRatio(light.accent, tab)).toBeGreaterThanOrEqual(3)
	})

	test.each(["#35363a", "#42414d"])("the favicon's dark accent reads on a %s tab", (tab) => {
		expect(contrastRatio(dark.accent, tab)).toBeGreaterThanOrEqual(3)
	})

	test("the contrast gate fails for the light accent on a dark tab", () => {
		expect(contrastRatio(light.accent, "#35363a")).toBeLessThan(3)
	})
})

// Pixels whose centre lies outside the maskable safe circle (radius 0.4 x size) and are not
// exactly the plate colour. Launchers may crop anything out there.
function outsideSafeCircle(svg: string, size: number, plate: string) {
	const image = render(svg, size)
	const [r, g, b] = hexRgb(plate)
	let bad = 0
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			if (Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) <= 0.4 * size) continue
			const i = (y * size + x) * 4
			const p = image.pixels
			if (p[i] !== r || p[i + 1] !== g || p[i + 2] !== b || p[i + 3] !== 255) bad++
		}
	}
	return bad
}

describe("app icons", () => {
	test.each([192, 512])(
		"the maskable icon keeps the scene inside the safe circle at %i",
		(size) => {
			expect(outsideSafeCircle(plateIcon(light, maskablePlacement()), size, light.accent)).toBe(0)
		}
	)

	test("the safe-zone gate fails on the unfitted scene", () => {
		expect(outsideSafeCircle(plateIcon(light), 512, light.accent)).toBeGreaterThan(0)
	})
})

// Where "Varde" sits in a card: block origin + (100..250, 14..56) block units, scaled.
const nameBox = ({ text }: Layout) => [
	Math.round(text.x + 100 * text.scale),
	Math.round(text.y + 14 * text.scale),
	Math.round(text.x + 250 * text.scale),
	Math.round(text.y + 56 * text.scale),
]

// Bounding box of every pixel close to the text colour, measured, not estimated.
function textBounds(image: Image, hex: string) {
	const [r, g, b] = hexRgb(hex)
	let [x0, y0, x1, y1] = [image.width, image.height, -1, -1]
	for (let y = 0; y < image.height; y++) {
		for (let x = 0; x < image.width; x++) {
			const i = (y * image.width + x) * 4
			const p = image.pixels
			if (Math.hypot(p[i] - r, p[i + 1] - g, p[i + 2] - b) < 60) {
				;[x0, y0, x1, y1] = [Math.min(x0, x), Math.min(y0, y), Math.max(x1, x), Math.max(y1, y)]
			}
		}
	}
	return { x0, y0, x1, y1 }
}

const cards: [string, Colors, Layout][] = [
	["light banner", light, LAYOUTS.banner],
	["dark banner", dark, LAYOUTS.banner],
	["og card", light, LAYOUTS.og],
	["social preview", light, LAYOUTS.social],
]

describe("landscape cards", () => {
	test.each(cards)("the %s renders the name in the bundled display face", (_, colors, layout) => {
		const image = render(landscapeCard(colors, layout), layout.width)
		expect(inkCount(image, nameBox(layout), colors.text)).toBeGreaterThan(300)
	})

	// Ink alone cannot tell the right family from resvg's silent fallback to the first loaded
	// font, so the whole card must also render identically whatever the font file order.
	test.each(cards)(
		"the %s matches its font names, not the first-loaded fallback",
		(_, colors, layout) => {
			const svg = landscapeCard(colors, layout)
			const forward = render(svg, layout.width).pixels
			const reversed = render(svg, layout.width, [...FONTS_ABS].reverse()).pixels
			expect(forward.every((v, i) => v === reversed[i])).toBe(true)
		}
	)

	test("the font gate fails when no fonts are loaded", () => {
		const image = render(landscapeCard(light, LAYOUTS.banner), 1280, [])
		expect(inkCount(image, nameBox(LAYOUTS.banner), light.text)).toBe(0)
	})

	test.each([
		["og", LAYOUTS.og],
		["social", LAYOUTS.social],
	] as const)("the %s card keeps its text inside the centre 90 %%", (_, layout) => {
		const image = render(landscapeCard(light, layout), layout.width)
		const box = textBounds(image, light.text)
		expect(box.x1).toBeGreaterThan(0)
		expect(box.x0).toBeGreaterThanOrEqual(Math.max(64, 0.05 * layout.width))
		expect(box.y0).toBeGreaterThanOrEqual(0.05 * layout.height)
		expect(box.x1).toBeLessThanOrEqual(0.95 * layout.width)
		expect(box.y1).toBeLessThanOrEqual(0.95 * layout.height)
	})

	test("the banner keeps the spec's water band and knockouts", () => {
		const svg = landscapeCard(light, LAYOUTS.banner)
		expect(svg).toContain(`<rect x="0" y="288" width="1280" height="32" fill="${light.accent}"/>`)
		expect(svg).toContain(`<rect x="0" y="296" width="1280" height="5" fill="${light.ground}"/>`)
		expect(svg).toContain(`<rect x="0" y="308" width="1280" height="4" fill="${light.ground}"/>`)
	})
})

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

function checkIco(bytes: Uint8Array) {
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
	const offset = view.getUint32(18, true)
	return {
		reserved: view.getUint16(0, true),
		type: view.getUint16(2, true),
		count: view.getUint16(4, true),
		width: bytes[6],
		height: bytes[7],
		pngSignature: PNG_SIGNATURE.every((v, i) => bytes[offset + i] === v),
	}
}

describe("ico", () => {
	test("pngToIco wraps one PNG in a single-image icon directory", () => {
		const png = new Uint8Array([...PNG_SIGNATURE, 1, 2, 3])
		const ico = pngToIco(png, 32)
		expect(checkIco(ico)).toEqual({
			reserved: 0,
			type: 1,
			count: 1,
			width: 32,
			height: 32,
			pngSignature: true,
		})
		expect(new DataView(ico.buffer).getUint32(14, true)).toBe(png.length)
		expect(ico.length).toBe(22 + png.length)
	})
})

// Repo-relative paths whose committed content differs from what the geometry builds now.
function drifted(files: Record<string, string>) {
	return Object.entries(files)
		.filter(([rel, content]) => {
			const path = join(repo, rel)
			return !existsSync(path) || readFileSync(path, "utf8") !== content
		})
		.map(([rel]) => rel)
}

const sha256 = (data: Uint8Array | string) => createHash("sha256").update(data).digest("hex")

// Sizes from the spec's pack table, written out here so the test does not trust the build's
// own list.
const PNG_SIZES: [string, number, number][] = [
	["web/public/apple-touch-icon.png", 180, 180],
	["web/public/icon-192.png", 192, 192],
	["web/public/icon-512.png", 512, 512],
	["web/public/icon-maskable-192.png", 192, 192],
	["web/public/icon-maskable-512.png", 512, 512],
	["web/public/og.png", 1200, 630],
	["docs/brand/banner-light.png", 1280, 320],
	["docs/brand/banner-dark.png", 1280, 320],
	["docs/brand/social-preview.png", 1280, 640],
]

describe("generated pack", () => {
	test("every committed brand file matches the geometry byte for byte (run: npm run brand)", () => {
		expect(drifted(masters(themes))).toEqual([])
	})

	test("the drift gate catches one changed number", () => {
		expect(drifted(masters(themes, { f: 1.16 }))).not.toEqual([])
	})

	test("hashes.json matches every master, so no PNG is older than its SVG", () => {
		const hashes = JSON.parse(readFileSync(join(repo, SRC, "hashes.json"), "utf8"))
		const svgs = Object.keys(masters(themes))
			.filter((rel) => rel.startsWith(`${SRC}/`))
			.map((rel) => rel.slice(SRC.length + 1))
		expect(Object.keys(hashes).sort()).toEqual(svgs.sort())
		for (const name of svgs) {
			expect(hashes[name], name).toBe(sha256(readFileSync(join(repo, SRC, name))))
		}
	})

	test.each(PNG_SIZES)("%s is %ix%i", (rel, width, height) => {
		const bytes = readFileSync(join(repo, rel))
		const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
		expect(PNG_SIGNATURE.every((v, i) => bytes[i] === v)).toBe(true)
		expect([view.getUint32(16), view.getUint32(20)]).toEqual([width, height])
	})

	// WhatsApp and some chat apps drop a link-preview image above roughly 300 KB, and Norwegian
	// users share links there more than anywhere else.
	test("og.png stays under 300 KB so chat apps show the preview", () => {
		expect(readFileSync(join(repo, "web/public/og.png")).length).toBeLessThan(300 * 1024)
	})

	test("favicon.ico is one 32x32 PNG-in-ICO", () => {
		expect(checkIco(readFileSync(join(repo, "web/public/favicon.ico")))).toEqual({
			reserved: 0,
			type: 1,
			count: 1,
			width: 32,
			height: 32,
			pngSignature: true,
		})
	})
})
