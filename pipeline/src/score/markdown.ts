import { inert } from "../recall/report.ts"
import { sanitise } from "../review/sanitise.ts"

// The longest run of backticks in the text, read once from start to end.
function longestRun(text: string): number {
	let longest = 0
	let run = 0
	for (const ch of text) {
		run = ch === "`" ? run + 1 : 0
		if (run > longest) longest = run
	}
	return longest
}

// Text from a page or a lock as inline code: sanitised first, then fenced with one backtick more
// than its longest run, so it cannot close its own span. CommonMark takes one space off each end,
// so text that starts or ends with a backtick gets a space on both sides. Blank text has nothing
// to show, so it is written as plain words. Never use this for page text in a table cell: GitHub
// splits cells on "|" even inside code.
export function codeSpan(text: string): string {
	const clean = sanitise(text)
	if (clean.trim() === "") return "(blank)"
	const fence = "`".repeat(longestRun(clean) + 1)
	const pad = clean.startsWith("`") || clean.endsWith("`") ? " " : ""
	return `${fence}${pad}${clean}${pad}${fence}`
}

// Text from a page or a lock as a fenced block: each line sanitised, and a fence of at least three
// backticks and longer than any run inside, so a quote holding a run of three cannot close it.
export function codeBlock(text: string): string {
	const lines = text.split(/\r\n|\r|\n/).map(sanitise)
	const fence = "`".repeat(Math.max(3, longestRun(lines.join("\n")) + 1))
	return [`${fence}text`, ...lines, fence].join("\n")
}

// Free text (a unit name from the key, a reason, my note) in a table cell or a list line:
// sanitised, then made inert. inert escapes "|" too, so the text cannot open a new cell. GitHub
// links a bare web address on its own, so "www." and "://" are broken with an entity.
export function cellText(text: string): string {
	return inert(sanitise(text)).replace(/www\./gi, "www&#46;").replace(/:\/\//g, "&#58;//")
}
