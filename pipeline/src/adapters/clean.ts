import type { CheerioAPI } from "cheerio/slim"

// Never part of the main text: code, navigation, forms, and anything a visitor cannot see
// (a classic place for instructions aimed at a model).
const DROP =
	"script, style, noscript, template, svg, iframe, object, nav, form, button, select, [hidden], [aria-hidden='true']"
const HIDDEN_STYLE = /display\s*:\s*none|visibility\s*:\s*hidden/i
const BLOCK =
	"address, article, aside, blockquote, dd, div, dl, dt, figcaption, footer, h1, h2, h3, h4, h5, h6, header, li, main, ol, p, pre, section, table, tbody, td, th, thead, tr, ul"

// Where a link goes, as text: a web address in full, an email address bare. tel: links add
// nothing, since their text is the number.
function linkTarget(href: string, pageUrl: string): string | undefined {
	const raw = href.trim()
	if (/^mailto:/i.test(raw)) {
		const address = raw.slice(7).split("?")[0] ?? ""
		try {
			return decodeURIComponent(address) || undefined
		} catch {
			return undefined
		}
	}
	try {
		const url = new URL(raw, pageUrl)
		return url.protocol === "https:" || url.protocol === "http:" ? url.href : undefined
	} catch {
		return undefined
	}
}

// The visible text of the first element the selector finds, one line per block, with each
// link written as its text followed by its address (PR 1's contract, so a website or chat URL
// can be grounded in a quote). undefined when there is no such element or it holds no text.
export function mainText($: CheerioAPI, selector: string, pageUrl: string): string | undefined {
	const root = $(selector).first()
	if (root.length === 0) return undefined
	root.find(DROP).remove()
	root
		.find("[style]")
		.filter((_, el) => HIDDEN_STYLE.test($(el).attr("style") ?? ""))
		.remove()
	root.find("a[href]").each((_, el) => {
		const link = $(el)
		const text = link.text().replace(/\s+/g, " ").trim()
		const target = linkTarget(link.attr("href") ?? "", pageUrl)
		if (target !== undefined && !text.includes(target)) {
			link.text(text === "" ? target : `${text} ${target}`)
		}
	})
	root.find("br").replaceWith("\n")
	root.find(BLOCK).each((_, el) => {
		$(el).prepend("\n").append("\n")
	})
	const text = root
		.text()
		.split("\n")
		.map((line) => line.replace(/\s+/g, " ").trim())
		.filter((line) => line !== "")
		.join("\n")
	return text === "" ? undefined : text
}
