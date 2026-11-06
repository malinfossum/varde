import { useEffect, useState } from "react"
import { useArrivalFocus } from "../hooks/useArrivalFocus.ts"
import { fill } from "../i18n/fill.ts"
import { useLanguage, useTranslation } from "../i18n/LanguageProvider.tsx"
import { usePageData } from "../pageData.ts"
import { loadIndex } from "../services/data.ts"
import { buildKommuneIndex, type KommuneIndex } from "../services/kommuneIndex.ts"
import { ErrorState } from "./ErrorState.tsx"
import { Link } from "./Link.tsx"
import { LoadingState } from "./LoadingState.tsx"
import { PageHead } from "./PageHead.tsx"

type State = { kind: "loading" } | { kind: "error" } | { kind: "ready"; index: KommuneIndex }

// /kommune (spec 2026-11-06): the crawlable way in to every kommune page. A direct load reads
// the baked index; a client-side visit builds it from the language's export, like KommunePage.
export function KommuneIndexPage({ arrival }: { arrival: number }) {
	const t = useTranslation()
	const { lang } = useLanguage()
	const baked = usePageData().kommuneIndex
	const [state, setState] = useState<State>(() =>
		baked ? { kind: "ready", index: baked } : { kind: "loading" }
	)
	const [attempt, setAttempt] = useState(0)
	// biome-ignore lint/correctness/useExhaustiveDependencies: attempt only forces a re-fetch
	useEffect(() => {
		if (baked) return
		let cancelled = false
		loadIndex(lang).then(
			(index) => {
				if (!cancelled)
					setState({ kind: "ready", index: buildKommuneIndex(index.kommuner, index.resources) })
			},
			() => {
				if (!cancelled) setState({ kind: "error" })
			}
		)
		return () => {
			cancelled = true
		}
	}, [lang, baked, attempt])
	const { ref } = useArrivalFocus<HTMLHeadingElement>(arrival, state.kind === "ready")

	if (state.kind === "loading") return <LoadingState />
	if (state.kind === "error") return <ErrorState onRetry={() => setAttempt((n) => n + 1)} />

	const { groups, national } = state.index
	const count = (n: number) =>
		n === 1 ? t("kommuneIndex.countOne") : fill(t("kommuneIndex.countOther"), { n })
	return (
		<article className="grid gap-6">
			<PageHead
				title={t("kommuneIndex.pageTitle")}
				description={t("kommuneIndex.description")}
				path="/kommune"
			/>
			<h1 ref={ref} tabIndex={-1}>
				{t("kommuneIndex.title")}
			</h1>
			{groups.map((group, i) => (
				<section key={group.county} aria-labelledby={`fylke-${i}`} className="grid gap-3">
					<h2 id={`fylke-${i}`}>{group.county}</h2>
					<ul
						// biome-ignore lint/a11y/noRedundantRoles: VoiceOver drops it when list-style is none
						role="list"
						className="kommune-grid"
					>
						{group.kommuner.map((k) => (
							<li key={k.slug}>
								<Link to={`/kommune/${k.slug}`} className="kommune-row">
									<span className="kommune-name">{k.name}</span>{" "}
									<span className="kommune-count text-sm text-muted">{count(k.count)}</span>
								</Link>
							</li>
						))}
					</ul>
				</section>
			))}
			{national > 0 && (
				<p>
					{national === 1
						? t("kommuneIndex.nationalOne")
						: fill(t("kommuneIndex.national"), { n: national })}{" "}
					<Link to="/sok" className="underline">
						{t("kommuneIndex.nationalLink")}
					</Link>
				</p>
			)}
		</article>
	)
}
