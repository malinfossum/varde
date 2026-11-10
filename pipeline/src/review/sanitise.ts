import { INVISIBLE } from "../text/invisible.ts"

// Page text can hold terminal control codes. Everything a page gave (quotes, values, links) goes
// through here before it is printed, so a page cannot recolour, clear or rewrite my terminal, or
// make a quote or a link read differently from what it is. Each pattern scans forward once. The
// hidden characters are the ones text/invisible.ts names (Task 2), so the screen and the stored
// text agree on what counts as hidden.
// biome-ignore lint/suspicious/noControlCharactersInRegex: the escape and bell characters are what this pattern must match
const OSC = /\u001b\][^\u0007\u001b]*(?:\u0007|\u001b\\)?/g
// biome-ignore lint/suspicious/noControlCharactersInRegex: the control characters are what this pattern must match
const C1_OSC = /\u009d[^\u0007\u009c]*[\u0007\u009c]?/g
// biome-ignore lint/suspicious/noControlCharactersInRegex: the control characters are what this pattern must match
const CSI = /\u001b\[[0-?]*[ -/]*[@-~]/g
const C1_CSI = /\u009b[0-?]*[ -/]*[@-~]/g
// biome-ignore lint/suspicious/noControlCharactersInRegex: the control characters are what this pattern must match
const OTHER_ESCAPE = /\u001b[@-Z\\-_]?/g
const LINE_BREAKS = /[\t\n\r\u2028\u2029]/g
// biome-ignore lint/suspicious/noControlCharactersInRegex: the control characters are what this pattern must match
const CONTROLS = /[\u0000-\u001f\u007f-\u009f]/g

export function sanitise(text: string): string {
	return text
		.replace(OSC, "")
		.replace(C1_OSC, "")
		.replace(CSI, "")
		.replace(C1_CSI, "")
		.replace(OTHER_ESCAPE, "")
		.replace(LINE_BREAKS, " ")
		.replace(CONTROLS, "")
		.replace(INVISIBLE, "")
}

const codePoints = (text: string) => [...text].length

// The sanitised text and how many characters went. A line break becomes a space, so it is not
// counted as hidden.
export function sanitiseCounted(text: string): { text: string; hidden: number } {
	const clean = sanitise(text)
	return { text: clean, hidden: codePoints(text) - codePoints(clean) }
}
