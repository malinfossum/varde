import { load } from "cheerio/slim"
import { type TextLine, textLines } from "../adapters/clean.ts"
import { readPageWith } from "../adapters/read.ts"
import type { AdapterName } from "../adapters/types.ts"
import { boxSelector, CMS_BOXES, type CmsBox } from "./cmsBoxes.ts"

export type PageBox = { kind: "contact" | "hours"; lines: TextLine[]; inMain: boolean }
export type UnitPage = {
	adapter: AdapterName
	fallback: boolean
	main: TextLine[]
	boxes: PageBox[]
	// What the grounding gate reads: the main text, then every box outside the main element.
	text: string
}

// Shared by extract and verify, so every quote a rule takes is in the text the grounding gate
// sees. Each box is read from a fresh parse: textLines changes the tree it reads.
export function readUnitPage(
	html: string,
	url: string,
	boxes: readonly CmsBox[] = CMS_BOXES
): UnitPage {
	const { result, selector, lines } = readPageWith(html, url)
	const found: PageBox[] = []
	if (!result.fallback) {
		for (const box of boxes.filter((b) => b.adapter === result.adapter)) {
			const $ = load(html)
			const sel = boxSelector(box)
			const el = $(sel).first()
			if (el.length === 0) continue
			const inMain = el.closest(selector).length > 0
			const boxLines = textLines($, sel, url)
			if (boxLines !== undefined) found.push({ kind: box.kind, lines: boxLines, inMain })
		}
	}
	const outside = found.filter((b) => !b.inMain).flatMap((b) => b.lines)
	return {
		adapter: result.adapter,
		fallback: result.fallback,
		main: lines,
		boxes: found,
		text: [...lines, ...outside].map((l) => l.text).join("\n"),
	}
}

export function allLines(page: UnitPage): string[] {
	return [...page.main, ...page.boxes.filter((b) => !b.inMain).flatMap((b) => b.lines)].map(
		(l) => l.text
	)
}
