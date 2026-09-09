import { useTranslation } from "../i18n/LanguageProvider.tsx"

// 12 cards, not 6: a full results page is usually close to this size (the default API page
// size is 20, but most searches land well under that), and each skeleton card below is shaped
// to roughly the height a real ResourceCard settles at once its badges, description and
// hours line are in. Undershooting this count and shape is what caused the CLS budget miss —
// the results grid grew a lot once data replaced a much shorter skeleton, shoving the footer
// down from inside the viewport to well below it. Overshooting slightly is the safer direction:
// a skeleton a little taller than the real content just shrinks by a bit, which moves less than
// growing from a skeleton a lot shorter than the real content does.
const placeholders = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

export function LoadingState() {
	const t = useTranslation()
	return (
		// Same two-level shape as the ready state below (a heading, then its own grid of cards),
		// not one grid holding both — the heading needs to span the full width at md/xl, the way
		// the ready state's <h1> does as a sibling of its <ul>, not a cell inside it.
		<div role="status" aria-busy="true" className="grid gap-4">
			{/* Visible now, not hidden: this is still the page's only <h1> while loading (so /sok
			    keeps exactly one level-1 heading in every state), and giving it the same type
			    scale as the ready-state heading below reserves the same line of vertical space
			    that heading occupies once results arrive, instead of collapsing to nothing. */}
			<h1 className="text-lg leading-snug">{t("status.loading")}</h1>
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{placeholders.map((n) => (
					<div
						key={n}
						aria-hidden="true"
						className="grid gap-3 rounded-xl border border-border bg-surface p-4"
					>
						<div className="h-7 w-2/3 rounded bg-accent-soft" />
						<div className="h-6 w-1/3 rounded bg-accent-soft" />
						<div className="h-4 w-full rounded bg-accent-soft" />
						<div className="h-4 w-5/6 rounded bg-accent-soft" />
						<div className="h-4 w-1/2 rounded bg-accent-soft" />
						<div className="h-11 w-1/2 rounded-xl bg-accent-soft" />
						<div className="h-3 w-1/3 rounded bg-accent-soft" />
					</div>
				))}
			</div>
		</div>
	)
}
