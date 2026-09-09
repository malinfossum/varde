import { createHash } from "node:crypto"
import { existsSync, readFileSync, statSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "vitest"
import { FONT_FILES } from "../scripts/sync-fonts.mjs"

// jsdom replaces the global URL constructor, and on Windows that replacement mis-resolves a
// relative path against a file:// base, so I go through node:path/node:url instead of
// `new URL("../public/fonts/...", import.meta.url)` (same fix as tokens.test.ts/theme.test.ts).
const testDir = dirname(fileURLToPath(import.meta.url))
const sha = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex")

test.each(FONT_FILES)("public/fonts/%s is byte-identical to its package file", (file, pkg) => {
	const vendored = join(testDir, "../public/fonts", file)
	const source = join(testDir, "../node_modules", pkg, "files", file)
	expect(existsSync(vendored), `run: npm run fonts`).toBe(true)
	expect(sha(vendored)).toBe(sha(source))
})

test("the three files stay under the 80 KB font budget together", () => {
	const total = FONT_FILES.reduce(
		(sum, [file]) => sum + statSync(join(testDir, "../public/fonts", file)).size,
		0
	)
	expect(total).toBeLessThanOrEqual(80 * 1024)
})
