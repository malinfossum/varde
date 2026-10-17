import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, test } from "vitest"

const here = dirname(fileURLToPath(import.meta.url))
const css = readFileSync(join(here, "../src/styles/main.css"), "utf8")

function body(pattern: RegExp): string {
	const found = css.match(pattern)
	if (!found) throw new Error(`main.css lacks ${pattern}`)
	return (found[1] ?? "").replace(/\s+/g, " ").trim()
}

// Installed mode has two triggers (spec: Layout, Installed mode). Each sets the same three
// switches; this keeps them from drifting apart.
test("both installed-mode triggers set the same switches", () => {
	const media = body(/@media screen and \(display-mode: standalone\) \{\s*:root \{([^}]*)\}/)
	const attribute = body(/@media screen \{\s*:root\[data-standalone\] \{([^}]*)\}/)
	expect(media).toBe(attribute)
	for (const name of ["--history-bar: grid", "--history-icons: flex", "--history-space:"]) {
		expect(media).toContain(name)
	}
})

// viewport-fit=cover lets the page run under a notch in landscape; the content stays inside.
test("the page keeps its content inside the safe area", () => {
	expect(css).toContain("padding-inline: env(safe-area-inset-left) env(safe-area-inset-right);")
})
