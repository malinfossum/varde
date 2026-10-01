# Varde brand (sub-project D) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder cairn with the C1 mark (a varde on a mountain in a ring) and ship the full icon, share-card and banner pack, generated from one geometry module and wired into the site.

**Architecture:** One pure module (`web/scripts/brand-geometry.mjs`) holds the C1 numbers and returns every drawing as an SVG string. `npm run brand` (`web/scripts/brand.mjs`) reads the colour tokens, writes the master SVGs, renders the PNGs with resvg and writes `hashes.json` last. Every generated file is committed. CI never renders anything, but `web/tests/brand.test.ts` renders the masters in memory to prove clearance, safe zone, contrast and fonts, and fails on any drift between the geometry and the committed files.

**Tech Stack:** Node 26 locally (CI runs Node 22), `@resvg/resvg-js` 2.6.2 (devDependency, MPL-2.0), Vitest, React 19, Cloudflare Pages `_headers`.

**Spec:** `docs/superpowers/specs/2026-10-01-varde-brand-design.md`. Read it before any task. Where this plan and the spec disagree, stop and ask.

## Global Constraints

- Colours come only from `web/src/styles/tokens.css`. The banner tints are `mix(accent, ground, 0.25)` and `mix(accent, ground, 0.5)`, which reproduce the spec's table exactly (`#c3cdc1`, `#8fa998`, `#283b34`, `#456857`).
- The geometry numbers are the spec's "Geometry" section, copied verbatim. Never retune a number to make a test pass.
- `@resvg/resvg-js` is pinned to exactly `2.6.2` (no caret) in `devDependencies`. No other new dependency.
- resvg always runs with `loadSystemFonts: false` and only the two committed TTFs.
- Every generated file is committed and produced only by `npm run brand`. Never hand-edit `docs/brand/src/*`, `web/public/favicon.svg`, the PNGs, `favicon.ico` or `web/src/components/brandPaths.ts`.
- The Search Console tag on `web/index.html` line 7 is never touched.
- No em dashes in any file, comment, commit or PR text. Commit messages have no AI attribution and no `Co-Authored-By` trailer.
- Code style: Biome (tabs, double quotes, no semicolons, line width 100). Run `npx biome check --write <files>` from `web/` before each commit.
- Comments are first person where they speak for the author ("I mark them binary"), matching the existing scripts.
- Run every `npm` command from `web/`. Start PostgreSQL is NOT needed for this plan (no API tests).

## Review Focus

1. **A Windows checkout turns the masters into CRLF.** `core.autocrlf` is `true` on the dev machine and `docs/` is not covered by the existing `web/** eol=lf` rule, so the byte-for-byte drift test would fail locally while passing in CI. Task 1 adds `.gitattributes` rules; Task 6 Step 7 proves them with `git ls-files --eol`.
2. **A lockfile written on Windows lacks the Linux resvg binary.** `npm ci` in CI would then install no binary and every brand test would crash on import. Task 1 Step 4 checks `package-lock.json` for `@resvg/resvg-js-linux-x64-gnu`. The PR's CI run is the final proof.
3. **A wrong font family name renders no text at all, silently.** resvg loads no system fonts, so a misspelled family leaves a blank where "Varde" should be. Task 1 reads the family names from the TTFs themselves, and Task 4's ink test fails on a blank render.
4. **A service name holding `"`, `<` or `&` breaks the share-card tags.** Titles come from database text. Task 8's test feeds a hostile title through the prerender and asserts it comes out escaped in `og:title`.
5. **Two marks on one page share a clip or mask id.** The second mark would clip against the first one's geometry. Task 7's test renders two marks and checks each `url(#…)` resolves inside its own `<svg>`.

---

### Task 1: Toolchain and fonts proven

Installs resvg, commits the two TTFs with their licences and provenance, and proves resvg renders both faces. Nothing else is built until this passes.

**Downloads in this task need Malin's explicit OK** (three Fraunces candidates, one Figtree file, two licence texts, all from GitHub). Ask once, listing the URLs in Step 2, before running it.

**Files:**
- Modify: `.gitattributes`, `.gitignore`, `web/package.json`, `web/package-lock.json`, `web/biome.json`
- Create: `docs/brand/fonts/Fraunces-SemiBold.ttf`, `docs/brand/fonts/Figtree-SemiBold.ttf`, `docs/brand/fonts/Fraunces-OFL.txt`, `docs/brand/fonts/Figtree-OFL.txt`, `docs/brand/fonts/SOURCE.md`
- Create: `web/scripts/brand-geometry.mjs`, `web/scripts/brand-geometry.d.mts`
- Test: `web/tests/brand.test.ts`

**Interfaces:**
- Produces: `FONTS: { display: string; body: string }` (family names as the TTFs declare them), `FONT_FILES: string[]` (repo-relative paths), both from `web/scripts/brand-geometry.mjs`. In `brand.test.ts`: `repo` (absolute repo root), `render(svg, width, fontFiles?, background?)` returning `{ width, height, pixels }`, and `inkCount(image, box, hex, tolerance?)`.

- [ ] **Step 1: Line endings, ignores and the Biome exclusion**

Append to `.gitattributes`:

```
# Brand pack. web/tests/brand.test.ts compares the masters and hashes.json byte for byte, so
# they check out LF on every machine (core.autocrlf would otherwise turn them CRLF on Windows).
# The rendered images and the fonts are binary; I mark them explicitly, as with the woff2 files.
docs/brand/src/** text eol=lf
*.png binary
*.ico binary
docs/brand/fonts/*.ttf binary
```

Append to `.gitignore`:

```
# Brand contact sheet and review renders (npm run brand -- --sheet), never committed
.superpowers/brand-review/
```

In `web/biome.json`, extend `files.includes` so the generated paths file is not reformatted (the drift test compares it byte for byte):

```json
"includes": ["**", "!dist", "!dist-server", "!node_modules", "!**/*.min.js", "!public/data", "!src/components/brandPaths.ts"]
```

- [ ] **Step 2: Download the font candidates to a scratch folder**

Ask Malin for the OK first. Then, from the repo root:

```bash
mkdir -p .superpowers/brand-review/fonts && cd .superpowers/brand-review/fonts
for opsz in 9pt 72pt 144pt; do curl -fsSL -o "Fraunces${opsz}-SemiBold.ttf" "https://raw.githubusercontent.com/undercasetype/Fraunces/1.000/fonts/static/ttf/Fraunces${opsz}-SemiBold.ttf"; done
curl -fsSL -o Figtree-SemiBold.ttf https://raw.githubusercontent.com/erikdkennedy/figtree/v2.0.3/fonts/ttf/Figtree-SemiBold.ttf
curl -fsSL -o Fraunces-OFL.txt https://raw.githubusercontent.com/undercasetype/Fraunces/1.000/OFL.txt
curl -fsSL -o Figtree-OFL.txt https://raw.githubusercontent.com/erikdkennedy/figtree/v2.0.3/OFL.txt
ls -la
```

Expected: six files, each TTF over 50 KB. Open both OFL files and confirm each says "SIL OPEN FONT LICENSE Version 1.1". If either does not, stop and report.

- [ ] **Step 3: Pick the Fraunces optical size that matches the site**

The site's `fraunces-latin-600-normal.woff2` (from Fontsource) is one static optical size. Pick the TTF whose metrics match it, by measurement. Write `.superpowers/brand-review/fonts/measure.html`:

```html
<!doctype html><meta charset="utf-8">
<style>
@font-face{font-family:Site;src:url(/web/public/fonts/fraunces-latin-600-normal.woff2)}
@font-face{font-family:F9;src:url(Fraunces9pt-SemiBold.ttf)}
@font-face{font-family:F72;src:url(Fraunces72pt-SemiBold.ttf)}
@font-face{font-family:F144;src:url(Fraunces144pt-SemiBold.ttf)}
</style>
<pre id="out">measuring</pre>
<script>
const text = "Varde Finn riktig hjelp, der du bor."
document.fonts.ready.then(async () => {
	const c = document.createElement("canvas").getContext("2d")
	const out = {}
	for (const f of ["Site", "F9", "F72", "F144"]) {
		await document.fonts.load(`600 100px ${f}`)
		c.font = `600 100px ${f}`
		out[f] = c.measureText(text).width.toFixed(1)
	}
	document.getElementById("out").textContent = JSON.stringify(out)
})
</script>
```

