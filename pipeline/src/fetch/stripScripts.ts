import { load } from "cheerio/slim"

// Script types a browser treats as data and never runs. Nav office pages carry their office data
// in <script id="__NEXT_DATA__" type="application/json">, which extract reads from the cache.
const DATA_TYPES = /^application\/(ld\+)?json$/i
const INERT = "text/x-varde-stripped"
// Browsers ignore whitespace and control characters inside a URL scheme ("java\tscript:").
const RUNS_CODE = /^(javascript|vbscript|data:text\/html)/i

function runsCode(value: string): boolean {
	// biome-ignore lint/suspicious/noControlCharactersInRegex: browsers drop these from a scheme
	return RUNS_CODE.test(value.replace(/[\s\u0000-\u001f]/g, ""))
}

// A page as the cache keeps it: nothing a browser could run or be sent away by. Extraction drops
// scripts anyway (adapters/clean.ts), so nothing it reads is lost. A hijacked site's malware then
// never lands on disk, where it sets off the virus scanner and runs if the file is opened in a
// browser. Pages fetched before this kept their scripts until the cache ages them out.
export function stripScripts(html: string): string {
	const $ = load(html)
	// The tag stays with its code removed and a type no browser runs or loads a src for: the CMS
	// adapters know a site by words in its script addresses ("acos-shared-components").
	$("script").each((_, el) => {
		if (!DATA_TYPES.test(($(el).attr("type") ?? "").trim())) $(el).empty().attr("type", INERT)
	})
	$("meta[http-equiv]").each((_, el) => {
		if (($(el).attr("http-equiv") ?? "").trim().toLowerCase() === "refresh") $(el).remove()
	})
	$("*").each((_, el) => {
		if (!("attribs" in el)) return
		for (const [name, value] of Object.entries(el.attribs)) {
			if (/^on/i.test(name) || runsCode(value)) $(el).removeAttr(name)
		}
	})
	return $.html()
}
