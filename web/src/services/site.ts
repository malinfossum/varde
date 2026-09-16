// The public origin, set by the deploy workflow (SITE_ORIGIN variable). Only absolute URLs
// (canonical, hreflang, sitemap) use it; every link in the app stays relative. A trailing
// slash would double up with every path this gets concatenated with (`${SITE_ORIGIN}/sok`
// becoming `https://host//sok`), so it's stripped here rather than trusted from the env.
export const SITE_ORIGIN: string = (
	import.meta.env.VITE_SITE_ORIGIN ?? "http://localhost:5173"
).replace(/\/$/, "")

export function metaDescription(text: string): string {
	if (text.length <= 155) return text
	const head = text.slice(0, 155)
	const cut = head.lastIndexOf(" ")
	return `${(cut > 0 ? head.slice(0, cut) : head).trimEnd()}…`
}
