import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, expect, test, vi } from "vitest"
import {
	BATCH,
	changedUrls,
	ENDPOINT,
	findKey,
	main,
	ping,
	readManifest,
} from "../scripts/indexnow.mjs"

const here = dirname(fileURLToPath(import.meta.url))
const publicDir = join(here, "..", "public")
const origin = "https://varde.pages.dev"
const dirs: string[] = []
afterEach(() => {
	for (const d of dirs) rmSync(d, { recursive: true, force: true })
})
const tmp = () => {
	const d = mkdtempSync(join(tmpdir(), "varde-indexnow-"))
	dirs.push(d)
	return d
}
const noWait = async () => {}

test("public/ holds exactly one key file, and it contains its own name", () => {
	const key = findKey(publicDir)
	expect(key).toMatch(/^[a-f0-9]{32}$/)
	expect(readFileSync(join(publicDir, `${key}.txt`), "utf8")).toBe(key)
	expect(readdirSync(publicDir).filter((f) => /^[a-f0-9]{32}\.txt$/.test(f))).toHaveLength(1)
})

test("changedUrls returns new, changed and removed pages as sorted absolute URLs", () => {
	const live = { "/": "a", "/om": "b", "/resources/9": "c" }
	const next = { "/": "a", "/om": "B", "/kommune": "d" }
	expect(changedUrls(live, next, origin)).toEqual([
		"https://varde.pages.dev/kommune",
		"https://varde.pages.dev/om",
		"https://varde.pages.dev/resources/9",
	])
})

test("an empty live manifest means every page is new", () => {
	expect(changedUrls({}, { "/": "a", "/en/": "b" }, origin)).toEqual([
		"https://varde.pages.dev/",
		"https://varde.pages.dev/en/",
	])
})

test("keys that are not site paths never reach the ping", () => {
	const next = {
		"https://evil.example/x": "1",
		"//evil.example/x": "2",
		"/\\evil.example/x": "3",
		om: "4",
		constructor: "5",
		"/ok": "6",
	}
	expect(changedUrls({ "//gone.example": "y", toString: "z" }, next, origin)).toEqual([
		"https://varde.pages.dev/ok",
	])
})

test("readManifest turns anything unreadable into an empty object", () => {
	const d = tmp()
	const file = (name: string, text: string) => {
		writeFileSync(join(d, name), text)
		return join(d, name)
	}
	expect(readManifest(join(d, "missing.json"))).toEqual({})
	expect(readManifest(file("empty.json", ""))).toEqual({})
	expect(readManifest(file("array.json", "[1,2]"))).toEqual({})
	expect(readManifest(file("null.json", "null"))).toEqual({})
	expect(readManifest(file("ok.json", '{"/":"a"}'))).toEqual({ "/": "a" })
})

test("ping sends nothing when nothing changed", async () => {
	const fetchImpl = vi.fn()
	const log = vi.fn()
	await ping({ urls: [], origin, key: "k".repeat(32), fetchImpl, log, wait: noWait })
	expect(fetchImpl).not.toHaveBeenCalled()
	expect(log).toHaveBeenCalledWith("IndexNow: 0 changed URLs, nothing sent")
})

test("ping posts host, key and the URLs, and logs status and count only", async () => {
	const fetchImpl = vi.fn(async () => new Response(null, { status: 202 }))
	const log = vi.fn()
	const urls = ["https://varde.pages.dev/kommune"]
	await ping({ urls, origin, key: "abc12345", fetchImpl, log, wait: noWait })
	expect(fetchImpl).toHaveBeenCalledTimes(1)
	const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
	expect(url).toBe(ENDPOINT)
	expect(init.method).toBe("POST")
	expect(JSON.parse(String(init.body))).toEqual({
		host: "varde.pages.dev",
		key: "abc12345",
		urlList: urls,
	})
	expect(log.mock.calls.map((c) => c[0])).toEqual(["IndexNow: 1 URLs, status 202"])
})

