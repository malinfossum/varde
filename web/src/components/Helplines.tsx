import { useEffect, useState } from "react"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { usePageData } from "../pageData.ts"
import { loadIndex, peekIndex } from "../services/data.ts"
import { telHref } from "../services/emergency.ts"
import { HELPLINE_NOTES, type Helpline, pickHelplines, safeChatUrl } from "../services/helplines.ts"
import type { Lang } from "../services/urlState.ts"
import { Link } from "./Link.tsx"

// Rows known without a request: baked into this page for this language, or picked from an
// index that is already in memory. Derived on every render, so no frame shows the other
// language's names after a switch.
function knownHelplines(baked: Helpline[] | null, lang: Lang): Helpline[] | null {
	if (baked) return baked
	const index = peekIndex(lang)
	if (!index) return null
	try {
		return pickHelplines(index.resources)
	} catch {
		// An id missing from the data fails the build at prerender; in the browser the section
		// just stays hidden rather than taking the landing page down with it.
		return null
	}
}

export function Helplines({ className }: { className?: string }) {
	const { lang } = useLanguage()
	const t = useTranslation()
	const page = usePageData().helplines
	const known = knownHelplines(page?.lang === lang ? page.entries : null, lang)
	const [fetched, setFetched] = useState<{ lang: Lang; entries: Helpline[] } | null>(null)
	const needsFetch = known === null
	// A direct load has the rows baked in. Coming back by client-side navigation with a cold
	// index, or in the other language, they come from the index file instead. If that fails the
	// section stays hidden; the emergency numbers beside it still show.
	useEffect(() => {
		if (!needsFetch) return
		let cancelled = false
		loadIndex(lang)
			.then((index) => {
				if (!cancelled) setFetched({ lang, entries: pickHelplines(index.resources) })
			})
			.catch(() => {})
		return () => {
			cancelled = true
		}
	}, [lang, needsFetch])
	const entries = known ?? (fetched?.lang === lang ? fetched.entries : null)
	if (!entries) return null
	return (
		<section aria-labelledby="helplines" className={`@container ${className ?? ""}`}>
			<h2 id="helplines" className="text-2xl">
				{t("landing.helplinesHeading")}
			</h2>
			<p className="mt-2 text-muted lg:mt-1">{t("landing.helplinesSubtitle")}</p>
			{/* One grid for every row: names in the first column, buttons in the second, so all
			    buttons share one left edge and one width. In a column narrower than 21 rem every row
			    puts its button under the name instead, never just some of them. */}
			<ul className="mt-3 grid gap-y-3 lg:mt-2 @[21rem]:grid-cols-[minmax(0,1fr)_auto] @[21rem]:gap-x-3 @[21rem]:gap-y-2">
				{entries.map((entry) => {
					const chat = safeChatUrl(entry.chatUrl)
					const noteKey = HELPLINE_NOTES[entry.id]
					const note = noteKey ? t(noteKey) : null
					// The visible label stays short ("Ring 116 123"); the hidden part adds the service,
					// since two entries share 116 123. The visible words come first in the name
					// (WCAG 2.5.3, label in name).
					const hidden = note ? `, ${entry.name}, ${note}` : `, ${entry.name}`
					return (
						<li
							key={entry.id}
							className="helpline-row grid gap-1 @[21rem]:col-span-2 @[21rem]:grid-cols-subgrid @[21rem]:items-center"
						>
							<div className="lg:flex lg:flex-wrap lg:items-baseline lg:gap-x-2">
								<Link to={`/resources/${entry.id}`} className="helpline-name">
									{entry.name}
								</Link>
								{note && <p className="text-sm text-muted">{note}</p>}
							</div>
							{entry.phone ? (
								<a
									href={telHref(entry.phone)}
									className="btn-primary justify-self-start @[21rem]:justify-self-stretch"
								>
									{t("card.call")} {entry.phone}
									<span className="visually-hidden">{hidden}</span>
								</a>
							) : chat ? (
								<a
									href={chat}
									className="btn-secondary justify-self-start @[21rem]:justify-self-stretch"
								>
									{t("detail.chat")}
									<span className="visually-hidden">{hidden}</span>
								</a>
							) : null}
						</li>
					)
				})}
			</ul>
		</section>
	)
}
