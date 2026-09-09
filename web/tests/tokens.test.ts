import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, test } from "vitest"
import { contrastRatio, parseThemeTokens } from "../src/services/contrast.ts"

// jsdom replaces the global URL constructor, and on Windows that replacement mis-resolves a
// relative path against a file:// base (it silently falls back to http://localhost:3000/...
// instead of the real path), so I go through node:path/node:url instead of
// `new URL("../src/styles/tokens.css", import.meta.url)`. Types for the three functions used
// here live in ./node-builtins.d.ts — this project carries no @types/node.
const tokensPath = join(dirname(fileURLToPath(import.meta.url)), "../src/styles/tokens.css")
const css = readFileSync(tokensPath, "utf8")
const themes = parseThemeTokens(css)

// The spec's floors. Text on ground is the body copy; the rest are the accent, muted and
// emergency colours wherever they appear as text; border is the hairline that must still read.
const floors: [string, string, number][] = [
	["text", "ground", 7],
	["muted", "ground", 4.5],
	["accent", "ground", 4.5],
	["akutt", "ground", 4.5],
	["on-accent", "accent", 4.5],
	["border", "ground", 1.3],
]

describe.each(["light", "dark"] as const)("%s theme", (theme) => {
	test.each(floors)("%s on %s is at least %s:1", (fg, bg, floor) => {
		const tokens = themes[theme]
		expect(tokens[fg], `token --${fg} missing`).toBeDefined()
		expect(tokens[bg], `token --${bg} missing`).toBeDefined()
		expect(contrastRatio(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(floor)
	})
})

test("contrastRatio matches the WCAG reference pair", () => {
	expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 1)
	expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 1)
})
