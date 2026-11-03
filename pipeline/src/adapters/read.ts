import { type CheerioAPI, load } from "cheerio/slim"
import { siteHost } from "../text/normalise.ts"
import { mainText } from "./clean.ts"
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

const found = (adapter: AdapterName, text: string): AdapterResult => ({
	adapter,
	text,
	origin: "unitPage",
	fallback: false,
})

// Everything else falls back to <main>, marked, so PR 3 sends its values to review.
const fallback = ($: CheerioAPI, url: string): AdapterResult => ({
	adapter: "fallback",
	text: mainText($, "main", url) ?? "",
	origin: "unitPage",
	fallback: true,
})

// The page's main text, by the site rule for its host, else the first CMS adapter that knows
// the page. A rule or adapter whose element is missing (a redesign) falls back, marked.
export function readPage(html: string, url: string): AdapterResult {
	const $ = load(html)
	const host = siteHost(url)
	const rule = SITE_RULES.find((r) => siteHost(`https://${r.host}/`) === host)
	if (rule !== undefined) {
		const text = mainText($, rule.selector, url)
		return text === undefined ? fallback($, url) : found("siteRule", text)
	}
	const cms = CMS.find((c) => c.detect(html, $))
	for (const selector of cms?.selectors ?? []) {
		const text = mainText($, selector, url)
		if (text !== undefined && cms !== undefined) return found(cms.name, text)
	}
	return fallback($, url)
}
