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
// Every way to load a module counts: from, a bare side-effect import, import() and require().
const NETWORK =
	/(?:\bfrom|\bimport|\bimport\s*\(|\brequire\s*\()\s*["'](?:(?:node:)?(?:http|https|http2|net|tls|dgram|dns|dns\/promises)|undici|cheerio)["']|\bfetch\s*\(/
const REAL_TRANSPORT = /from\s+"[^"]*src\/(?:net\/http|cli\/)[^"]*"/

describe("network boundary", () => {
	it("only src/net/ opens network connections", () => {
		const offenders = tsFiles(join(ROOT, "src"))
			.filter((f) => !rel(f).startsWith("src/net/"))
			.filter((f) => NETWORK.test(read(f)))
			.map(rel)
		expect(offenders).toEqual([])
	})

	it("scans the PR 3 folders and files", () => {
		const scanned = tsFiles(join(ROOT, "src")).map(rel)
		for (const dir of ["src/extract/", "src/curate/", "src/verify/", "src/review/", "src/xlsx/"]) {
			expect(
				scanned.some((f) => f.startsWith(dir)),
				dir
			).toBe(true)
		}
		for (const file of [
			"src/registers/nklm.ts",
			"src/text/hours.ts",
			"src/text/phone.ts",
			"src/text/names.ts",
			"src/text/invisible.ts",
			"src/cli/extract.ts",
			"src/cli/verify.ts",
			"src/cli/review.ts",
		]) {
			expect(scanned).toContain(file)
		}
	})

	it("no test imports the real transport, a CLI or a network module", () => {
		const offenders = tsFiles(join(ROOT, "test"))
			.filter((f) => REAL_TRANSPORT.test(read(f)) || NETWORK.test(read(f)))
			.map(rel)
		expect(offenders).toEqual([])
	})

	it("catches every way to load a network module, and lets cheerio/slim through", () => {
		// Each form is split in two, so this file does not trip its own pattern.
		const forms = [
			['import { request } from "node:', 'https"'],
			["import 'node:", "tls'"],
			['const http = await import("node:', 'http")'],
			["const net = require('node:", "net')"],
			['const u = require("', 'undici")'],
			['import { load } from "', 'cheerio"'],
			["await fe", 'tch("https://www.nav.no/")'],
		]
		for (const [head, tail] of forms) expect(NETWORK.test(`${head}${tail}`), head).toBe(true)
		expect(NETWORK.test('import { load } from "cheerio/slim"')).toBe(false)
		expect(NETWORK.test('import { httpsHost } from "../text/normalise.ts"')).toBe(false)
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
