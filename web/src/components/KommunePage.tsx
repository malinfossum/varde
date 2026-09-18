import { useEffect, useState } from "react"
import { useArrivalFocus } from "../hooks/useArrivalFocus.ts"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { usePageData } from "../pageData.ts"
import { type KommuneEntry, loadIndex } from "../services/data.ts"
import { compareResources, matchesMunicipality } from "../services/query.ts"
import type { ResourceDto } from "../types/api.ts"
import { ErrorState } from "./ErrorState.tsx"
import { Link } from "./Link.tsx"
import { LoadingState } from "./LoadingState.tsx"
import { NotFoundState } from "./NotFoundState.tsx"
import { PageHead } from "./PageHead.tsx"
import { ResourceCard } from "./ResourceCard.tsx"

type Data = { entry: KommuneEntry; local: ResourceDto[]; national: ResourceDto[] }
type State =
	| { kind: "loading" }
	| { kind: "error" }
	| { kind: "notFound" }
	| { kind: "ready"; data: Data }

// Own resources and served resources both belong in "local" — a shared krisesenter must appear
// in every kommune it serves, not only the one holding its address (mirrors query.ts's
// applyQuery, which does the same for the ?municipality= filter).
export function splitForKommune(entry: KommuneEntry, resources: ResourceDto[]): Data {
	const local = resources
		.filter((r) => !r.isNational && matchesMunicipality(r, entry.id))
		.sort(compareResources)
	const national = resources.filter((r) => r.isNational).sort(compareResources)
	return { entry, local, national }
}

function fill(template: string, values: Record<string, string | number>): string {
	return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ""))
}

export function KommunePage({ slug, arrival }: { slug: string; arrival: number }) {
	const t = useTranslation()
	const { lang } = useLanguage()
	const baked = usePageData().kommune
	const [state, setState] = useState<State>(() =>
		baked && baked.entry.slug === slug ? { kind: "ready", data: baked } : { kind: "loading" }
	)
	const [attempt, setAttempt] = useState(0)
	// biome-ignore lint/correctness/useExhaustiveDependencies: attempt only forces a re-fetch
	useEffect(() => {
		if (baked && baked.entry.slug === slug) return
		let cancelled = false
		loadIndex(lang).then(
			(index) => {
				if (cancelled) return
				const entry = index.kommuner.find((k) => k.slug === slug)
				setState(
					entry
						? { kind: "ready", data: splitForKommune(entry, index.resources) }
						: { kind: "notFound" }
				)
			},
			() => {
				if (!cancelled) setState({ kind: "error" })
			}
		)
		return () => {
			cancelled = true
		}
	}, [slug, lang, baked, attempt])
	const { ref } = useArrivalFocus<HTMLHeadingElement>(arrival, state.kind === "ready")

	if (state.kind === "loading") return <LoadingState />
	if (state.kind === "error") return <ErrorState onRetry={() => setAttempt((n) => n + 1)} />
	if (state.kind === "notFound") return <NotFoundState arrival={arrival} />

	const { entry, local, national } = state.data
	const values = { name: entry.name, county: entry.county, n: local.length }
	const title = fill(t("kommune.title"), values)
	return (
		<article>
			<PageHead
				title={`${title} – Varde`}
				description={fill(t("kommune.description"), values)}
				path={`/kommune/${slug}`}
			/>
			<h1 ref={ref} tabIndex={-1}>
				{title}
			</h1>
			<p>{fill(t("kommune.description"), values)}</p>
			<section aria-labelledby="kommune-local">
				<h2 id="kommune-local">{fill(t("kommune.local"), values)}</h2>
				<ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{local.map((r) => (
						<ResourceCard key={r.id} resource={r} headingLevel={3} />
					))}
				</ul>
			</section>
			<section aria-labelledby="kommune-national">
				<h2 id="kommune-national">{t("kommune.national")}</h2>
				<ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{national.map((r) => (
						<ResourceCard key={r.id} resource={r} headingLevel={3} />
					))}
				</ul>
			</section>
			<p>
				<Link to={`/sok?municipality=${entry.id}`} className="btn-secondary">
					{fill(t("kommune.refine"), values)}
				</Link>
			</p>
		</article>
	)
}
