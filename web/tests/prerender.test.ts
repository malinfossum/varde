import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, expect, test, vi } from "vitest"
import { escapeJson, prerenderSite, urlList } from "../scripts/prerender.mjs"

const dirs: string[] = []
afterEach(() => {
	for (const d of dirs) rmSync(d, { recursive: true, force: true })
})

const template = `<!doctype html><html lang="nb"><head><meta charset="UTF-8" /><script src="/theme-init.js"></script><!--app-head--></head><body><div id="root"><!--app-html--></div><!--app-data--><script type="module" src="/assets/main.js"></script></body></html>`

function setup(resources: object[], kommuner: object[]) {
	const dir = mkdtempSync(join(tmpdir(), "varde-prerender-"))
	dirs.push(dir)
	const dataDir = join(dir, "data")
	const distDir = join(dir, "dist")
	mkdirSync(dataDir)
	mkdirSync(distDir)
	writeFileSync(join(dataDir, "resources.nb.json"), JSON.stringify(resources))
	writeFileSync(join(dataDir, "resources.en.json"), JSON.stringify(resources))
	writeFileSync(join(dataDir, "kommuner.json"), JSON.stringify(kommuner))
	writeFileSync(join(distDir, "index.html"), template)
	return { dataDir, distDir }
}

const row = {
	id: 5,
	name: "NAV Hamar",
	description: "x</script><b>y",
	municipalityId: 1,
	servedMunicipalityIds: [],
	isNational: false,
	phone: "12345678",
	website: null,
	email: null,
	address: null,
	municipalityName: "Hamar",
}
const hamar = { id: 1, slug: "hamar", name: "Hamar", county: "Innlandet" }

// R31: prerenderSite takes a required `split` option (the server bundle's splitForKommune)
// instead of computing the kommune local/national split itself — this stub mirrors its shape.
const stubSplit = (entry: object, resources: object[]) => ({
	entry,
	local: resources,
	national: [],
})

test("escapeJson cannot close a script block", () => {
	expect(escapeJson({ d: "</script>" })).toBe('{"d":"\\u003c/script>"}')
	expect(escapeJson({ d: "a\u2028b" })).toBe('{"d":"a\\u2028b"}')
})

test("urlList covers landing, search, every resource and kommune in both languages", () => {
	const urls = urlList([hamar], { nb: [row], en: [row] }).map((u) => u.url)
	expect(urls).toEqual([
		"/",
		"/sok",
		"/resources/5",
		"/kommune/hamar",
		"/en/",
		"/en/sok",
		"/en/resources/5",
		"/en/kommune/hamar",
	])
})

test("writes every page as folder/index.html with head, data block, lang, sitemap, robots and 404", async () => {
	const { dataDir, distDir } = setup([row], [hamar])
	const render = vi.fn(async (url: string, data: { resource?: { name: string } }) => ({
		html: `<main>${url} ${data.resource?.name ?? ""}</main>`,
		head: {
			title: `T ${url}`,
			description: "D",
			path: url.replace(/^\/en/, "") || "/",
			lang: url.startsWith("/en") ? "en" : "nb",
		},
	}))
	const result = await prerenderSite({
		dataDir,
		distDir,
		render,
		split: stubSplit,
		siteOrigin: "https://varde.pages.dev",
		log: () => {},
	})
	expect(result.pages).toHaveLength(8)
	const detail = readFileSync(join(distDir, "en/resources/5/index.html"), "utf8")
	expect(detail).toContain('<html lang="en">')
	expect(detail).toContain("<title>T /en/resources/5</title>")
	expect(detail).toContain('<link rel="canonical" href="https://varde.pages.dev/en/resources/5" />')
	expect(detail).toContain('hreflang="x-default" href="https://varde.pages.dev/resources/5"')
	expect(detail).toContain('<script type="application/json" id="varde-data">')
	expect(detail).not.toContain("</script><b>")
	expect(detail).toContain('<script type="application/ld+json">')
	expect(detail).toContain('"@type":"Organization"')
	expect(readFileSync(join(distDir, "index.html"), "utf8")).toContain("<main>/ </main>")
	const sitemap = readFileSync(join(distDir, "sitemap.xml"), "utf8")
	expect(sitemap).toContain("<loc>https://varde.pages.dev/kommune/hamar</loc>")
	expect(sitemap).toContain('hreflang="en" href="https://varde.pages.dev/en/kommune/hamar"')
	expect(readFileSync(join(distDir, "robots.txt"), "utf8")).toBe(
		"User-agent: *\nAllow: /\nDisallow: /sok?\nDisallow: /en/sok?\nDisallow: /data/\nSitemap: https://varde.pages.dev/sitemap.xml\n"
	)
	const notFound = readFileSync(join(distDir, "404.html"), "utf8")
	expect(notFound).toContain('<div id="root"></div>')
	expect(notFound).toContain("<noscript>")
	expect(notFound).toContain("Fant ikke siden / Page not found")
	expect(existsSync(join(distDir, "kommune/hamar/index.html"))).toBe(true)
})

