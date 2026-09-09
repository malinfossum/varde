import { useEffect, useState } from "react"
import { useArrivalFocus } from "../hooks/useArrivalFocus.ts"
import { useDocumentTitle } from "../hooks/useDocumentTitle.ts"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { fetchResource } from "../services/api.ts"
import { copyText, shareCapability, shareResource } from "../services/contactActions.ts"
import { telHref } from "../services/emergency.ts"
import type { ResourceDto } from "../types/api.ts"
import { ErrorState } from "./ErrorState.tsx"
import { Link } from "./Link.tsx"
import { LoadingState } from "./LoadingState.tsx"
import { NotFoundState } from "./NotFoundState.tsx"
import { ResourceBadges } from "./ResourceBadges.tsx"
import { useAnnounce } from "./StatusRegion.tsx"

type DetailState =
	| { kind: "loading" }
	| { kind: "error" }
	| { kind: "missing" }
	| { kind: "ready"; resource: ResourceDto }

export function ResourceDetail({ id, arrival = 0 }: { id: number; arrival?: number }) {
	const { lang } = useLanguage()
	const t = useTranslation()
	const announce = useAnnounce()
	const [state, setState] = useState<DetailState>({ kind: "loading" })
	const [attempt, setAttempt] = useState(0)
	const { ref: heading } = useArrivalFocus<HTMLHeadingElement>(arrival, state.kind === "ready")

	useDocumentTitle(
		state.kind === "ready"
			? t("title.detail").replace("{name}", state.resource.name)
			: t("title.app")
	)

	// biome-ignore lint/correctness/useExhaustiveDependencies: attempt is used as a trigger for retry
	useEffect(() => {
		const controller = new AbortController()
		setState({ kind: "loading" })
		fetchResource(id, lang, controller.signal)
			.then((resource) => setState(resource ? { kind: "ready", resource } : { kind: "missing" }))
			.catch((error: unknown) => {
				if (error instanceof DOMException && error.name === "AbortError") return
				setState({ kind: "error" })
			})
		return () => controller.abort()
	}, [id, lang, attempt])

	if (state.kind === "loading") return <LoadingState />
	if (state.kind === "error") return <ErrorState onRetry={() => setAttempt((n) => n + 1)} />
	// NotFoundState is the sole content of the page in this state — the shell renders nothing
	// else around it here — so it takes the page's one level-1 heading, same as every other route.
	if (state.kind === "missing") return <NotFoundState arrival={arrival} />

	const { resource } = state
	// Read once per render so the label always says what the tap will do.
	const capability = shareCapability(navigator)
	const canCopy = Boolean(navigator.clipboard)

	const onShare = async () => {
		const outcome = await shareResource(
			{ name: resource.name, phone: resource.phone, url: window.location.href },
			navigator
		)
		if (outcome === "copied") announce(t("detail.linkCopied"))
		if (outcome === "failed") announce(t("detail.copyFailed"))
	}

	const onCopyPhone = async (phone: string) => {
		const ok = await copyText(phone, navigator)
		announce(t(ok ? "detail.phoneCopied" : "detail.copyFailed"))
	}

	// The site sends no referrer and pushState never sets one, so whether this page was reached
	// from /sok travels in history state (useUrlState's navigate sets it on the way out). A
	// direct load — bookmark, shared link, refresh — has no such state and gets a plain link.
	const cameFromResults = (window.history.state as { from?: string } | null)?.from === "sok"
	const backLabel = t("detail.back")

	return (
		<article className="grid gap-6">
			{cameFromResults ? (
				<button
					type="button"
					className="justify-self-start text-accent underline"
					onClick={() => window.history.back()}
				>
					{backLabel}
				</button>
			) : (
				<Link to="/sok" className="justify-self-start text-accent underline">
					{backLabel}
				</Link>
			)}
			<header className="grid gap-3 rounded-xl border border-border bg-surface p-5 md:p-8">
				<h1 ref={heading} tabIndex={-1} className="text-3xl md:text-5xl">
					{resource.name}
				</h1>
				<ResourceBadges resource={resource} />
				<p className="text-muted">
					{resource.isNational ? t("detail.nationalService") : resource.municipalityName}
				</p>
				{resource.isFallbackTranslation && (
					<p className="text-sm text-muted">{t("card.fallback")}</p>
				)}
				{/* Call is the hero action — the whole reason someone lands here. Share/copy-link stay
				    available even without a phone number (a chat- or web-only service still shares). */}
				{(resource.phone || capability !== "none") && (
					<div className="flex flex-wrap items-center gap-2">
						{resource.phone && (
							<a href={telHref(resource.phone)} className="btn-primary text-xl md:text-2xl">
								{t("card.call")} {resource.phone}
							</a>
						)}
						{resource.phone && canCopy && (
							<button
								type="button"
								className="btn-secondary"
								onClick={() => resource.phone && onCopyPhone(resource.phone)}
							>
								{t("detail.copyPhone")}
							</button>
						)}
						{capability !== "none" && (
							<button type="button" className="btn-secondary" onClick={onShare}>
								{t(capability === "share" ? "detail.share" : "detail.copyLink")}
							</button>
						)}
					</div>
				)}
			</header>
			<p className="max-w-prose">{resource.description}</p>
			{/* Hours sit with the rest of the contact facts — phone moved to the hero above. */}
			<dl className="grid gap-3 md:grid-cols-[max-content_1fr] md:gap-x-8">
				{resource.openingHours && (
					<>
						<dt className="text-muted">{t("card.hours")}</dt>
						<dd>{resource.openingHours}</dd>
					</>
				)}
				{resource.address && (
					<>
						<dt className="text-muted">{t("detail.address")}</dt>
						<dd>{resource.address}</dd>
					</>
				)}
				{resource.website && (
					<>
						<dt className="text-muted">{t("detail.website")}</dt>
						<dd>
							<a
								href={resource.website}
								rel="noopener noreferrer"
								className="text-accent underline"
							>
								{resource.website}
							</a>
						</dd>
					</>
				)}
				{resource.email && (
					<>
						<dt className="text-muted">{t("detail.email")}</dt>
						<dd>
							<a href={`mailto:${resource.email}`} className="text-accent underline">
								{resource.email}
							</a>
						</dd>
					</>
				)}
				{resource.chatUrl && (
					<>
						<dt className="text-muted">{t("detail.chat")}</dt>
						<dd>
							<a
								href={resource.chatUrl}
								rel="noopener noreferrer"
								className="text-accent underline"
							>
								{resource.chatUrl}
							</a>
						</dd>
					</>
				)}
			</dl>
			<p className="text-sm text-muted">
				{t("card.lastVerified")} {resource.lastVerified}
			</p>
		</article>
	)
}