Serve the repo root in the background with `python -m http.server 8765 --bind 127.0.0.1`, open `http://127.0.0.1:8765/.superpowers/brand-review/fonts/measure.html` in the browser pane and read the `#out` text. Pick the candidate whose width is within 0.5 % of `Site`. If none is, stop and report all four numbers. Stop the server afterwards.

- [ ] **Step 4: Install resvg pinned and check the lockfile**

```bash
cd web && npm install --save-dev --save-exact @resvg/resvg-js@2.6.2
grep -c '"node_modules/@resvg/resvg-js-linux-x64-gnu"' package-lock.json
npm view @resvg/resvg-js@2.6.2 license
```

Expected: `package.json` shows `"@resvg/resvg-js": "2.6.2"`, the grep prints `1`, the licence prints `MPL-2.0`. If the grep prints `0`, the npm optional-dependency bug hit: delete `node_modules` and `package-lock.json`, run `npm install`, and grep again. If it is still `0`, stop and report.

- [ ] **Step 5: Commit the fonts with provenance**

Copy the chosen Fraunces file to `docs/brand/fonts/Fraunces-SemiBold.ttf` (renamed so code paths never depend on the optical size), and copy `Figtree-SemiBold.ttf`, `Fraunces-OFL.txt` and `Figtree-OFL.txt` alongside. Compute hashes:

```bash
cd docs/brand/fonts && sha256sum *.ttf
gh api repos/undercasetype/Fraunces/commits/1.000 --jq .sha
gh api repos/erikdkennedy/figtree/commits/v2.0.3 --jq .sha
```

(Tags can be moved; the commit SHA and the file hash are what make the provenance checkable later.)

Read the family names each TTF declares (scratch script, not committed). Save as `.superpowers/brand-review/fonts/names.mjs` and run `node .superpowers/brand-review/fonts/names.mjs docs/brand/fonts/Fraunces-SemiBold.ttf docs/brand/fonts/Figtree-SemiBold.ttf`:

```js
// Prints the Windows-platform family names (name IDs 1 and 16) a TrueType file declares.
import { readFileSync } from "node:fs"
for (const file of process.argv.slice(2)) {
	const b = readFileSync(file)
	const tables = b.readUInt16BE(4)
	let off = -1
	for (let i = 0; i < tables; i++) {
		if (b.toString("ascii", 12 + i * 16, 16 + i * 16) === "name") off = b.readUInt32BE(12 + i * 16 + 8)
	}
	const count = b.readUInt16BE(off + 2)
	const strings = off + b.readUInt16BE(off + 4)
	for (let j = 0; j < count; j++) {
		const rec = off + 6 + j * 12
		const [platform, , , nameId, length, offset] = [0, 2, 4, 6, 8, 10].map((d) => b.readUInt16BE(rec + d))
		if (platform !== 3 || (nameId !== 1 && nameId !== 16)) continue
		const raw = b.subarray(strings + offset, strings + offset + length)
		let s = ""
		for (let k = 0; k < raw.length; k += 2) s += String.fromCharCode(raw.readUInt16BE(k))
		console.log(file, `nameID ${nameId}:`, s)
	}
}
```

The family resvg matches on is name ID 16 when present, else name ID 1. Write it down for Step 6.

Create `docs/brand/fonts/SOURCE.md`, filling in the chosen optical size and the hashes from `sha256sum`:

```markdown
# Bundled fonts

The brand build (`web/scripts/brand.mjs`) renders text with these two static TTFs and nothing
else, so every machine produces the same pixels. resvg cannot read the `.woff2` files the site
ships. Both fonts are under the SIL Open Font License 1.1 (the `*-OFL.txt` files here); the
Varde name and mark are not, see the repo `LICENSE`.

| File | Upstream | Tag (commit) | SHA-256 |
|---|---|---|---|
| `Fraunces-SemiBold.ttf` | `undercasetype/Fraunces`, `fonts/static/ttf/Fraunces<opsz>-SemiBold.ttf` | `1.000` (`<commit sha>`) | `<sha256 from Step 5>` |
| `Figtree-SemiBold.ttf` | `erikdkennedy/figtree`, `fonts/ttf/Figtree-SemiBold.ttf` | `v2.0.3` (`<commit sha>`) | `<sha256 from Step 5>` |

The Fraunces optical size was picked by measuring text width against the site's
`fraunces-latin-600-normal.woff2` in a browser: `<the four widths from Task 1 Step 3>`.
```

Every `<…>` above is a measured value from this task; replace each before committing.

- [ ] **Step 6: Write the failing font test**

Create `web/scripts/brand-geometry.mjs`:

```js
// web/scripts/brand-geometry.mjs
// The Varde mark, once. Every drawing in the brand pack comes from the C1 numbers in
// docs/superpowers/specs/2026-10-01-varde-brand-design.md. Pure: colours come in as arguments
// and nothing touches the disk, so tests call it directly. scripts/brand.mjs writes the output
// and renders the PNGs.

// Family names exactly as the bundled TTFs declare them (docs/brand/fonts/SOURCE.md). resvg
// loads no system fonts, so a wrong name here renders no text at all.
export const FONTS = { display: "Fraunces", body: "Figtree" }

// Repo-relative, so the build script and the tests resolve them from the same root.
export const FONT_FILES = ["docs/brand/fonts/Fraunces-SemiBold.ttf", "docs/brand/fonts/Figtree-SemiBold.ttf"]
```

(`"Fraunces"` is deliberately left as the first guess so Step 7 fails if the declared name differs.)

Create `web/scripts/brand-geometry.d.mts`:

```ts
// Sibling declaration for brand-geometry.mjs. This project carries no allowJs/@types/node, so
// a plain .mjs import has no type on its own. tests/brand.test.ts is the only TS consumer.
export declare const FONTS: { display: string; body: string }
export declare const FONT_FILES: string[]
```

Create `web/tests/brand.test.ts`:

```ts
import { Resvg } from "@resvg/resvg-js"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
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

	test("with no fonts loaded the same text renders blank, so the gate can fail", () => {
		const blank = render(probe(FONTS.display), 400, [])
		expect(inkCount(blank, [0, 0, 400, 100], "#000000")).toBe(0)
	})
})
```

- [ ] **Step 7: Run it and watch the display test fail (or pass)**

Run: `npx vitest run tests/brand.test.ts`
Expected: if Step 5 printed a family other than `Fraunces`, the `Fraunces` case FAILS with ink 0. If the declared name really is `Fraunces`, it passes; that is fine, the probe still proved the name.

- [ ] **Step 8: Set the declared names and pass**

