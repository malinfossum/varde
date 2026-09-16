import { createContext, useContext, useEffect } from "react"
import { useLanguage } from "../i18n/LanguageProvider.tsx"
import { SITE_ORIGIN } from "../services/site.ts"
import { type Lang, pathFor } from "../services/urlState.ts"

export type HeadEntry = { title: string; description: string; path: string; lang: Lang }

// Server side the prerender collects the entry and writes the tags itself; in the browser an
// effect writes them, so <head> never takes part in hydration (spec: Head per page).
export const HeadContext = createContext<{ set(entry: HeadEntry): void } | null>(null)

function upsert(selector: string, create: () => HTMLElement, apply: (el: HTMLElement) => void) {
	let el = document.head.querySelector<HTMLElement>(selector)
	if (!el) {
		el = create()
		el.dataset.pageHead = ""
		document.head.append(el)
	}
	apply(el)
}

export function PageHead({
	title,
	description,
	path,
}: {
	title: string
	description: string
	path: string
}) {
	const { lang } = useLanguage()
	const collector = useContext(HeadContext)
	collector?.set({ title, description, path, lang })
	useEffect(() => {
		if (collector) return
		document.title = title
		upsert(
			'meta[name="description"]',
			() => document.createElement("meta"),
			(el) => {
				el.setAttribute("name", "description")
				el.setAttribute("content", description)
			}
		)
		upsert(
			'link[rel="canonical"]',
			() => document.createElement("link"),
			(el) => {
				el.setAttribute("rel", "canonical")
				el.setAttribute("href", `${SITE_ORIGIN}${pathFor(lang, path)}`)
			}
		)
		const alternates: [string, Lang][] = [
			["nb", "nb"],
			["en", "en"],
			["x-default", "nb"],
		]
		for (const [hreflang, target] of alternates) {
			upsert(
				`link[rel="alternate"][hreflang="${hreflang}"]`,
				() => document.createElement("link"),
				(el) => {
					el.setAttribute("rel", "alternate")
					el.setAttribute("hreflang", hreflang)
					el.setAttribute("href", `${SITE_ORIGIN}${pathFor(target, path)}`)
				}
			)
		}
	}, [collector, title, description, path, lang])
	return null
}
