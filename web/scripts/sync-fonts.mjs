// web/scripts/sync-fonts.mjs
// Copies the static Latin woff2 files out of the @fontsource packages into public/fonts so
// the preload URL in index.html is stable. tests/fonts.test.ts fails when these drift.
import { copyFileSync, mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"

export const FONT_FILES = [
	["fraunces-latin-600-normal.woff2", "@fontsource/fraunces"],
	["figtree-latin-400-normal.woff2", "@fontsource/figtree"],
	["figtree-latin-600-normal.woff2", "@fontsource/figtree"],
]

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const out = new URL("../public/fonts/", import.meta.url)
	mkdirSync(out, { recursive: true })
	for (const [file, pkg] of FONT_FILES) {
		copyFileSync(new URL(`../node_modules/${pkg}/files/${file}`, import.meta.url), new URL(file, out))
		console.log(`copied ${file}`)
	}
}