Set `FONTS.display` (and `FONTS.body` if Step 5 printed something other than `Figtree`) to the names from Step 5. Run: `npx vitest run tests/brand.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 9: Commit**

```bash
cd web && npx biome check --write scripts/brand-geometry.mjs scripts/brand-geometry.d.mts tests/brand.test.ts biome.json && npm run typecheck
cd .. && git add .gitattributes .gitignore web/biome.json web/package.json web/package-lock.json docs/brand/fonts web/scripts/brand-geometry.mjs web/scripts/brand-geometry.d.mts web/tests/brand.test.ts
git commit -m "build(brand): add resvg and the bundled brand fonts, proven to render"
```

---

### Task 2: The ring mark geometry

**Files:**
- Modify: `web/scripts/brand-geometry.mjs`, `web/scripts/brand-geometry.d.mts`
- Test: `web/tests/brand.test.ts`

**Interfaces:**
- Consumes: `render`, `repo` from Task 1's test file.
- Produces (from `brand-geometry.mjs`): `type Point = [number, number]`, `type Stone = [yT, yB, w]`, `type RingPoints = { mountain: string; stones: string[] }`, `type Geometry = { stack?: Stone[]; mountain?: Point[]; f?: number; k?: number }`. Constants `SUMMIT`, `MOUNTAIN: Point[]`, `C1 = { f: 1.15, k: 0.871 }`, `RING = { cx: 16, cy: 16, r: 14.6, strokeWidth: 2.4 }`, `CLIP_R = 13.6`, `FJORD_LINES: { y, strokeWidth }[]`. Functions `fmt(n): string`, `pointList(points): string`, `stackC(): Stone[]`, `sized(stack, f, k, base): Stone[]`, `stonePoints(cx, yT, yB, w): Point[]`, `aboutBase(f, base): (p) => Point`, `ringMarkPoints(geometry?): RingPoints`, `ringMark(ink, { idPrefix?, points? }?): string`, `svgDoc(width, height, body): string`.

- [ ] **Step 1: Write the failing tests**

Append to the imports of `web/tests/brand.test.ts`:

```ts
import {
	C1,
	FJORD_LINES,
	ringMark,
	ringMarkPoints,
	sized,
	stackC,
	svgDoc,
	type Point,
	type Stone,
} from "../scripts/brand-geometry.mjs"
```

(Merge into the existing import from `../scripts/brand-geometry.mjs`; Biome sorts it.) Append:

```ts
// The v6 mark the brainstorm rejected: its mountain left sky above the top fjord line (26 px
// measured in the browser at 640 px). Kept here only to prove the clearance gate can fail.
const V6_STACK: Stone[] = [
	[12.4, 17.6, 13],
	[6.2, 11, 11],
	[0.6, 5, 7.8],
]
const V6_MOUNTAIN: Point[] = [
	[-4, 33], [4.5, 25.2], [7, 26.6], [12.2, 20.2], [16, 18.8],
	[19.8, 20.2], [23.2, 23.6], [25.6, 22.2], [36, 33],
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
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/brand.test.ts`
Expected: FAIL, `stackC` (and the rest) is not exported.

- [ ] **Step 3: Implement**

Append to `web/scripts/brand-geometry.mjs`:

```js
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
export const aboutBase = (f, base) => ([x, y]) => [16 + f * (x - 16), base - f * (base - y)]

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
```

Append to `web/scripts/brand-geometry.d.mts`:

```ts
export type Point = [number, number]
export type Stone = [yT: number, yB: number, w: number]
export type RingPoints = { mountain: string; stones: string[] }
export type Geometry = { stack?: Stone[]; mountain?: Point[]; f?: number; k?: number }
export declare const SUMMIT: number
export declare const MOUNTAIN: Point[]
export declare const C1: { f: number; k: number }
export declare const RING: { cx: number; cy: number; r: number; strokeWidth: number }
export declare const CLIP_R: number
export declare const FJORD_LINES: { y: number; strokeWidth: number }[]
export declare function fmt(n: number): string
export declare function pointList(points: Point[]): string
export declare function stackC(): Stone[]
export declare function sized(stack: Stone[], f: number, k: number, base: number): Stone[]
export declare function stonePoints(cx: number, yT: number, yB: number, w: number): Point[]
export declare function aboutBase(f: number, base: number): (p: Point) => Point
export declare function ringMarkPoints(geometry?: Geometry): RingPoints
export declare function ringMark(
	ink: string,
	options?: { idPrefix?: string; points?: RingPoints }
): string
export declare function svgDoc(width: number, height: number, body: string): string
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run tests/brand.test.ts`
Expected: all PASS. If the v6 case reports 0, the port is wrong (row or radius), not the geometry: compare against `marks9.html` line 69 before changing anything.

- [ ] **Step 5: Commit**

```bash
cd web && npx biome check --write scripts/brand-geometry.mjs scripts/brand-geometry.d.mts tests/brand.test.ts && npm run typecheck
cd .. && git add web/scripts/brand-geometry.mjs web/scripts/brand-geometry.d.mts web/tests/brand.test.ts
git commit -m "feat(brand): C1 ring mark geometry with the fjord clearance gate"
```

---

### Task 3: Colours and the icon drawings

**Files:**
- Modify: `web/scripts/brand-geometry.mjs`, `web/scripts/brand-geometry.d.mts`
- Test: `web/tests/brand.test.ts`

**Interfaces:**
- Consumes: Task 2's `aboutBase`, `pointList`, `sized`, `stackC`, `stonePoints`, `ringMark`, `ringMarkPoints`, `svgDoc`, `MOUNTAIN`, `C1`; `parseThemeTokens`, `contrastRatio` from `web/src/services/contrast.ts`.
- Produces: `type Colors = { accent; ground; text; muted; tint1; tint2 }` (all `string`), `type Placement = { s: number; tx: number; ty: number }`, `mix(a, b, t): string`, `brandColors(tokens): Colors`, `SCENE_PLACEMENT`, `scene(ink, placement?): string`, `maskablePlacement(): Placement`, `medallion(colors, points?): string`, `plateIcon(colors, placement?): string`. In the test file: `themes`, `light`, `dark` (each `Colors`).

- [ ] **Step 1: Write the failing tests**

Add imports to `web/tests/brand.test.ts`: `readFileSync` from `node:fs`; `contrastRatio`, `parseThemeTokens` from `../src/services/contrast.ts`; and `brandColors`, `maskablePlacement`, `plateIcon` from `../scripts/brand-geometry.mjs`. Append:

```ts
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
		["light accent on paper (medallion, ico, light banner, og, social)", light.accent, light.ground],
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
	const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(plate.slice(i, i + 2), 16))
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
	test.each([192, 512])("the maskable icon keeps the scene inside the safe circle at %i", (size) => {
		expect(outsideSafeCircle(plateIcon(light, maskablePlacement()), size, light.accent)).toBe(0)
	})

	test("the safe-zone gate fails on the unfitted scene", () => {
		expect(outsideSafeCircle(plateIcon(light), 512, light.accent)).toBeGreaterThan(0)
	})
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/brand.test.ts`
Expected: FAIL, `brandColors` is not exported.

- [ ] **Step 3: Implement**

Append to `web/scripts/brand-geometry.mjs`:

```js
const rgb = (hex) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))

// t is the share of a. Rounds half up, which reproduces the spec's tint table exactly.
export function mix(a, b, t) {
	const [ca, cb] = [rgb(a), rgb(b)]
	const channel = (i) => Math.round(ca[i] * t + cb[i] * (1 - t)).toString(16).padStart(2, "0")
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
const place = ({ s, tx, ty }) => ([x, y]) => [tx + s * (x - 16), ty + s * (y - 16)]

export const SCENE_PLACEMENT = { s: 0.72, tx: 16, ty: 16.6 }

export function scene(ink, placement = SCENE_PLACEMENT) {
	const shapes = sceneShapes().map((shape) => `<polygon points="${pointList(shape.map(place(placement)))}"/>`)
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
	return svgDoc(32, 32, `<circle cx="16" cy="16" r="16" fill="${colors.ground}"/>${ringMark(colors.accent, { points })}`)
}

// Full-bleed accent plate with the scene in paper: apple-touch (iOS rounds the corners) and,
// with maskablePlacement(), the maskable icons.
export function plateIcon(colors, placement = SCENE_PLACEMENT) {
	return svgDoc(32, 32, `<rect width="32" height="32" fill="${colors.accent}"/>${scene(colors.ground, placement)}`)
}
```

Append to `web/scripts/brand-geometry.d.mts`:

```ts
export type Colors = {
	accent: string
	ground: string
	text: string
	muted: string
	tint1: string
	tint2: string
}
export type Placement = { s: number; tx: number; ty: number }
export declare const SCENE_PLACEMENT: Placement
export declare function mix(a: string, b: string, t: number): string
export declare function brandColors(tokens: Record<string, string>): Colors
export declare function scene(ink: string, placement?: Placement): string
export declare function maskablePlacement(): Placement
export declare function medallion(colors: Colors, points?: RingPoints): string
export declare function plateIcon(colors: Colors, placement?: Placement): string
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run tests/brand.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
cd web && npx biome check --write scripts/brand-geometry.mjs scripts/brand-geometry.d.mts tests/brand.test.ts && npm run typecheck
cd .. && git add web/scripts/brand-geometry.mjs web/scripts/brand-geometry.d.mts web/tests/brand.test.ts
git commit -m "feat(brand): token colours, medallion, plate and maskable icon drawings"
```

---

### Task 4: Banner, share card and social preview

**Files:**
- Modify: `web/scripts/brand-geometry.mjs`, `web/scripts/brand-geometry.d.mts`
- Test: `web/tests/brand.test.ts`

**Interfaces:**
- Consumes: `FONTS`, `fmt`, `pointList`, `sized`, `stackC`, `stonePoints`, `ringMark`, `svgDoc`, `SUMMIT`, `C1`, `Colors`.
- Produces: `type Layout = { width: number; height: number; land: number; text: { x: number; y: number; scale: number } }`, `LAYOUTS: { banner: Layout; og: Layout; social: Layout }`, `landscapeCard(colors, layout): string`.

The og and social layouts below are starting values. Task 9 shows them to Malin on the contact sheet, and she approves or adjusts them there. Any adjustment changes only the numbers in `LAYOUTS`.

- [ ] **Step 1: Write the failing tests**

Add `LAYOUTS`, `landscapeCard` and `type Layout` to the geometry import. Append:

```ts
// Where "Varde" sits in a card: block origin + (100..250, 14..56) block units, scaled.
const nameBox = ({ text }: Layout) => [
	Math.round(text.x + 100 * text.scale),
	Math.round(text.y + 14 * text.scale),
	Math.round(text.x + 250 * text.scale),
	Math.round(text.y + 56 * text.scale),
]

// Bounding box of every pixel close to the text colour, measured, not estimated.
function textBounds(image: Image, hex: string) {
	const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16))
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
```

Add `type Colors` to the geometry import too.

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/brand.test.ts`
Expected: FAIL, `LAYOUTS` is not exported.

