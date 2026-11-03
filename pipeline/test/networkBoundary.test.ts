import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { USER_AGENT } from "../src/net/types.ts"

const ROOT = fileURLToPath(new URL("..", import.meta.url))

function tsFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name)
		if (entry.isDirectory()) return tsFiles(path)
		return entry.name.endsWith(".ts") ? [path] : []
	})
}

const rel = (path: string) => relative(ROOT, path).split("\\").join("/")
const read = (path: string) => readFileSync(path, "utf8")

// The full cheerio build loads undici's URL loader, so only cheerio/slim may be imported.
const NETWORK =
	/from\s+"(?:node:)?(?:http|https|http2|net|tls|dgram|dns|dns\/promises)"|from\s+"(?:undici|cheerio)"|\bfetch\s*\(/
const REAL_TRANSPORT = /from\s+"[^"]*src\/(?:net\/http|cli\/)[^"]*"/

describe("network boundary", () => {
	it("only src/net/ opens network connections", () => {
		const offenders = tsFiles(join(ROOT, "src"))
			.filter((f) => !rel(f).startsWith("src/net/"))
			.filter((f) => NETWORK.test(read(f)))
			.map(rel)
		expect(offenders).toEqual([])
	})

	it("no test imports the real transport, a CLI or a network module", () => {
		const offenders = tsFiles(join(ROOT, "test"))
			.filter((f) => REAL_TRANSPORT.test(read(f)) || NETWORK.test(read(f)))
			.map(rel)
		expect(offenders).toEqual([])
	})

	it("the real transport sends VardeBot's user agent", () => {
		expect(USER_AGENT).toBe("VardeBot/1.0 (+https://varde.pages.dev/om)")
		expect(read(join(ROOT, "src/net/http.ts"))).toContain('"user-agent": USER_AGENT')
	})

	it("a stray fetch in a test fails instead of reaching a host", async () => {
		// Held in a variable first, so this file does not trip its own pattern above.
		const stray = globalThis.fetch
		await expect(stray("https://www.nav.no/")).rejects.toThrow("tests never touch the network")
	})
})
