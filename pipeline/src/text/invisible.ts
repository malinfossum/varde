// Characters a reader cannot see: control and format characters (zero-width spaces, bidi
// overrides, the soft hyphen, tag characters), the Hangul fillers and the variation selectors.
// Tab and line breaks are whitespace, not hidden text, so they stay: the page reader splits lines
// on them. textLines strips these from every text node; the validity gate drops any value that
// still holds one; review's sanitiser reuses the pattern. Alternatives of single classes: linear.
export const INVISIBLE =
	/(?![\t\n\v\f\r])(?:[\p{Cc}\p{Cf}\u115F\u1160\u3164\uFFA0]|[\uFE00-\uFE0F]|[\u{E0100}-\u{E01EF}])/gu

export function stripInvisible(text: string): string {
	return text.replace(INVISIBLE, "")
}

// A copy without the global flag, so test() keeps no lastIndex between calls.
const ANY_INVISIBLE = new RegExp(INVISIBLE.source, "u")

export function hasInvisible(text: string): boolean {
	return ANY_INVISIBLE.test(text)
}