- [ ] **Step 3: Implement**

Append to `web/scripts/brand-geometry.mjs`:

```js
// The banner's three ranges in banner units (1280x320), back to front.
const RANGES = {
	back: "M520,320 L660,210 L720,236 L850,96 L915,150 L975,122 L1110,215 L1190,170 L1280,212 L1280,320Z",
	middle: "M600,320 L740,246 L790,262 L880,190 L940,222 L1070,178 L1180,250 L1230,236 L1280,262 L1280,320Z",
	front: "M680,320 L810,276 L860,288 L965,214 L1010,206 L1055,214 L1130,266 L1165,256 L1280,296 L1280,320Z",
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

// Ring mark x2.4, name, eyebrow and tagline, in banner units from the block's origin.
function textBlock(colors, { x, y, scale }) {
	return [
		`<g transform="translate(${fmt(x)},${fmt(y)}) scale(${fmt(scale)})">`,
		`<g transform="scale(2.4)">${ringMark(colors.accent, { idPrefix: "card" })}</g>`,
		`<text x="96" y="58" font-family="${FONTS.display}" font-weight="600" font-size="64" fill="${colors.text}">Varde</text>`,
		`<text x="2" y="132" font-family="${FONTS.body}" font-weight="600" font-size="15" letter-spacing="1.5" fill="${colors.muted}">HJELPETJENESTER I NORGE</text>`,
		`<text x="0" y="168" font-family="${FONTS.display}" font-weight="600" font-size="30" fill="${colors.text}">Finn riktig hjelp, der du bor.</text>`,
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
```

Append to `web/scripts/brand-geometry.d.mts`:

```ts
export type Layout = {
	width: number
	height: number
	land: number
	text: { x: number; y: number; scale: number }
}
export declare const LAYOUTS: { banner: Layout; og: Layout; social: Layout }
export declare function landscapeCard(colors: Colors, layout: Layout): string
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run tests/brand.test.ts`
Expected: all PASS. If a centre-90 % case fails, report the measured box; do not change `LAYOUTS` without Malin (Task 9 is where layouts get approved). Exception: if only `x1` fails by overflow, lower that layout's `text.scale` by 0.05 steps until it passes and note it for the contact sheet.

- [ ] **Step 5: Commit**

```bash
cd web && npx biome check --write scripts/brand-geometry.mjs scripts/brand-geometry.d.mts tests/brand.test.ts && npm run typecheck
cd .. && git add web/scripts/brand-geometry.mjs web/scripts/brand-geometry.d.mts web/tests/brand.test.ts
git commit -m "feat(brand): layered-range banner, share card and social preview drawings"
```

---

### Task 5: The ICO writer

**Files:**
- Create: `web/scripts/ico.mjs`, `web/scripts/ico.d.mts`
- Test: `web/tests/brand.test.ts`

**Interfaces:**
- Produces: `pngToIco(png: Uint8Array, size: number): Uint8Array` from `web/scripts/ico.mjs`. In the test file: `checkIco(bytes: Uint8Array)` returning `{ reserved, type, count, width, height, pngSignature: boolean }`.

- [ ] **Step 1: Write the failing test**

Add `import { pngToIco } from "../scripts/ico.mjs"`. Append:

```ts
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
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/brand.test.ts`
Expected: FAIL, cannot resolve `../scripts/ico.mjs`.

- [ ] **Step 3: Implement**

Create `web/scripts/ico.mjs`:

```js
// web/scripts/ico.mjs
// PNG bytes to a single-image .ico: a 6-byte header, one 16-byte directory entry, then the PNG
// itself (every browser since Vista-era IE reads PNG-in-ICO). No dependency.
export function pngToIco(png, size) {
	const out = new Uint8Array(22 + png.length)
	const view = new DataView(out.buffer)
	view.setUint16(0, 0, true) // reserved
	view.setUint16(2, 1, true) // type 1: icon
	view.setUint16(4, 1, true) // one image
	out[6] = size >= 256 ? 0 : size // width, 0 means 256
	out[7] = size >= 256 ? 0 : size // height
	view.setUint16(10, 1, true) // colour planes
	view.setUint16(12, 32, true) // bits per pixel
	view.setUint32(14, png.length, true) // image size
	view.setUint32(18, 22, true) // image offset
	out.set(png, 22)
	return out
}
```

Create `web/scripts/ico.d.mts`:

```ts
// Sibling declaration for ico.mjs (no allowJs/@types/node in this project).
export declare function pngToIco(png: Uint8Array, size: number): Uint8Array
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/brand.test.ts`
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
cd web && npx biome check --write scripts/ico.mjs scripts/ico.d.mts tests/brand.test.ts && npm run typecheck
cd .. && git add web/scripts/ico.mjs web/scripts/ico.d.mts web/tests/brand.test.ts
git commit -m "feat(brand): dependency-free single-image ICO writer"
```

---

### Task 6: `npm run brand` and the generated pack

**Files:**
- Modify: `web/scripts/brand-geometry.mjs`, `web/scripts/brand-geometry.d.mts`, `web/package.json`
- Create: `web/scripts/brand.mjs`
- Generated (committed): `docs/brand/src/{ring-light,ring-dark,medallion,apple-touch-icon,maskable,banner-light,banner-dark,og,social-preview}.svg`, `docs/brand/src/hashes.json`, `docs/brand/banner-light.png`, `docs/brand/banner-dark.png`, `docs/brand/social-preview.png`, `web/public/favicon.svg` (replaced), `web/public/favicon.ico`, `web/public/apple-touch-icon.png`, `web/public/icon-192.png`, `web/public/icon-512.png`, `web/public/icon-maskable-192.png`, `web/public/icon-maskable-512.png`, `web/public/og.png`, `web/src/components/brandPaths.ts`
- Test: `web/tests/brand.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 1 to 5.
- Produces: `SRC = "docs/brand/src"`, `PNG_TARGETS: [master, out, width][]`, `ICO = { master, out, size }`, `faviconStyle(light, dark): string`, `faviconSvg(light, dark, points?): string`, `brandPathsTs(points): string`, `masters(themes, geometry?): Record<string, string>` (repo-relative path to file content). `brandPaths.ts` exports `RING`, `CLIP_R`, `FJORD_LINES`, `MOUNTAIN_POINTS: string`, `STONE_POINTS: readonly string[]` (Task 7 consumes these). `faviconStyle` output is what Task 7 hashes.

- [ ] **Step 1: Write the failing tests**

Add `createHash` from `node:crypto`, `existsSync` to the `node:fs` import, and `masters`, `SRC` to the geometry import. Append:

```ts
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
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/brand.test.ts`
Expected: FAIL, `masters` is not exported.

- [ ] **Step 3: Add the pack functions to the geometry**

Append to `web/scripts/brand-geometry.mjs`:

