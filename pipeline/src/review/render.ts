import { evidenceQuotes } from "../schema/lock.ts"
import { canAccept, type ReviewItem } from "./queue.ts"
import { sanitiseCounted } from "./sanitise.ts"

export const FIELD_KEYS = "Keys: a accept, r reject, e edit, s skip, q quit, then Enter"
// A mobile with no role: an accept cannot settle it, so the key is not offered.
export const FIELD_KEYS_NO_ACCEPT =
	"Keys: e edit (with a role), r reject, s skip, q quit, then Enter"
export const INCLUDE_KEYS = "Keys: y include, n leave out, s skip, q quit, then Enter"

const RULE = `+${"-".repeat(72)}`
const QUOTE_RULE = `  +${"-".repeat(70)}`

const hostOf = (url: string) => {
	try {
		return new URL(url).hostname
	} catch {
		return "(not a URL)"
	}
}

// One item as plain text. Meaning never rests on colour: the frame is ASCII, every item lists its
// keys in words, and colour (labels in bold) is off without a terminal or with NO_COLOR. Every
// piece of page text is sanitised, a link's host is printed on its own line, and when sanitising
// removed anything the item says how many characters went, so a stripped value never looks clean.
export function renderItem(item: ReviewItem, at: number, of: number, color: boolean): string {
	const label = (text: string) => (color ? `\u001b[1m${text}\u001b[0m` : text)
	let hidden = 0
	const s = (text: string) => {
		const out = sanitiseCounted(text)
		hidden += out.hidden
		return out.text
	}
	const head = item.kind === "field" ? `field ${item.field}` : "Include this unit?"
	const lines = [
		RULE,
		`| ${at} of ${of}   kommune ${item.kommune}   ${s(item.unitName)}   ${head}`,
		RULE,
	]
	if (item.kind === "field") {
		lines.push(`${label("Value:")} ${s(String(item.value))}`)
		if (item.role !== undefined) lines.push(`${label("Role:")} ${s(item.role)}`)
		const quotes = evidenceQuotes(item.evidence)
		const original = item.evidence.kind === "decision" ? item.evidence.original : item.evidence
		if (quotes.length > 0) {
			lines.push(label("Quote:"), QUOTE_RULE, ...quotes.map((q) => `  | ${s(q)}`), QUOTE_RULE)
		} else if (original.kind === "register") {
			lines.push(`${label("Register:")} ${original.register}, record ${s(original.recordId)}`)
		}
		lines.push(
			`${label("Source:")} ${s(item.sourceUrl)}`,
			`${label("Host:")} ${s(hostOf(item.sourceUrl))}`
		)
		lines.push(
			`${label("Why:")} ${s(item.reason)}`,
			canAccept(item) ? FIELD_KEYS : FIELD_KEYS_NO_ACCEPT
		)
	} else {
		lines.push(`${label("Why:")} ${s(item.reason)}`)
		lines.push(`${label("Suggested categories:")} ${item.suggestedCategories.join(", ") || "none"}`)
		lines.push(`${label("Provider type:")} ${item.providerType ?? "unknown"}`)
		for (const ref of item.sources) {
			if (ref.kind === "page")
				lines.push(`${label("Page:")} ${s(ref.ref)}`, `${label("Host:")} ${s(hostOf(ref.ref))}`)
			else lines.push(`${label("Register:")} ${ref.kind}, record ${s(ref.ref)}`)
		}
		lines.push(INCLUDE_KEYS)
	}
	if (hidden > 0)
		lines.push(`Note: ${hidden} hidden or control characters were removed for display.`)
	return `${lines.join("\n")}\n`
}
