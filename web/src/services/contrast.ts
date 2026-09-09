// WCAG 2.x relative luminance and contrast ratio, plus a reader for tokens.css. Kept as a
// service so the test suite and any future tooling share one implementation.

function channel(value: number): number {
	const c = value / 255
	return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number {
	const clean = hex.replace("#", "")
	const full = clean.length === 3 ? clean.replace(/(.)/g, "$1$1") : clean
	const r = Number.parseInt(full.slice(0, 2), 16)
	const g = Number.parseInt(full.slice(2, 4), 16)
	const b = Number.parseInt(full.slice(4, 6), 16)
	return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatio(hexA: string, hexB: string): number {
	const a = relativeLuminance(hexA)
	const b = relativeLuminance(hexB)
	const [light, dark] = a > b ? [a, b] : [b, a]
	return (light + 0.05) / (dark + 0.05)
}

// Reads `--name: #hex;` declarations inside the `:root { … }` and `[data-theme="dark"] { … }`
// blocks. Anything that is not a hex colour (color-scheme, font stacks) is skipped.
export function parseThemeTokens(css: string): {
	light: Record<string, string>
	dark: Record<string, string>
} {
	const block = (selector: string) => {
		const start = css.indexOf(selector)
		if (start === -1) return ""
		const open = css.indexOf("{", start)
		const close = css.indexOf("}", open)
		return css.slice(open + 1, close)
	}
	const read = (body: string) => {
		const tokens: Record<string, string> = {}
		for (const match of body.matchAll(/--([a-z0-9-]+)\s*:\s*(#[0-9a-fA-F]{3,6})\s*;/g)) {
			tokens[match[1]] = match[2]
		}
		return tokens
	}
	return { light: read(block(":root")), dark: read(block('[data-theme="dark"]')) }
}
