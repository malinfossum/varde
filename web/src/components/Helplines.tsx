import { useEffect, useState } from "react"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { usePageData } from "../pageData.ts"
import { loadIndex, peekIndex } from "../services/data.ts"
import { telHref } from "../services/emergency.ts"
import { type HelplineGroup, pickHelplines } from "../services/helplines.ts"
import type { Lang } from "../services/urlState.ts"
import { ChatIcon, PhoneIcon } from "./icons.tsx"
import { Link } from "./Link.tsx"

// Rows known without a request: baked into this page for this language, or picked from an
// index that is already in memory. Derived on every render, so no frame shows the other
// language's names after a switch.
function knownHelplines(baked: HelplineGroup[] | null, lang: Lang): HelplineGroup[] | null {
	if (baked) return baked
	const index = peekIndex(lang)
	if (!index) return null
	try {
		return pickHelplines(index.resources)
	} catch {
		// A missing id, or a landing label that no longer sits inside its row's name, fails the
		// build at prerender; in the browser either one just leaves the section hidden rather
		// than taking the landing page down with it.
		return null
	}
}

export function Helplines({ className }: { className?: string }) {
	const { lang } = useLanguage()
	const t = useTranslation()
	const known = knownHelplines(usePageData().helplines ?? null, lang)
	const [fetched, setFetched] = useState<{ lang: Lang; entries: HelplineGroup[] } | null>(null)
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
	const groups = known ?? (fetched?.lang === lang ? fetched.entries : null)
	if (!groups) return null
	return (
		<section aria-labelledby="helplines" className={className}>
			<h2 id="helplines" className="text-2xl lg:text-xl">
				{t("landing.helplinesHeading")}
			</h2>
			<p className="mt-2 text-muted lg:mt-1 lg:text-sm">{t("landing.helplinesSubtitle")}</p>
			{/* The container sits on this wrapper, not on the section: a section with a container type
			    cannot be a subgrid, and the landing shares its rows with the emergency section.
			    From 1024 px, in a column at least 26 rem wide, both groups share one grid: names,
			    then every phone button in one column, then every chat button in one, so their edges
			    line up across the groups (8.5 and 5.75 rem are 136 and 92 px at the default text
			    size). In a narrower column, or with a larger text size, each name sits on its own
			    line with its buttons below. */}
			<div className="@container lg:self-start">
				<div className="helpline-groups mt-3 grid gap-y-5 lg:mt-2 lg:@[26rem]:grid-cols-[minmax(0,1fr)_8.5rem_5.75rem] lg:@[26rem]:gap-x-2 lg:@[26rem]:gap-y-3">
					{groups.map((group) => (
						<section
							key={group.key}
							className="grid gap-y-2 lg:@[26rem]:col-span-3 lg:@[26rem]:grid-cols-subgrid"
						>
							<h3 id={`helplines-${group.key}`} className="helpline-group lg:@[26rem]:col-span-3">
								{t(`landing.helplineGroup.${group.key}`)}
							</h3>
							<ul
								// biome-ignore lint/a11y/noRedundantRoles: VoiceOver drops it when list-style is none
								role="list"
								aria-labelledby={`helplines-${group.key}`}
								className="grid gap-y-4 lg:@[26rem]:col-span-3 lg:@[26rem]:grid-cols-subgrid lg:@[26rem]:gap-y-2"
							>
								{group.rows.map((row) => (
									<li
										key={row.id}
										className="helpline-row grid gap-y-1 lg:@[26rem]:col-span-3 lg:@[26rem]:grid-cols-subgrid lg:@[26rem]:items-center"
									>
										<Link to={`/resources/${row.id}`} className="helpline-name lg:text-sm">
											{row.name}
										</Link>
										{/* Two buttons side by side, or stacked in a column under 20 rem (320 px, or a
									    larger text size). A row without a chat gives its phone the full width. From
									    1024 px the wrapper steps aside (display: contents) so the buttons sit in the
									    shared columns. The hidden words make the names "Ring 116 123, Mental Helse"
									    and "Chat, Mental Helse": the visible label is always part of the name. The
									    buttons are flex containers, which turns every child into a block and makes
									    Chromium put a space before the hidden comma, so the text sits in one span. */}
										<div
											className={`helpline-actions grid gap-2 lg:@[26rem]:contents ${row.chatUrl ? "@[20rem]:grid-cols-2" : ""}`}
										>
											{row.phone && (
												<a href={telHref(row.phone)} className="btn-primary px-3 lg:text-sm">
													<PhoneIcon className="size-5 shrink-0 lg:size-4" />
													<span>
														<span className="visually-hidden">{t("card.call")}</span> {row.phone}
														<span className="hidden-inline">, {row.name}</span>
													</span>
												</a>
											)}
											{row.chatUrl && (
												<a
													href={row.chatUrl}
													className="btn-secondary px-3 lg:text-sm lg:@[26rem]:col-start-3"
												>
													<ChatIcon className="size-5 shrink-0 lg:size-4" />
													<span>
														{t("detail.chat")}
														<span className="hidden-inline">, {row.name}</span>
													</span>
												</a>
											)}
										</div>
									</li>
								))}
							</ul>
						</section>
					))}
				</div>
			</div>
		</section>
	)
}