```js
// The favicon switches to the dark accent through a media query. Cloudflare sends the site CSP
// on favicon.svg too, so this exact text is hashed into style-src (public/_headers);
// tests/headers.test.ts rebuilds the hash from the file.
export const faviconStyle = (light, dark) =>
	`svg{color:${light}}@media (prefers-color-scheme:dark){svg{color:${dark}}}`

export function faviconSvg(light, dark, points = ringMarkPoints()) {
	return svgDoc(32, 32, `<style>${faviconStyle(light, dark)}</style>${ringMark("currentColor", { points })}`)
}

// BrandMark.tsx's data. Generated, so it is excluded from Biome (biome.json) and compared byte
// for byte by tests/brand.test.ts.
export function brandPathsTs(points) {
	return [
		"// Generated by web/scripts/brand.mjs from web/scripts/brand-geometry.mjs. Do not edit:",
		"// change the geometry and run `npm run brand`. tests/brand.test.ts fails on drift.",
		`export const RING = ${JSON.stringify(RING)} as const`,
		`export const CLIP_R = ${CLIP_R}`,
		`export const FJORD_LINES = ${JSON.stringify(FJORD_LINES)} as const`,
		`export const MOUNTAIN_POINTS = ${JSON.stringify(points.mountain)}`,
		`export const STONE_POINTS = ${JSON.stringify(points.stones)} as const`,
		"",
	].join("\n")
}

export const SRC = "docs/brand/src"

// Every text file the build writes, by repo-relative path. geometry overrides the ring mark's
// numbers (the drift test uses it to prove the gate can fail).
export function masters(themes, geometry = {}) {
	const light = brandColors(themes.light)
	const dark = brandColors(themes.dark)
	const points = ringMarkPoints(geometry)
	return {
		[`${SRC}/ring-light.svg`]: svgDoc(32, 32, ringMark(light.accent, { points })),
		[`${SRC}/ring-dark.svg`]: svgDoc(32, 32, ringMark(dark.accent, { points })),
		[`${SRC}/medallion.svg`]: medallion(light, points),
		[`${SRC}/apple-touch-icon.svg`]: plateIcon(light),
		[`${SRC}/maskable.svg`]: plateIcon(light, maskablePlacement()),
		[`${SRC}/banner-light.svg`]: landscapeCard(light, LAYOUTS.banner),
		[`${SRC}/banner-dark.svg`]: landscapeCard(dark, LAYOUTS.banner),
		[`${SRC}/og.svg`]: landscapeCard(light, LAYOUTS.og),
		[`${SRC}/social-preview.svg`]: landscapeCard(light, LAYOUTS.social),
		"web/public/favicon.svg": faviconSvg(light.accent, dark.accent, points),
		"web/src/components/brandPaths.ts": brandPathsTs(points),
	}
}

// Master (in SRC), output path, render width.
export const PNG_TARGETS = [
	["apple-touch-icon.svg", "web/public/apple-touch-icon.png", 180],
	["medallion.svg", "web/public/icon-192.png", 192],
	["medallion.svg", "web/public/icon-512.png", 512],
	["maskable.svg", "web/public/icon-maskable-192.png", 192],
	["maskable.svg", "web/public/icon-maskable-512.png", 512],
	["og.svg", "web/public/og.png", 1200],
	["banner-light.svg", "docs/brand/banner-light.png", 1280],
	["banner-dark.svg", "docs/brand/banner-dark.png", 1280],
	["social-preview.svg", "docs/brand/social-preview.png", 1280],
]
export const ICO = { master: "medallion.svg", out: "web/public/favicon.ico", size: 32 }
```

Append to `web/scripts/brand-geometry.d.mts`:

```ts
export type Themes = { light: Record<string, string>; dark: Record<string, string> }
export declare const SRC: string
export declare const PNG_TARGETS: [master: string, out: string, width: number][]
export declare const ICO: { master: string; out: string; size: number }
export declare function faviconStyle(light: string, dark: string): string
export declare function faviconSvg(light: string, dark: string, points?: RingPoints): string
export declare function brandPathsTs(points: RingPoints): string
export declare function masters(themes: Themes, geometry?: Geometry): Record<string, string>
```

- [ ] **Step 4: Write the build script**

Create `web/scripts/brand.mjs`:

```js
// web/scripts/brand.mjs
// npm run brand: builds every brand file from scripts/brand-geometry.mjs and the colour tokens,
// renders the PNGs with resvg and writes docs/brand/src/hashes.json last, so a run that dies
// halfway leaves stale hashes and tests/brand.test.ts goes red. Run it after any change to the
// geometry or the tokens and commit the output. CI never runs it.
// `npm run brand -- --sheet` also writes a review contact sheet to .superpowers/brand-review/.
// Imports contrast.ts directly: Node 22.18+ strips the types.
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Resvg } from "@resvg/resvg-js"
import { parseThemeTokens } from "../src/services/contrast.ts"
import { brandColors, FONT_FILES, ICO, masters, medallion, PNG_TARGETS, SRC } from "./brand-geometry.mjs"
import { pngToIco } from "./ico.mjs"

const repo = join(dirname(fileURLToPath(import.meta.url)), "../..")
const at = (rel) => join(repo, rel)

const fonts = FONT_FILES.map(at)
for (const file of fonts) {
	if (!existsSync(file)) throw new Error(`Missing font ${file}. See docs/brand/fonts/SOURCE.md.`)
}

const render = (svg, width, background) =>
	new Resvg(svg, {
		fitTo: { mode: "width", value: width },
		background,
		font: { loadSystemFonts: false, fontFiles: fonts },
	})
		.render()
		.asPng()

const themes = parseThemeTokens(readFileSync(at("web/src/styles/tokens.css"), "utf8"))
const files = masters(themes)
for (const [rel, content] of Object.entries(files)) {
	mkdirSync(dirname(at(rel)), { recursive: true })
	writeFileSync(at(rel), content)
}

for (const [master, out, width] of PNG_TARGETS) {
	writeFileSync(at(out), render(files[`${SRC}/${master}`], width))
	console.log(`rendered ${out}`)
}
writeFileSync(at(ICO.out), pngToIco(render(files[`${SRC}/${ICO.master}`], ICO.size), ICO.size))
console.log(`rendered ${ICO.out}`)

const hashes = {}
for (const [rel, content] of Object.entries(files)) {
	if (rel.startsWith(`${SRC}/`)) {
		hashes[rel.slice(SRC.length + 1)] = createHash("sha256").update(content).digest("hex")
	}
}
writeFileSync(at(`${SRC}/hashes.json`), `${JSON.stringify(hashes, null, 2)}\n`)
console.log(`wrote ${SRC}/hashes.json`)

if (process.argv.includes("--sheet")) writeSheet()

// Every asset at real size on the backgrounds it will meet, plus the renders the silhouette
// check needs. A review tool, not a deliverable.
function writeSheet() {
	const dir = at(".superpowers/brand-review")
	mkdirSync(dir, { recursive: true })
	const light = brandColors(themes.light)
	const dark = brandColors(themes.dark)
	writeFileSync(join(dir, "ring-light-32.png"), render(files[`${SRC}/ring-light.svg`], 32, light.ground))
	writeFileSync(join(dir, "ring-dark-32.png"), render(files[`${SRC}/ring-dark.svg`], 32, dark.ground))
	writeFileSync(join(dir, "medallion-dark-512.png"), render(medallion(dark), 512))
	const up = (rel) => `../../${rel}`
	const tabs = [
		["#ffffff", "#1d1b17", "ring-light"],
		["#f0f0f4", "#1d1b17", "ring-light"],
		["#35363a", "#f3efe7", "ring-dark"],
		["#42414d", "#f3efe7", "ring-dark"],
	]
	const tab = ([bg, fg, ring]) =>
		`<div class="tab" style="background:${bg};color:${fg}"><img src="${up(`${SRC}/${ring}.svg`)}" width="16" height="16" alt=""><img src="${up(`${SRC}/${ring}.svg`)}" width="32" height="32" alt=""><img src="${up("web/public/favicon.ico")}" width="16" height="16" alt="">Varde</div>`
	const masked = (radius) =>
		`<div class="mask" style="border-radius:${radius}"><img src="${up("web/public/icon-maskable-192.png")}" width="96" height="96" alt=""></div>`
	const launcher = (bg) =>
		`<div style="background:${bg};padding:24px"><img src="${up("web/public/icon-192.png")}" width="96" height="96" alt=""></div>`
	const html = `<!doctype html><meta charset="utf-8"><title>Varde brand contact sheet</title>
