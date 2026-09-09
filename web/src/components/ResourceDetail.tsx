import { useEffect, useState } from "react"
import { useArrivalFocus } from "../hooks/useArrivalFocus.ts"
import { useDocumentTitle } from "../hooks/useDocumentTitle.ts"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { fetchResource } from "../services/api.ts"
import { copyText, shareCapability, shareResource } from "../services/contactActions.ts"
import type { ResourceDto } from "../types/api.ts"
import { ErrorState } from "./ErrorState.tsx"
import { Link } from "./Link.tsx"
import { LoadingState } from "./LoadingState.tsx"
import { NotFoundState } from "./NotFoundState.tsx"
import { telHref } from "./ResourceCard.tsx"
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
	if (state.kind === "missing") return <NotFoundState arrival={arrival} level={2} />

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

	return (
		<article className="resource-detail stack">
			<Link to="/sok">{t("detail.back")}</Link>
			<h1 ref={heading} tabIndex={-1}>
				{resource.name}
			</h1>
			{resource.isFallbackTranslation && <p className="muted">{t("card.fallback")}</p>}
			<p>{resource.description}</p>
			{/* Hours sit with contact info, above the fold — they are this service's truth. */}
			<dl className="contact">
				{resource.openingHours && (
					<>
						<dt>{t("card.hours")}</dt>
						<dd>{resource.openingHours}</dd>
					</>
				)}
				{resource.phone && (
					<>
						<dt>{t("detail.phone")}</dt>
						<dd>
							<a href={telHref(resource.phone)}>{resource.phone}</a>
							{canCopy && (
								<button
									type="button"
									className="copy-phone"
									onClick={() => resource.phone && onCopyPhone(resource.phone)}
								>
									{t("detail.copyPhone")}
								</button>
							)}
						</dd>
					</>
				)}
				{resource.email && (
					<>
						<dt>{t("detail.email")}</dt>
						<dd>
							<a href={`mailto:${resource.email}`}>{resource.email}</a>
						</dd>
					</>
				)}
				{resource.website && (
					<>
						<dt>{t("detail.website")}</dt>
						<dd>
							<a href={resource.website} rel="noopener noreferrer">
								{resource.website}
							</a>
						</dd>
					</>
				)}
				{resource.chatUrl && (
					<>
						<dt>{t("detail.chat")}</dt>
						<dd>
							<a href={resource.chatUrl} rel="noopener noreferrer">
								{resource.chatUrl}
							</a>
						</dd>
					</>
				)}
				{resource.address && (
					<>
						<dt>{t("detail.address")}</dt>
						<dd>{resource.address}</dd>
					</>
				)}
			</dl>
			{capability !== "none" && (
				<div className="contact-actions">
					<button type="button" onClick={onShare}>
						{t(capability === "share" ? "detail.share" : "detail.copyLink")}
					</button>
				</div>
			)}
			<p className="muted">
				{t("card.lastVerified")} {resource.lastVerified}
			</p>
		</article>
	)
}