test("ping splits more than 10,000 URLs into batches", async () => {
	const fetchImpl = vi.fn(async () => new Response(null, { status: 200 }))
	const urls = Array.from({ length: BATCH + 1 }, (_, i) => `https://varde.pages.dev/resources/${i}`)
	await ping({ urls, origin, key: "abc12345", fetchImpl, log: () => {}, wait: noWait })
	expect(fetchImpl).toHaveBeenCalledTimes(2)
})

test("a 5xx or a network error is retried once; a 4xx is not, and both warn", async () => {
	const wait = vi.fn(noWait)
	const flaky = vi
		.fn()
		.mockResolvedValueOnce(new Response(null, { status: 503 }))
		.mockResolvedValueOnce(new Response(null, { status: 200 }))
	const log = vi.fn()
	await ping({
		urls: ["https://varde.pages.dev/"],
		origin,
		key: "abc12345",
		fetchImpl: flaky,
		log,
		wait,
	})
	expect(flaky).toHaveBeenCalledTimes(2)
	expect(wait).toHaveBeenCalledWith(10_000)
	expect(log.mock.calls.some((c) => String(c[0]).startsWith("::warning::"))).toBe(false)

	const refused = vi.fn(async () => new Response(null, { status: 403 }))
	const log2 = vi.fn()
	await ping({
		urls: ["https://varde.pages.dev/"],
		origin,
		key: "abc12345",
		fetchImpl: refused,
		log: log2,
		wait,
	})
	expect(refused).toHaveBeenCalledTimes(1)
	expect(
		log2.mock.calls.some((c) => String(c[0]).startsWith("::warning::IndexNow ping got 403"))
	).toBe(true)

	const down = vi.fn(async () => {
		throw new TypeError("fetch failed")
	})
	const log3 = vi.fn()
	await ping({
		urls: ["https://varde.pages.dev/"],
		origin,
		key: "abc12345",
		fetchImpl: down,
		log: log3,
		wait,
	})
	expect(down).toHaveBeenCalledTimes(2)
	expect(log3.mock.calls.some((c) => String(c[0]).includes("network error"))).toBe(true)
})

test("main never throws and reports a warning when it cannot run", async () => {
	const d = tmp()
	const next = join(d, "next.json")
	writeFileSync(next, '{"/":"a"}')
	const log = vi.fn()
	const fetchImpl = vi.fn(async () => new Response(null, { status: 200 }))
	// No SITE_ORIGIN: skipped with a warning, nothing sent.
	await expect(
		main({ argv: [join(d, "live.json"), next], env: {}, fetchImpl, log, wait: noWait, publicDir })
	).resolves.toBeUndefined()
	expect(fetchImpl).not.toHaveBeenCalled()
	expect(log.mock.calls.some((c) => String(c[0]).startsWith("::warning::IndexNow skipped"))).toBe(
		true
	)
	// A public dir with no key file: a warning, nothing sent, no throw.
	const log2 = vi.fn()
	await main({
		argv: [join(d, "live.json"), next],
		env: { SITE_ORIGIN: origin },
		fetchImpl,
		log: log2,
		wait: noWait,
		publicDir: d,
	})
	expect(fetchImpl).not.toHaveBeenCalled()
	expect(log2.mock.calls.some((c) => String(c[0]).startsWith("::warning::IndexNow failed"))).toBe(
		true
	)
	// The first run: no live manifest, so every page is sent.
	const log3 = vi.fn()
	await main({
		argv: [join(d, "live.json"), next],
		env: { SITE_ORIGIN: `${origin}/` },
		fetchImpl,
		log: log3,
		wait: noWait,
		publicDir,
	})
	expect(fetchImpl).toHaveBeenCalledTimes(1)
	const body = JSON.parse(
		String((fetchImpl.mock.calls[0] as unknown as [string, RequestInit])[1].body)
	)
	expect(body.urlList).toEqual(["https://varde.pages.dev/"])
})
