// The public origin, set by the deploy workflow (SITE_ORIGIN variable). Only absolute URLs
// (canonical, hreflang, sitemap) use it; every link in the app stays relative.
export const SITE_ORIGIN: string = import.meta.env.VITE_SITE_ORIGIN ?? "http://localhost:5173"

export function metaDescription(text: string): string {
	if (text.length <= 155) return text
	const head = text.slice(0, 155)
	const cut = head.lastIndexOf(" ")
	return `${(cut > 0 ? head.slice(0, cut) : head).trimEnd()}…`
}
