import type { CheerioAPI } from "cheerio/slim"
import { stripInvisible } from "../text/invisible.ts"

// Never part of the main text: code, navigation, forms, and anything a visitor cannot see
// (a classic place for instructions aimed at a model).
const HIDDEN = "[hidden], [aria-hidden='true']"
const DROP = `script, style, noscript, template, svg, iframe, object, nav, form, button, select, ${HIDDEN}`
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

export type TextLine = { text: string; heading?: number }

const HEADINGS = "h1, h2, h3, h4, h5, h6"
// A heading's level rides on its line between two NUL characters. Pages cannot forge it: every
// NUL already in the page's text, with every other invisible character (text/invisible.ts), is
// removed first.
const MARK = "\u0000"
// biome-ignore lint/suspicious/noControlCharactersInRegex: the NUL is the heading mark itself, which no page text can carry.
const MARKED = /^\u0000([1-6])\u0000/
// biome-ignore lint/suspicious/noControlCharactersInRegex: the NUL is the heading mark itself, removed from every line.
const ANY_MARK = /\u0000[1-6]?\u0000?/g

// The visible text of the first element the selector finds, one line per block, each link as
// its text followed by its address (PR 1's contract), with each heading's level. undefined
// when there is no such element, when it or an ancestor is hidden, or when it holds no text.
export function textLines(
	$: CheerioAPI,
	selector: string,
	pageUrl: string
): TextLine[] | undefined {
	const root = $(selector).first()
	if (root.length === 0) return undefined
	const hidden = root
		.parents()
		.addBack()
		.filter((_, el) => {
			const node = $(el)
			return node.is(HIDDEN) || HIDDEN_STYLE.test(node.attr("style") ?? "")
		})
	if (hidden.length > 0) return undefined
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
	root
		.find("*")
		.addBack()
		.contents()
		.each((_, node) => {
			const text = node as { type?: unknown; data?: unknown }
			// Extraction, grounding and every value read this text, so all of them see it clean.
			if (text.type === "text" && typeof text.data === "string")
				text.data = stripInvisible(text.data)
		})
	root.find(HEADINGS).each((_, el) => {
		const node = $(el)
		// Collapsed first: a template that breaks the line inside <h2> would otherwise leave the
		// mark on an empty line of its own and the heading unmarked.
		node.text(`${MARK}${el.tagName.slice(1)}${MARK}${node.text().replace(/\s+/g, " ").trim()}`)
	})
	root.find("br").replaceWith("\n")
	root.find(BLOCK).each((_, el) => {
		$(el).prepend("\n").append("\n")
	})
	const lines: TextLine[] = []
	for (const raw of root.text().split("\n")) {
		const level = MARKED.exec(raw)?.[1]
		const text = raw.replace(ANY_MARK, "").replace(/\s+/g, " ").trim()
		if (text === "") continue
		lines.push(level === undefined ? { text } : { text, heading: Number(level) })
	}
	return lines.length === 0 ? undefined : lines
}

export function mainText($: CheerioAPI, selector: string, pageUrl: string): string | undefined {
	return textLines($, selector, pageUrl)
		?.map((l) => l.text)
		.join("\n")
}
