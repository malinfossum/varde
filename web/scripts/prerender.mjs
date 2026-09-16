// Turns the built app into one HTML file per URL. Runs after `vite build` (client) and
// `vite build --ssr` (server); reads public/data/ written by export-data.mjs. No shebang here
// (unlike export-data.mjs): this file's CLI block does a non-literal `import()`, and Vite's
// vitest transform mis-parses a leading `#!` on any file whose dynamic import it can't
// statically resolve — confirmed by bisection. It only ever runs as `node scripts/prerender.mjs`
// (see package.json's `prerender` script), never `./prerender.mjs`, so the shebang added nothing.
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const LANGS = ["nb", "en"]
const prefix = (lang) => (lang === "en" ? "/en" : "")

// JSON that can sit inside <script>: '<' can never start '</script>', and the two line
// separators JSON allows but JavaScript source does not are escaped as well.
export function escapeJson(value) {
	return JSON.stringify(value)
		.replace(/</g, "\\u003c")
		.replace(/\u2028/g, "\\u2028")
		.replace(/\u2029/g, "\\u2029")
}

export function jsonLd(resource, lang, siteOrigin) {
	const out = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: resource.name,
		description: resource.description,
		url: resource.website ?? `${siteOrigin}${prefix(lang)}/resources/${resource.id}`,
		areaServed: resource.municipalityName ?? "Norge",
	}
	if (resource.phone) out.telephone = resource.phone
	if (resource.email) out.email = resource.email
	if (resource.address) out.address = { "@type": "PostalAddress", streetAddress: resource.address }
	return out
}

// R31 (applies R8, "no MJS copy of the kommune split"): the kommune local/national split lives
// only in src/components/KommunePage.tsx (splitForKommune), re-exported by entry-server.tsx.
// urlList stays pure and hands back the raw kommune entry; prerenderSite calls the caller's
// `split` (the server bundle's splitForKommune) to build the actual page data.
export function urlList(kommuner, resourcesByLang) {
	const out = []
	for (const lang of LANGS) {
		const p = prefix(lang)
		out.push({ url: `${p}/`, data: {}, lang })
		out.push({ url: `${p}/sok`, data: {}, lang })
		for (const r of resourcesByLang[lang])
			out.push({ url: `${p}/resources/${r.id}`, data: { resource: r }, lang })
		for (const k of kommuner)
			out.push({ url: `${p}/kommune/${k.slug}`, data: {}, lang, kommune: k })
	}
	return out
}

function headTags(head, siteOrigin) {
	if (!head) return ""
	const abs = (lang, path) => `${siteOrigin}${prefix(lang)}${path}`
	return [
		`<title>${escapeHtml(head.title)}</title>`,
		`<meta name="description" content="${escapeHtml(head.description)}" />`,
		`<link rel="canonical" href="${abs(head.lang, head.path)}" />`,
		`<link rel="alternate" hreflang="nb" href="${abs("nb", head.path)}" />`,
		`<link rel="alternate" hreflang="en" href="${abs("en", head.path)}" />`,
		`<link rel="alternate" hreflang="x-default" href="${abs("nb", head.path)}" />`,
	].join("\n\t\t")
}

function escapeHtml(text) {
	return String(text)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
}

function fillTemplate(template, { lang, head, html, data, ld }) {
	const blocks = []
	if (data && Object.keys(data).length)
		blocks.push(`<script type="application/json" id="varde-data">${escapeJson(data)}</script>`)
	if (ld) blocks.push(`<script type="application/ld+json">${escapeJson(ld)}</script>`)
	const dataBlock = blocks.join("\n\t\t")
	// Every value below can carry free-text database fields (names, descriptions) that a real
	// resource can put anything into, including `$&`, `` $` ``, `$'` or `$$`. String.replace's
	// SECOND argument treats those as substitution patterns when it's a string — `$&` re-inserts
	// the whole matched marker, `` $` `` and `$'` splice in everything before/after the match —
	// so a resource description containing one could silently duplicate or corrupt the page.
	// Passing a function instead means the replacement is used verbatim, no pattern parsing.
	return template
		.replace('<html lang="nb">', () => `<html lang="${lang}">`)
		.replace("<!--app-head-->", () => head)
		.replace("<!--app-html-->", () => html)
		.replace("<!--app-data-->", () => dataBlock)
}

