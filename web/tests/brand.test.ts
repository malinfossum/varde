import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Resvg } from "@resvg/resvg-js"
import { describe, expect, test } from "vitest"
import { FONT_FILES, FONTS } from "../scripts/brand-geometry.mjs"

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

// Opaque pixels inside box [x0, y0, x1, y1) within `tolerance` (RGB distance) of `hex`.
function inkCount(image: Image, box: number[], hex: string, tolerance = 60) {
	const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
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
