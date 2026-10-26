import { useEffect, useState } from "react"
import { useArrivalFocus } from "../hooks/useArrivalFocus.ts"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { usePageData } from "../pageData.ts"
import { contactTiles } from "../services/contactTiles.ts"
import { clearIndexCache, loadIndex } from "../services/data.ts"
import { type Family, familyOf, NO_FAMILY } from "../services/family.ts"
import { safeChatUrl } from "../services/helplines.ts"
import { metaDescription } from "../services/site.ts"
import type { ResourceDto } from "../types/api.ts"
import { ContactTiles } from "./ContactTiles.tsx"
import { DetailActions } from "./DetailActions.tsx"
import { ErrorState } from "./ErrorState.tsx"
import { ArrowLeftIcon } from "./icons.tsx"
import { Link } from "./Link.tsx"
import { LoadingState } from "./LoadingState.tsx"
import { NotFoundState } from "./NotFoundState.tsx"
import { PageHead } from "./PageHead.tsx"
import { ResourceBadges } from "./ResourceBadges.tsx"

type DetailState =
	| { kind: "loading" }
	| { kind: "error" }
	| { kind: "missing" }
	| { kind: "ready"; resource: ResourceDto; family: Family }

export function ResourceDetail({ id, arrival = 0 }: { id: number; arrival?: number }) {
	const { lang } = useLanguage()
	const t = useTranslation()
	const pageData = usePageData()
	const [state, setState] = useState<DetailState>(() =>
		pageData.resource?.id === id
			? { kind: "ready", resource: pageData.resource, family: pageData.family ?? NO_FAMILY }
			: { kind: "loading" }
	)
	const [attempt, setAttempt] = useState(0)
	const { ref: heading } = useArrivalFocus<HTMLHeadingElement>(arrival, state.kind === "ready")

	const [cameFromResults, setCameFromResults] = useState(false)
	// Browser-only fact that must not be read during the first render (prerendering has no
	// history.state, and reading it synchronously would make hydration mismatch the server's
	// markup), so an effect fills it in right after mount. The site sends no referrer and pushState
	// never sets one, so whether this page was reached from /sok travels in history state
	// (useUrlState's navigate sets it on the way out). A direct load (bookmark, shared link,
	// refresh) has no such state. This is a fact about *this navigation*. App.tsx keys
	// ResourceDetail by id, so a detail-to-detail transition remounts it and this runs again; the
	// `id` dependency keeps the effect right even for a caller that does not key it.
	// biome-ignore lint/correctness/useExhaustiveDependencies: id forces the recompute per navigation
	useEffect(() => {
		setCameFromResults((window.history.state as { from?: string } | null)?.from === "sok")
	}, [id])

	// biome-ignore lint/correctness/useExhaustiveDependencies: attempt only forces a re-fetch
	useEffect(() => {
		// The prerendered page already carries this resource in its data block, so no fetch is needed
		// on a direct load. A later id/lang change (or a retry) still goes to the index.
		if (pageData.resource?.id === id) return
		let cancelled = false
		setState({ kind: "loading" })
		loadIndex(lang).then(
			(index) => {
				if (cancelled) return
				const found = index.resources.find((r) => r.id === id)
				setState(
					found
						? { kind: "ready", resource: found, family: familyOf(found, index.resources) }
						: { kind: "missing" }
				)
			},
			() => {
				if (!cancelled) setState({ kind: "error" })
			}
		)
		return () => {
			cancelled = true
		}
	}, [id, lang, attempt, pageData])

	if (state.kind === "loading") return <LoadingState />
	if (state.kind === "error")
		return (
			<ErrorState
				onRetry={() => {
					clearIndexCache()
					setAttempt((n) => n + 1)
				}}
			/>
		)
	// NotFoundState is the sole content of the page in this state (the shell renders nothing
	// else around it here), so it takes the page's one level-1 heading, same as every other route.
	if (state.kind === "missing") return <NotFoundState arrival={arrival} />

	const { resource, family } = state
	const tiles = contactTiles(resource, family.children)
	const [partOfBefore = "", partOfAfter = ""] = t("detail.partOf").split("{name}")

	const backLabel = t("detail.back")
	const backContent = (
		<>
			<ArrowLeftIcon className="h-5 w-5" />
			{t("detail.backShort")}
		</>
	)
	const description = resource.description.trim()
	// The same https guard as chat links: every website in the data is https, and anything else
	// (a typo, a javascript: value) shows as text and never becomes a link.
	const website = safeChatUrl(resource.website)
	const hasFacts = Boolean(
		resource.openingHours || resource.address || resource.website || resource.costNote
	)

	return (
		<div className="grid gap-6">
			<PageHead
				title={`${resource.name} – Varde`}
				description={metaDescription(resource.description)}
				path={`/resources/${resource.id}`}
			/>
			{/* The way back stays in the page, since the back and forward buttons exist only in the
			    installed app. It shows one word and keeps the full name for screen readers. */}
			{cameFromResults ? (
				<button
					type="button"
					className="back-pill justify-self-start"
					aria-label={backLabel}
					onClick={() => window.history.back()}
				>
					{backContent}
				</button>
			) : (
				<Link to="/sok" className="back-pill justify-self-start" aria-label={backLabel}>
					{backContent}
				</Link>
			)}
			{/* Everything about the service sits in this one card (spec: the detail page as one
			    card). DOM order is the reading and focus order at every width. */}
			<article className="detail-card grid gap-6 rounded-xl border border-border bg-surface p-5 md:p-8">
				<header className="detail-head">
					<div className="detail-title grid min-w-0 gap-3">
						<h1 ref={heading} tabIndex={-1} className="text-3xl wrap-anywhere md:text-5xl">
							{resource.name}
						</h1>
						<ResourceBadges resource={resource} />
						<p className="text-muted">
							{resource.isNational ? t("detail.nationalService") : resource.municipalityName}
						</p>
						{family.parent && (
							<p className="text-sm text-muted">
								{partOfBefore}
								<Link to={`/resources/${family.parent.id}`} className="text-accent underline">
									{family.parent.name}
								</Link>
								{partOfAfter}
							</p>
						)}
						{resource.isFallbackTranslation && (
							<p className="text-sm text-muted">{t("card.fallback")}</p>
						)}
					</div>
					<DetailActions id={resource.id} name={resource.name} phone={resource.phone} />
				</header>
				<ContactTiles tiles={tiles} />
				{description && (
					<section aria-labelledby="service-about" className="detail-section grid gap-3">
						<h2 id="service-about" className="section-label">
							{t("detail.aboutHeading")}
						</h2>
						{/* A fallback row on /en is Norwegian text, so a screen reader must read it as
						    Norwegian (WCAG 3.1.2). The title and hours are short, so only this gets lang. */}
						<p
							className="max-w-prose"
							lang={resource.isFallbackTranslation && lang === "en" ? "nb" : undefined}
						>
							{description}
						</p>
					</section>
				)}
				{hasFacts && (
					<section aria-labelledby="service-practical" className="detail-section grid gap-3">
						<h2 id="service-practical" className="section-label">
							{t("detail.practicalHeading")}
						</h2>
						{/* Each label and value is a div, so on a phone a label sits right above its own
						    value. From 768 px the divs step aside and the dl is a two-column grid. */}
						<dl className="detail-facts">
							{resource.openingHours && (
								<div>
									<dt>{t("card.hours")}</dt>
									<dd>{resource.openingHours}</dd>
								</div>
							)}
							{resource.costNote && (
								<div>
									<dt>{t("detail.price")}</dt>
									<dd className="wrap-anywhere">{resource.costNote}</dd>
								</div>
							)}
							{resource.address && (
								<div>
									<dt>{t("detail.address")}</dt>
									<dd>{resource.address}</dd>
								</div>
							)}
							{resource.website && (
								<div>
									<dt>{t("detail.website")}</dt>
									<dd className="wrap-anywhere">
										{website ? (
											<a href={website} rel="noopener noreferrer" className="text-accent underline">
												{website}
											</a>
										) : (
											resource.website
										)}
									</dd>
								</div>
							)}
						</dl>
					</section>
				)}
				{/* A footer inside an article is not a contentinfo landmark, so the site footer stays
				    the only one. No heading: a heading over one date is noise in the heading list. */}
				<footer className="detail-section text-sm text-muted">
					{t("card.lastVerified")} {resource.lastVerified}
				</footer>
			</article>
		</div>
	)
}