<style>body{font:14px system-ui;margin:24px;background:#e8e4dc;color:#1d1b17}section{margin:0 0 40px}h2{font-size:16px}.row{display:flex;gap:24px;align-items:end;flex-wrap:wrap}.tab{display:flex;gap:8px;align-items:center;padding:8px 12px;border-radius:8px 8px 0 0;width:200px}.mask{width:96px;height:96px;overflow:hidden}img{display:block}</style>
<section><h2>Favicon on browser tabs: ring mark at 16 and 32 px, then favicon.ico at 16 px</h2><div class="row">${tabs.map(tab).join("")}</div></section>
<section><h2>Home screen: apple-touch at 60 px with iOS rounding, maskable under circle, squircle and square masks</h2><div class="row"><img src="${up("web/public/apple-touch-icon.png")}" width="60" height="60" style="border-radius:13px" alt="">${["50%", "30%", "0"].map(masked).join("")}</div></section>
<section><h2>Medallion (purpose any) on light and dark launchers</h2><div class="row">${["#ffffff", "#202124"].map(launcher).join("")}</div></section>
<section><h2>Share card: og.png at 600 px in a link-preview frame</h2><figure style="margin:0;width:600px;border:1px solid #c9c2b6;border-radius:12px;overflow:hidden;background:#fff"><img src="${up("web/public/og.png")}" width="600" height="315" alt=""><figcaption style="padding:10px 12px">varde.pages.dev<br><strong>Varde</strong></figcaption></figure></section>
<section><h2>Banners at real size</h2><img src="${up("docs/brand/banner-light.png")}" width="1280" height="320" alt=""><br><img src="${up("docs/brand/banner-dark.png")}" width="1280" height="320" alt=""></section>
<section><h2>GitHub social preview at real size</h2><img src="${up("docs/brand/social-preview.png")}" width="1280" height="640" alt=""></section>
`
	writeFileSync(join(dir, "sheet.html"), html)
	console.log("wrote .superpowers/brand-review/sheet.html")
}
```

Add to `web/package.json` `scripts`, after `"fonts"`:

```json
"brand": "node scripts/brand.mjs",
```

- [ ] **Step 5: Generate the pack**

Run from `web/`: `npm run brand`
Expected: nine `rendered …png` lines, `rendered web/public/favicon.ico`, `wrote docs/brand/src/hashes.json`. If Node complains about importing `contrast.ts`, check `node --version` is 22.18 or later.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run tests/brand.test.ts`
Expected: all PASS.

- [ ] **Step 7: Prove the line endings, then commit**

```bash
cd web && npx biome check --write scripts/brand.mjs scripts/brand-geometry.mjs scripts/brand-geometry.d.mts tests/brand.test.ts package.json && npm run typecheck
cd .. && git add -A docs/brand web/public web/src/components/brandPaths.ts web/scripts web/tests/brand.test.ts web/package.json
git ls-files --eol docs/brand/src web/public/favicon.svg web/src/components/brandPaths.ts
```

Expected: every line shows `i/lf` and `attr/text eol=lf` (the `docs/brand/src` files) or `attr/text=auto eol=lf` (the `web/` files). Any `w/crlf` means a rule is missing: fix `.gitattributes` before committing. Then:

```bash
git commit -m "feat(brand): npm run brand and the generated icon, card and banner pack"
```

---

### Task 7: Site wiring (mark, header, icon links, CSP)

**Files:**
- Modify: `web/src/components/BrandMark.tsx`, `web/src/components/Header.tsx:23`, `web/index.html:8`, `web/public/_headers`, `web/tests/headers.test.ts`
- Create: `web/tests/brandMark.test.tsx`

**Interfaces:**
- Consumes: `RING`, `CLIP_R`, `FJORD_LINES`, `MOUNTAIN_POINTS`, `STONE_POINTS` from `web/src/components/brandPaths.ts` (Task 6). The `<style>` text inside `web/public/favicon.svg` (Task 6).
- Produces: `BrandMark({ className })`, unchanged signature.

- [ ] **Step 1: Write the failing tests**

Create `web/tests/brandMark.test.tsx`:

```tsx
import { render } from "@testing-library/react"
import { expect, test } from "vitest"
import { BrandMark } from "../src/components/BrandMark.tsx"

test("two marks on one page each point at their own clip and mask", () => {
	const { container } = render(
		<>
			<BrandMark />
			<BrandMark />
		</>
	)
	const svgs = [...container.querySelectorAll("svg")]
	expect(svgs).toHaveLength(2)
	const ids = svgs.flatMap((svg) => {
		const scene = svg.querySelector("g[clip-path]")
		const refs = [scene?.getAttribute("clip-path"), scene?.getAttribute("mask")].map(
			(value) => value?.match(/^url\(#(.+)\)$/)?.[1]
		)
		for (const id of refs) {
			expect(id).toBeDefined()
			expect(document.getElementById(id as string)?.closest("svg")).toBe(svg)
		}
		return refs
	})
	expect(new Set(ids).size).toBe(4)
})

test("the mark stays decorative and draws in currentColor", () => {
	const { container } = render(<BrandMark />)
	const svg = container.querySelector("svg")
	expect(svg).toHaveAttribute("aria-hidden", "true")
	expect(svg?.querySelector("circle[stroke='currentColor']")).not.toBeNull()
	expect(svg?.querySelectorAll("polygon")).toHaveLength(4)
})
```

In `web/tests/headers.test.ts`, add a constant after `THEME_INIT_HASH` (the value is filled in Step 3):

```ts
// favicon.svg switches to the dark accent with a <style> media query, and Cloudflare sends the
// site CSP on the SVG too, so style-src carries that block's hash like the react-aria one.
const FAVICON_STYLE_HASH = "'sha256-REPLACE_IN_STEP_3'"
```

change the CSP constant's `style-src` part to `style-src 'self' ${PRESSABLE_STYLE_HASH} ${FAVICON_STYLE_HASH}`, and append:

```ts
// Hash exactly the text between the favicon's <style> tags (indexOf, not a regex: CodeQL flags
// tag-matching regexes). A favicon change without a new hash turns this red.
test("the style-src hash matches favicon.svg's <style> block", () => {
	const svg = read("../public/favicon.svg")
	const open = svg.indexOf("<style>")
	const close = svg.indexOf("</style>", open)
	expect(open).toBeGreaterThan(-1)
	expect(close).toBeGreaterThan(open)
	const css = svg.slice(open + "<style>".length, close)
	const hash = `'sha256-${createHash("sha256").update(css).digest("base64")}'`
	expect(hash).toBe(FAVICON_STYLE_HASH)
})
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/brandMark.test.tsx tests/headers.test.ts`
Expected: brandMark FAILS (no `g[clip-path]`, three `rect`s), headers FAILS on the placeholder hash and the CSP line.

- [ ] **Step 3: Implement**

Replace `web/src/components/BrandMark.tsx`:

```tsx
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
```

In `web/src/components/Header.tsx` line 23, change `h-6 w-6` to `h-8 w-8`.

In `web/index.html`, replace line 8 (`<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`) with:

```html
		<!-- sizes="32x32" keeps browsers that read both from picking the .ico over the SVG. -->
		<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
		<link rel="icon" href="/favicon.ico" sizes="32x32" />
		<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
```

Compute the favicon style hash from `web/`:

```bash
node -e "const s=require('fs').readFileSync('public/favicon.svg','utf8');const o=s.indexOf('<style>')+7;const c=s.indexOf('</style>',o);console.log(\"'sha256-\"+require('crypto').createHash('sha256').update(s.slice(o,c)).digest('base64')+\"'\")"
```

Put the printed value into `FAVICON_STYLE_HASH` in `headers.test.ts`, and in `web/public/_headers` change `style-src 'self' 'sha256-38Rh…='` to `style-src 'self' 'sha256-38RhXrc7EdReTKsOm23ZPOCUgniTUUcjky8QOOrQx6o=' <printed value>`.

- [ ] **Step 4: Run the whole suite**

Run: `npm test`
Expected: all PASS, including `shell.test.tsx`, `axe.test.tsx` and `hydration.test.tsx`, which render the header. A hydration mismatch here would mean `useId` differs between server and client; report it rather than working around it.

- [ ] **Step 5: Commit**

```bash
cd web && npx biome check --write src/components/BrandMark.tsx src/components/Header.tsx tests/brandMark.test.tsx tests/headers.test.ts && npm run typecheck
cd .. && git add web/src/components/BrandMark.tsx web/src/components/Header.tsx web/index.html web/public/_headers web/tests/brandMark.test.tsx web/tests/headers.test.ts
git commit -m "feat(brand): C1 mark in the header, icon links and the favicon CSP hash"
```

---

### Task 8: Share-card tags in the prerender

**Files:**
- Modify: `web/scripts/prerender.mjs:84-95` (`headTags`)
- Test: `web/tests/prerender.test.ts`

**Interfaces:**
- Consumes: `head: { title, description, path, lang }` and `siteOrigin` as `headTags` already receives them.
- Produces: no new exports. Every prerendered page gains the og and twitter tags.

- [ ] **Step 1: Write the failing test**

Append to `web/tests/prerender.test.ts`:

```ts
test("every page carries the share-card tags, absolute and escaped", async () => {
	const { dataDir, distDir } = setup([row], [hamar])
	const render = vi.fn(async (url: string) => ({
		html: `<main>${url}</main>`,
		head: {
			title: 'Tittel "A" <b> & C',
			description: "D & E",
			path: url.replace(/^\/en/, "") || "/",
			lang: url.startsWith("/en") ? "en" : "nb",
		},
	}))
	const { pages } = await prerenderSite({
		dataDir,
		distDir,
		render,
		split: stubSplit,
		siteOrigin: "https://varde.pages.dev",
		log: () => {},
	})
	expect(pages).toHaveLength(8)
	for (const url of pages) {
		const file = url.endsWith("/") ? join(distDir, url, "index.html") : `${join(distDir, url)}.html`
		const html = readFileSync(file, "utf8")
		const en = url.startsWith("/en")
		const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1]
		expect(canonical, url).toBeDefined()
		const tag = (property: string, content: string) =>
			`<meta property="${property}" content="${content}" />`
		expect(html).toContain(tag("og:url", canonical as string))
		expect(html).toContain(tag("og:type", "website"))
		expect(html).toContain(tag("og:site_name", "Varde"))
		expect(html).toContain(tag("og:title", "Tittel &quot;A&quot; &lt;b&gt; &amp; C"))
		expect(html).toContain(tag("og:description", "D &amp; E"))
		expect(html).toContain(tag("og:locale", en ? "en_US" : "nb_NO"))
		expect(html).toContain(tag("og:image", "https://varde.pages.dev/og.png"))
		expect(html).toContain(tag("og:image:width", "1200"))
		expect(html).toContain(tag("og:image:height", "630"))
		expect(html).toContain(
			tag(
				"og:image:alt",
				en
					? "The Varde logo, a cairn on a mountain top, with the Norwegian tagline Finn riktig hjelp, der du bor."
					: "Varde-logoen, en varde på en fjelltopp, og teksten Finn riktig hjelp, der du bor."
			)
		)
		expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />')
		expect(html).not.toContain('content="Tittel "A"')
	}
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run tests/prerender.test.ts`
Expected: the new test FAILS on the missing `og:url` tag; the existing tests still pass.

- [ ] **Step 3: Implement**

In `web/scripts/prerender.mjs`, replace `headTags` with:

```js
// One share card for every page in both languages: the service and its name are Norwegian.
// Every value goes through escapeHtml, because titles and descriptions come from service names.
const OG_LOCALE = { nb: "nb_NO", en: "en_US" }
const OG_IMAGE_ALT = {
	nb: "Varde-logoen, en varde på en fjelltopp, og teksten Finn riktig hjelp, der du bor.",
	en: "The Varde logo, a cairn on a mountain top, with the Norwegian tagline Finn riktig hjelp, der du bor.",
}

function headTags(head, siteOrigin) {
	if (!head) return ""
	const abs = (lang, path) => `${siteOrigin}${prefix(lang)}${path}`
	const canonical = abs(head.lang, head.path)
	const og = (property, content) => `<meta property="${property}" content="${escapeHtml(content)}" />`
	return [
		`<title>${escapeHtml(head.title)}</title>`,
		`<meta name="description" content="${escapeHtml(head.description)}" />`,
		`<link rel="canonical" href="${canonical}" />`,
		`<link rel="alternate" hreflang="nb" href="${abs("nb", head.path)}" />`,
		`<link rel="alternate" hreflang="en" href="${abs("en", head.path)}" />`,
		`<link rel="alternate" hreflang="x-default" href="${abs("nb", head.path)}" />`,
		og("og:type", "website"),
		og("og:site_name", "Varde"),
		og("og:title", head.title),
		og("og:description", head.description),
		og("og:url", canonical),
		og("og:locale", OG_LOCALE[head.lang]),
		og("og:image", `${siteOrigin}/og.png`),
		og("og:image:width", "1200"),
		og("og:image:height", "630"),
		og("og:image:alt", OG_IMAGE_ALT[head.lang]),
		`<meta name="twitter:card" content="summary_large_image" />`,
	].join("\n\t\t")
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run tests/prerender.test.ts`, then `npm test`.
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
cd web && npx biome check --write scripts/prerender.mjs tests/prerender.test.ts
cd .. && git add web/scripts/prerender.mjs web/tests/prerender.test.ts
git commit -m "feat(brand): Open Graph and Twitter card tags on every prerendered page"
```

---

### Task 9: Review gates and PR 1

No new code unless a gate fails. Every gate below ends with a recorded result that goes into the PR description.

**Files:**
- Possibly modify: `web/scripts/brand-geometry.mjs` (`LAYOUTS` only, if Malin adjusts the og or social layout), then regenerate.

- [ ] **Step 1: Full local check**

From `web/`: `npm test && npx biome ci . && npm run build:client`
Expected: all green. (Full `npm run build` fails locally on `prerender` without the Neon export; CI runs `biome ci` + `build:client`, so this is the local equivalent.)

- [ ] **Step 2: Header alignment, measured**

Start the dev server with the preview tools (`preview_start`). At widths 320 and 1280, each in light and dark (toggle with the theme button), run in the page:

```js
const link = document.querySelector("header a")
const mark = link.querySelector("svg").getBoundingClientRect()
const name = link.querySelector("span").getBoundingClientRect()
;({ markMid: mark.top + mark.height / 2, nameMid: name.top + name.height / 2, markH: mark.height })
```

Pass: `markH` is 32 and `|markMid - nameMid| <= 0.5` in all four runs. Record the numbers and take one screenshot of the header at 320 light and 1280 dark.

Forced colours: the browser pane cannot emulate `forced-colors: active`. Ask Malin to turn on a Windows contrast theme (Settings, Accessibility, Contrast themes), open the dev server in her own browser and confirm the header mark is still drawn. The mark uses only `currentColor`, which forced colours remap, so this is a confirmation, not a likely failure.

- [ ] **Step 3: Contact sheet with Malin**

From `web/`: `npm run brand -- --sheet`. Serve the repo root (`python -m http.server 8765 --bind 127.0.0.1`, background) and open `http://127.0.0.1:8765/.superpowers/brand-review/sheet.html` in the browser pane. Before showing it, measure: in the og and social previews, text block left margin (px) and the gap between the tagline and the nearest peak, read from the rendered images, not estimated. Show Malin the sheet with those numbers and ask her to approve, in order: favicon on tabs, home-screen icons, medallion, og layout, social layout, banners. Any change she asks for to og or social is a `LAYOUTS` number change, then `npm run brand`, `npm test`, re-show. Commit layout changes as `fix(brand): og and social layout as approved on the contact sheet`.

- [ ] **Step 4: Silhouette check (fresh eyes)**

Dispatch two fresh subagents (general-purpose, no context from this work), one per theme. Light gets `web/public/icon-512.png` and `.superpowers/brand-review/ring-light-32.png`; dark gets `.superpowers/brand-review/medallion-dark-512.png` and `.superpowers/brand-review/ring-dark-32.png`. Give each this prompt with the absolute paths filled in:

```
Look at these two images with the Read tool: <path A> and <path B>. They are the same small
logo at two sizes. For each: what does it depict, in a few words, and what else might someone
take it for at a first glance? Answer in plain text, one short paragraph per image.
```

When it answers, send a second message to the same subagent (SendMessage):

```
Now be blunt: could either image read as anything rude, bodily or embarrassing to someone
seeing it small on a phone? If yes, say what and which part of the shape causes it.
```

Pass: the first answer names a cairn, stacked stones or a mountain and nothing bodily (no penis, no poop). The first answer decides pass or fail because it is unprompted; a leading question gets hedged "it could be" answers from any shape. The probe answer always goes to Malin word for word, pass or fail, and she weighs it. On a fail, stop the build and bring Malin the exact words. Never tweak quietly.

- [ ] **Step 5: Name check**

In the browser pane, search "Varde" at `https://search.patentstyret.no/` (trademarks, classes 35, 44 and 45). Record the date, the query and each hit's number, owner and status. A live registration or application in those classes for a similar service stops the rollout for Malin's decision.

- [ ] **Step 6: Licence carve-out**

The mark becomes public the moment PR 1 is pushed, and both licence files currently grant MIT on everything in the repo. The carve-out ships with the files it covers, not later. Append to both `LICENSE` and `web/LICENSE`, after the MIT text:

```

The MIT licence above covers the code. It does not cover the Varde name or mark: every file in
docs/brand/ and the icon files in web/public/ (favicon.svg, favicon.ico, apple-touch-icon.png,
icon-*.png, og.png) are all rights reserved. The fonts in docs/brand/fonts/ keep their own SIL
Open Font License 1.1.
```

```bash
git add LICENSE web/LICENSE
git commit -m "docs(brand): keep the Varde name and mark out of the MIT grant"
```

- [ ] **Step 7: Push and open PR 1**

```bash
git push
gh pr create --base main --head feat/brand --title "feat(brand): the Varde mark and its icon, card and banner pack" --body-file .superpowers/brand-review/pr1.md
```

Write `.superpowers/brand-review/pr1.md` first, in Malin's first-person voice, no em dashes:

```markdown
The placeholder cairn read as the poop emoji at favicon size. This replaces it with the mark
from the brand spec: a varde on a mountain inside a ring, with two fjord lines at the base.

## What ships

- The ring mark in the header (now 32 px) and as `favicon.svg`, light and dark.
- `favicon.ico`, `apple-touch-icon.png`, `icon-192/512` (medallion) and `icon-maskable-192/512`, ready for the manifest in sub-project A.
- `og.png` and Open Graph and Twitter tags on every prerendered page.
- README banners and the GitHub social preview in `docs/brand/`.
- `npm run brand`: one geometry module builds every file. Generated files are committed, CI never renders.
- `LICENSE`: the code stays MIT; the Varde name and mark are all rights reserved.

## How I checked it

- `tests/brand.test.ts`: fjord clearance, maskable safe zone, contrast, fonts, ICO, PNG sizes, drift and hashes. Each gate is also run against a known-bad input and fails.
- Header alignment at 320 and 1280, light and dark: <numbers from Step 2>.
- Contact sheet reviewed and approved: <date>.
- Silhouette check by a fresh reviewer, light: "<quote>". Dark: "<quote>".
- Name check in Patentstyret (classes 35, 44, 45) on <date>: <result>.

Spec: `docs/superpowers/specs/2026-10-01-varde-brand-design.md`.
Plan: `docs/superpowers/plans/2026-10-01-varde-brand.md`.
```

Every `<…>` is a result recorded in Steps 2 to 5. Then bind the PR with the ccd_pr tools and read its CI. The CI test run on Linux is the proof that the lockfile carries the Linux resvg binary. **Merging is Malin's call.**

---

### Task 10: Live checks after PR 1 deploys

Run once Malin has merged and Deploy Web is green.

- [ ] **Step 1: Assets answer with the right type**

```bash
for f in og.png favicon.svg favicon.ico apple-touch-icon.png icon-512.png icon-maskable-512.png; do curl -sI "https://varde.pages.dev/$f" | grep -iE "^(HTTP|content-type)"; done
```

Expected: `200` for each; `image/png`, `image/svg+xml`, and `image/x-icon` or `image/vnd.microsoft.icon` for the `.ico`.

- [ ] **Step 2: Tags on real pages**

```bash
for p in / /sok /resources/12; do curl -s "https://varde.pages.dev$p" | grep -oE '<meta property="og:(url|image)" content="[^"]+"'; done
```

Expected: each page prints an `og:url` equal to its own absolute URL and `og:image` = `https://varde.pages.dev/og.png`.

- [ ] **Step 3: Favicon dark variant under the real CSP**

Open `https://varde.pages.dev/favicon.svg` in the browser pane with `resize_window` `colorScheme: "dark"`. Read the computed colour (`getComputedStyle(document.documentElement).color` returns the dark accent `rgb(127, 195, 158)`) and `read_console_messages` with `onlyErrors`: no CSP violation. Reset the colour scheme afterwards.

- [ ] **Step 4: Share preview**

Open `https://www.opengraph.xyz/url/https%3A%2F%2Fvarde.pages.dev%2F` in the browser pane and confirm the card shows `og.png`. Decline any non-essential cookies.

- [ ] **Step 5: Record**

Add the results to the PR 1 conversation as a comment (ask Malin before posting, it is public), and to the project memory.

---

### Task 11: PR 2, the words

**Files:**
- Create: `docs/brand/guidelines.md`
- Modify: `README.md` (top), `docs/brand/varde-brief.md` ("The mark" and "Deliverables" sections)

- [ ] **Step 1: Branch**

```bash
git switch main && git pull && git switch -c docs/brand
```

- [ ] **Step 2: Guidelines**

(The `LICENSE` carve-out already shipped in PR 1, Task 9 Step 6.)

Create `docs/brand/guidelines.md` (Malin's voice; the clear space and minimum sizes below are my proposal, confirmed with her before the PR opens):

```markdown
# Varde brand guidelines

The mark is a varde on a mountain top. A varde is the cairn people build on Norwegian mountain
routes so the next person finds the way when the weather closes in. That is what this service
is for.

## The two forms

- **Ring mark.** The ring around the mountain and the cairn, with two fjord lines at the base.
  Use it on its own: the favicon, the site header, next to the name.
- **Scene.** The mountain and the cairn without the ring. Use it only inside an app-icon tile,
  because the tile is already the frame.

## The stones

Three stones, even in size but cut by hand: flat bases, ends chopped at angles with small
facets. Life is not a dance on roses, so the stones are not polished. Never round them, never
add a fourth (four blur into a tree at small sizes), never make them symmetric.

## Colour

One colour, the accent token: `#285f45` on light paper, `#7fc39e` on dark. On the web it
inherits `currentColor`. The banner adds two flat tints of the accent mixed into the paper (25 %
and 50 %). No gradients, no second brand colour.

## Clear space and size

- Keep clear space of at least a quarter of the ring's diameter on every side.
- Smallest ring mark: 16 px. Smallest app icon: 48 px.

## Don't

- Recolour it per service or per page.
- Add gradients, shadows or outlines.
- Put it on a busy photo.
- Stretch, rotate or redraw it. Change `web/scripts/brand-geometry.mjs` and run `npm run brand`.

## Name and licence

The code is MIT. The Varde name and mark are not: all rights reserved (see `LICENSE`). A
service people trust in a crisis should not be easy to copy.

Name check in Patentstyret, classes 35, 44 and 45, on <date from Task 9 Step 5>: <result>.

## Files

Masters in `docs/brand/src/`, built by `npm run brand` (run from `web/`). The pack table is in
the brand spec, `docs/superpowers/specs/2026-10-01-varde-brand-design.md`.
```

Fill the name-check line from Task 9's record.

- [ ] **Step 3: README banner**

Insert directly under `# Varde` in `README.md`:

```html
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/brand/banner-dark.png">
  <img src="docs/brand/banner-light.png" alt="Varde: hjelpetjenester i Norge. Finn riktig hjelp, der du bor." width="1280">
</picture>
```

Add to the end of the README's licence section (or a new `## Licence` section if none exists): "Code: MIT. The Varde name and mark: all rights reserved, see `LICENSE`."

- [ ] **Step 4: Rewrite the brief's mark and deliverables**

In `docs/brand/varde-brief.md`, replace the body of `## The mark` with:

```markdown
A varde on top of a mountain, inside a ring, with two fjord lines at the base. Three even
stones cut by hand (flat bases, chopped ends), never rounded. The ring mark is the favicon and
header mark; the scene without the ring is the app icon. Geometry and rationale:
`docs/superpowers/specs/2026-10-01-varde-brand-design.md`. Usage: `docs/brand/guidelines.md`.
```

and the body of `## Deliverables` with:

```markdown
Shipped 2026-10 (PR 1 of sub-project D): `favicon.svg` and `favicon.ico`, `apple-touch-icon`,
`icon-192/512` and `icon-maskable-192/512`, `og.png` with Open Graph tags, light and dark README
banners, and the GitHub social preview. All built by `npm run brand` from one geometry module.
```

- [ ] **Step 5: Check, commit, open PR 2**

Check: no em dashes in the changed files (`grep -n "—" README.md docs/brand/guidelines.md docs/brand/varde-brief.md` prints only lines that existed before). View the README on the pushed branch in GitHub (light and dark) and check the banner renders. Then:

```bash
git add README.md docs/brand
git commit -m "docs(brand): guidelines, README banner and brief update"
git push -u origin docs/brand
gh pr create --base main --title "docs(brand): guidelines, README banner and brief update" --body "The words for the brand that shipped in PR 1: usage guidelines, the light and dark README banner, and the brief rewritten to match."
```

---

### Task 12: Social preview upload (Malin)

GitHub has no API for it. Malin uploads `docs/brand/social-preview.png` under the repository's **Settings, General, Social preview, Edit, Upload an image**. Afterwards, check from outside:

```bash
curl -s https://github.com/malinfossum/varde | grep -oE '<meta property="og:image" content="[^"]+"'
```

Expected: a `repository-images.githubusercontent.com` URL instead of the default `opengraph.githubassets.com` one.

> Stress-tested 2026-10-01 (skill 0b01b4c), 3 applied, 1 adapted, 0 decided by me.
