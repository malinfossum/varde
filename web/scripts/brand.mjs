// web/scripts/brand.mjs
// npm run brand: builds every brand file from scripts/brand-geometry.mjs and the colour tokens,
// renders the PNGs with resvg and writes docs/brand/src/hashes.json last, so a run that dies
// halfway leaves stale hashes and tests/brand.test.ts goes red. hashes.json also holds the hash
// of every PNG and the ICO, so a rendered file swapped or edited by hand goes red too. Run it
// after any change to the geometry or the tokens and commit the output. CI never runs it.
// `npm run brand -- --sheet` also writes a review contact sheet to .superpowers/brand-review/.
// Imports contrast.ts directly: Node 22.18+ strips the types.
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { Resvg } from "@resvg/resvg-js"
import { parseThemeTokens } from "../src/services/contrast.ts"
import {
	brandColors,
	FONT_FILES,
	ICO,
	masters,
	medallion,
	PNG_TARGETS,
	SRC,
} from "./brand-geometry.mjs"
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

// Every PNG and the ICO, by repo-relative path, so their hashes can go into hashes.json.
const rendered = {}
for (const [master, out, width] of PNG_TARGETS) {
	rendered[out] = render(files[`${SRC}/${master}`], width)
	writeFileSync(at(out), rendered[out])
	console.log(`rendered ${out}`)
}
rendered[ICO.out] = pngToIco(render(files[`${SRC}/${ICO.master}`], ICO.size), ICO.size)
writeFileSync(at(ICO.out), rendered[ICO.out])
console.log(`rendered ${ICO.out}`)

const sha256 = (data) => createHash("sha256").update(data).digest("hex")
// Masters keyed by name inside SRC, then the renders keyed by repo path in sorted order.
// tests/brand.test.ts checks the committed files against both.
const hashes = {}
for (const [rel, content] of Object.entries(files)) {
	if (rel.startsWith(`${SRC}/`)) hashes[rel.slice(SRC.length + 1)] = sha256(content)
}
for (const rel of Object.keys(rendered).sort()) hashes[rel] = sha256(rendered[rel])
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
	writeFileSync(
		join(dir, "ring-light-32.png"),
		render(files[`${SRC}/ring-light.svg`], 32, light.ground)
	)
	writeFileSync(
		join(dir, "ring-dark-32.png"),
		render(files[`${SRC}/ring-dark.svg`], 32, dark.ground)
	)
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
