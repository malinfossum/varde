import { type CheerioAPI, load } from "cheerio/slim"
import { siteHost } from "../text/normalise.ts"
import { type TextLine, textLines } from "./clean.ts"
import { SITE_RULES } from "./siteRules.ts"
import type { AdapterName, AdapterResult } from "./types.ts"

type Cms = {
	name: Exclude<AdapterName, "siteRule" | "fallback">
	detect: (html: string, $: CheerioAPI) => boolean
	selectors: readonly string[]
}

// Order matters: CorePublish pages carry ACOS tags too, so CorePublish is tried first.
const CMS: readonly Cms[] = [
	{
		name: "corepublish",
		detect: (html) => /corepublish/i.test(html),
		selectors: ["main#main-content"],
	},
	{ name: "sitevision", detect: (html) => /sitevision/i.test(html), selectors: ["main.svp-main"] },
	{
		name: "acos",
		detect: (html, $) =>
			$('meta[name="acos-cmscontext"]').length > 0 || html.includes("acos-shared-components"),
		selectors: ["article.artikkel", "main.main"],
	},
]

export type PageRead = { result: AdapterResult; selector: string; lines: TextLine[] }

const read = (
	adapter: AdapterName,
	selector: string,
	lines: TextLine[],
	fallback: boolean
): PageRead => ({
	result: { adapter, text: lines.map((l) => l.text).join("\n"), origin: "unitPage", fallback },
	selector,
	lines,
})

// Everything else falls back to <main>, marked, so PR 3 can tell its values apart.
const fallback = ($: CheerioAPI, url: string): PageRead =>
	read("fallback", "main", textLines($, "main", url) ?? [], true)

// The page's main text, by the site rule for its host, else the first CMS adapter that knows
// the page. A rule or adapter whose element is missing (a redesign) falls back, marked. The
// selector and the lines go to PR 3's page reader.
export function readPageWith(html: string, url: string): PageRead {
	const $ = load(html)
	const host = siteHost(url)
	const rule = SITE_RULES.find((r) => siteHost(`https://${r.host}/`) === host)
	if (rule !== undefined) {
		const lines = textLines($, rule.selector, url)
		return lines === undefined ? fallback($, url) : read("siteRule", rule.selector, lines, false)
	}
	const cms = CMS.find((c) => c.detect(html, $))
	for (const selector of cms?.selectors ?? []) {
		const lines = textLines($, selector, url)
		if (lines !== undefined && cms !== undefined) return read(cms.name, selector, lines, false)
	}
	return fallback($, url)
}

export function readPage(html: string, url: string): AdapterResult {
	return readPageWith(html, url).result
}
