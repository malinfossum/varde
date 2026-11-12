import type { TextLine } from "../adapters/clean.ts"
import type { ContactBlock } from "../schema/extraction.ts"
import { normaliseText } from "../text/normalise.ts"
import type { UnitPage } from "./page.ts"

const KONTAKT: ReadonlySet<string> = new Set(["kontakt", "kontakt oss", "kontaktinformasjon"])
const APNINGSTIDER: ReadonlySet<string> = new Set(["åpningstider", "åpningstid"])

// A heading's words, without trailing punctuation: "Kontakt oss:" is "kontakt oss".
export function headingIs(text: string, words: ReadonlySet<string>): boolean {
	return words.has(normaliseText(text).replace(/[\s:.!]+$/, ""))
}

// The lines under each heading the test picks, until the next heading of the same level or
// higher. A deeper heading ("Telefon" under "Kontakt") stays in the block as a line. The block is
// named by the nearest heading above it of a higher level (the service it belongs to), so "Om
// tjenesten" beside "Kontakt" never names it.
function under(lines: readonly TextLine[], words: ReadonlySet<string>): ContactBlock[] {
	const blocks: ContactBlock[] = []
	// The last heading seen at each level, deeper ones forgotten when a higher one comes.
	const above: (string | undefined)[] = []
	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		if (line?.heading === undefined) continue
		const level = line.heading
		if (!headingIs(line.text, words)) {
			above.length = level
			above[level] = line.text
			continue
		}
		let naming: string | undefined
		for (let l = level - 1; l >= 1 && naming === undefined; l--) naming = above[l]
		const body: string[] = []
		for (let j = i + 1; j < lines.length; j++) {
			const next = lines[j]
			if (next === undefined || (next.heading !== undefined && next.heading <= level)) break
			body.push(next.text)
		}
		if (body.length > 0) {
			blocks.push(
				naming === undefined
					? { source: "heading", lines: body }
					: { source: "heading", heading: naming, lines: body }
			)
		}
	}
	return blocks
}

// The unit's contact block: the CMS contact box first (where the adapter knows one), then the
// lines under a Kontakt, Kontakt oss or Kontaktinformasjon heading in the main text.
export function contactBlocks(page: UnitPage): ContactBlock[] {
	const boxes = page.boxes
		.filter((b) => b.kind === "contact")
		.map((b): ContactBlock => {
			const named = b.lines.find((l) => l.heading !== undefined && !headingIs(l.text, KONTAKT))
			const lines = b.lines.map((l) => l.text)
			return named === undefined
				? { source: "cms", lines }
				: { source: "cms", heading: named.text, lines }
		})
	return [...boxes, ...under(page.main, KONTAKT)]
}

// Opening hours: the CMS hours box, else the lines under an Åpningstider heading until the next
// heading. Nav's office JSON comes before both; the hours rule handles that.
export function hoursLines(
	page: UnitPage
): { source: "cms" | "heading"; lines: string[] } | undefined {
	const box = page.boxes.find((b) => b.kind === "hours")
	if (box !== undefined) {
		const lines = box.lines.filter((l) => l.heading === undefined).map((l) => l.text)
		if (lines.length > 0) return { source: "cms", lines }
	}
	const [first] = under(page.main, APNINGSTIDER)
	return first === undefined ? undefined : { source: "heading", lines: first.lines }
}