function sitemap(pages, siteOrigin) {
	const byPath = new Map()
	for (const page of pages) {
		const path = page.url.replace(/^\/en(?=\/)/, "") || "/"
		byPath.set(path, true)
	}
	const entries = [...byPath.keys()].flatMap((path) =>
		LANGS.map((lang) => {
			const alternates = LANGS.map(
				(l) =>
					`<xhtml:link rel="alternate" hreflang="${l}" href="${siteOrigin}${prefix(l)}${path}" />`
			).join("")
			return `<url><loc>${siteOrigin}${prefix(lang)}${path}</loc>${alternates}</url>`
		})
	)
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join("\n")}\n</urlset>\n`
}

// R30: react-dom/static's prerender() can "outline" a Suspense boundary that DOES resolve —
// written out-of-band as a completion <template> plus an inline <script>$RC(...)</script> that
// moves it into place. index.html's CSP is script-src 'self' with no inline scripts, so an
// outlined boundary would sit inert until React hydrates client-side: exactly the SEO/first-
// paint regression prerendering exists to avoid. Fail the whole build rather than ship it.
function assertNoOutlinedBoundary(html, url) {
	for (const marker of ["<script", "<template", "<!--$?-->"]) {
		if (html.includes(marker)) {
			throw new Error(
				`prerendered page ${url} contains ${marker} — an outlined Suspense boundary the CSP would block`
			)
		}
	}
}

export async function prerenderSite({
	dataDir,
	distDir,
	render,
	split,
	siteOrigin,
	log = console.log,
}) {
	const read = (name) => JSON.parse(readFileSync(join(dataDir, name), "utf8"))
	const kommuner = read("kommuner.json")
	const resourcesByLang = { nb: read("resources.nb.json"), en: read("resources.en.json") }
	const template = readFileSync(join(distDir, "index.html"), "utf8")
	for (const marker of ["<!--app-head-->", "<!--app-html-->", "<!--app-data-->"]) {
		if (!template.includes(marker)) throw new Error(`index.html lacks ${marker}`)
	}
	const pages = urlList(kommuner, resourcesByLang)
	for (const page of pages) {
		const data = page.kommune
			? { kommune: split(page.kommune, resourcesByLang[page.lang]) }
			: page.data
		const { html, head } = await render(page.url, data)
		assertNoOutlinedBoundary(html, page.url)
		const ld = data.resource ? jsonLd(data.resource, page.lang, siteOrigin) : null
		const file = fillTemplate(template, {
			lang: page.lang,
			head: headTags(head, siteOrigin),
			html,
			data,
			ld,
		})
		// File form, not folder form: Cloudflare Pages' asset server 308s a folder-form request
		// (`/resources/12` -> `/resources/12/`) when only `resources/12/index.html` exists, and
		// the strict router parses the slashed URL as notFound — every deep link 404s. File form
		// (`resources/12.html`) serves `/resources/12` directly and 308s the slashed form back to
		// it, which the router accepts. `/` and `/en/` keep index.html since they ARE folder
		// roots already.
		const target = page.url.endsWith("/")
			? join(distDir, page.url, "index.html")
			: `${join(distDir, page.url)}.html`
		mkdirSync(dirname(target), { recursive: true })
		writeFileSync(target, file)
	}
	const notFound = fillTemplate(template, {
		lang: "nb",
		head: "<title>Fant ikke siden – Varde</title>",
		html: "",
		data: {},
		ld: null,
	}).replace(
		'<div id="root"></div>',
		() => '<noscript><p>Fant ikke siden / Page not found</p></noscript>\n\t\t<div id="root"></div>'
	)
	writeFileSync(join(distDir, "404.html"), notFound)
	writeFileSync(join(distDir, "sitemap.xml"), sitemap(pages, siteOrigin))
	writeFileSync(
		join(distDir, "robots.txt"),
		`User-agent: *\nAllow: /\nDisallow: /sok?\nDisallow: /en/sok?\nDisallow: /data/\nSitemap: ${siteOrigin}/sitemap.xml\n`
	)
	log(`prerendered ${pages.length} pages`)
	return { pages: pages.map((p) => p.url) }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	const here = dirname(fileURLToPath(import.meta.url))
	const webDir = join(here, "..")
	const siteOrigin = process.env.VITE_SITE_ORIGIN ?? "http://localhost:5173"
	const server = await import(pathToFileURL(join(webDir, "dist-server", "entry-server.mjs")).href)
	await prerenderSite({
		dataDir: join(webDir, "public", "data"),
		distDir: join(webDir, "dist"),
		render: server.render,
		split: server.splitForKommune,
		siteOrigin,
	})
	rmSync(join(webDir, "dist-server"), { recursive: true, force: true })
}
