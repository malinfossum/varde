import { useEffect, useState } from "react"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { fetchResource } from "../services/api.ts"
import type { ResourceDto } from "../types/api.ts"
import { ErrorState } from "./ErrorState.tsx"
import { Link } from "./Link.tsx"
import { LoadingState } from "./LoadingState.tsx"
import { NotFoundState } from "./NotFoundState.tsx"
import { telHref } from "./ResourceCard.tsx"

type DetailState =
	| { kind: "loading" }
	| { kind: "error" }
	| { kind: "missing" }
	| { kind: "ready"; resource: ResourceDto }

export function ResourceDetail({ id }: { id: number }) {
	const { lang } = useLanguage()
	const t = useTranslation()
	const [state, setState] = useState<DetailState>({ kind: "loading" })
	const [attempt, setAttempt] = useState(0)

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
	if (state.kind === "missing") return <NotFoundState />

	const { resource } = state
	return (
		<article className="resource-detail stack">
			<Link to="/">{t("detail.back")}</Link>
			<h2>{resource.name}</h2>
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
			<p className="muted">
				{t("card.lastVerified")} {resource.lastVerified}
			</p>
		</article>
	)
}