// R30: react-dom/static's prerender() can "outline" a Suspense boundary as a completion
// <template> plus an inline <script>$RC(...)</script>, which index.html's CSP (script-src
// 'self') blocks. A page whose rendered HTML carries one of those markers must fail the build
// loudly instead of shipping a page stuck on its loading fallback.
test("rejects a page whose render() output carries an outlined Suspense boundary", async () => {
	const { dataDir, distDir } = setup([], [])
	const render = vi.fn(async (url: string) => ({
		html: url === "/sok" ? "<main><script>x</script></main>" : "<main>ok</main>",
		head: { title: "T", description: "D", path: url, lang: "nb" as const },
	}))
	await expect(
		prerenderSite({
			dataDir,
			distDir,
			render,
			split: stubSplit,
			siteOrigin: "https://varde.pages.dev",
			log: () => {},
		})
	).rejects.toThrow("/sok")
})

// Important (review round 1): String.replace's second argument treats `$&`, `` $` ``, `$'` and
// `$$` as substitution patterns when it's a plain string — `$&` re-inserts the whole matched
// marker, `` $` ``/`$'` splice in the template text before/after the match. A resource's
// free-text description can contain any of these, so fillTemplate must pass a function to every
// `.replace` instead of a string, which is used verbatim with no pattern parsing.
test("a $-replacement-pattern sequence in a resource's description renders unchanged, not duplicated", async () => {
	const weird = { ...row, id: 9, description: "$& $' $$" }
	const { dataDir, distDir } = setup([weird], [])
	const render = vi.fn(async (url: string, data: { resource?: { description: string } }) => ({
		html: `<main>${data.resource?.description ?? ""}</main>`,
		head: {
			title: `T ${url}`,
			description: "D",
			path: url.replace(/^\/en/, "") || "/",
			lang: url.startsWith("/en") ? "en" : "nb",
		},
	}))
	await prerenderSite({
		dataDir,
		distDir,
		render,
		split: stubSplit,
		siteOrigin: "https://varde.pages.dev",
		log: () => {},
	})
	const detail = readFileSync(join(distDir, "resources/9/index.html"), "utf8")
	expect(detail).toContain("<main>$& $' $$</main>")
	// The exact sequence appears three times, unchanged and undamaged: once in the rendered
	// <main>, once in the #varde-data JSON block (the resource object), once in the
	// application/ld+json block (jsonLd also copies the description). A naive string-replace
	// would instead duplicate the matched marker or splice in surrounding template bytes.
	const occurrences = detail.split("$& $' $$").length - 1
	expect(occurrences).toBe(3)
	expect(detail).not.toContain("<!--app-")
	expect(detail.match(/<!doctype html>/gi) ?? []).toHaveLength(1)
})
