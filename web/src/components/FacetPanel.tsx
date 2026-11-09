import { useRef } from "react"
import { Button, Dialog, DialogTrigger, Heading, Modal, ModalOverlay } from "react-aria-components"
import { fill } from "../i18n/fill.ts"
import { useTranslation } from "../i18n/LanguageProvider.tsx"
import { categoryLabelKey, costLabelKey, FEATURE_LABEL_KEYS } from "../services/activeFilters.ts"
import type { FacetCounts } from "../services/facets.ts"
import { COSTS, FEATURES, FILTER_CATEGORY_SLUGS, type Filters } from "../services/filters.ts"
import { isVisible } from "../services/returnFocus.ts"
import { FacetGroup } from "./FacetGroup.tsx"
import { QuickExit } from "./QuickExit.tsx"

type PanelProps = {
	filters: Filters
	counts: FacetCounts | null
	onPatch: (patch: Partial<Filters>) => void
}

function toggle<T>(values: readonly T[], value: T): T[] {
	return values.includes(value) ? values.filter((v) => v !== value) : [...values, value]
}

// The ticked facet options, for "Flere filtre (n)". Places and the national choice sit in the
// bar above, always in view, so they are not counted here.
export function facetTickCount(filters: Filters): number {
	return filters.categories.length + filters.features.length + filters.costs.length
}

// The three groups. Kategorier and Egenskaper start open, Pris closed (filter spec, FacetGroup).
// Tilbyder is not built yet: no row carries providerType.
function FacetGroups({ filters, counts, onPatch }: PanelProps) {
	const t = useTranslation()
	return (
		<div className="facet-groups">
			<FacetGroup
				legend={t("filter.categories")}
				options={FILTER_CATEGORY_SLUGS.map((slug) => ({
					value: slug,
					label: t(categoryLabelKey(slug)),
				}))}
				checked={filters.categories}
				counts={counts?.categories ?? null}
				defaultOpen
				onToggle={(slug) => onPatch({ categories: toggle(filters.categories, slug) })}
			/>
			<FacetGroup
				legend={t("filter.features")}
				options={FEATURES.map((feature) => ({
					value: feature,
					label: t(FEATURE_LABEL_KEYS[feature]),
				}))}
				checked={filters.features}
				counts={counts?.features ?? null}
				defaultOpen
				onToggle={(feature) => onPatch({ features: toggle(filters.features, feature) })}
			/>
			<FacetGroup
				legend={t("filter.cost")}
				options={COSTS.map((cost) => ({ value: cost, label: t(costLabelKey(cost)) }))}
				checked={filters.costs}
				counts={counts?.costs ?? null}
				defaultOpen={false}
				onToggle={(cost) => onPatch({ costs: toggle(filters.costs, cost) })}
			/>
		</div>
	)
}

// From 1024 px the groups sit in a column left of the results, as long as the results keep 20rem
// (the .sok-page container query in main.css decides; below that this is display: none, so it
// leaves the accessibility tree). The column is there while the catalog loads, empty, so the
// results never jump from the first column to the second.
export function FacetSidebar({ loaded, ...panel }: PanelProps & { loaded: boolean }) {
	const t = useTranslation()
	return (
		<aside aria-label={t("filter.heading")} className="facet-sidebar">
			{loaded && <FacetGroups {...panel} />}
		</aside>
	)
}

// Below the sidebar layout, "Flere filtre (n)" opens the groups in a full-screen react-aria
// Modal (filter spec, FacetPanel). Ticks apply live, so the footer always shows the real count.
// Escape and the footer button close it, and react-aria returns focus to the button. The
// dialog is a flex column with the footer under the scroll area, not over it, so the footer
// never covers a focused checkbox at any text size (Call C3). The count is announced by the
// page's one status region, which stays audible through the modal (data-live-announcer).
// The dialog covers the header, so it carries its own "Forlat siden": on a phone with no keyboard
// that button is the only quick exit, and a full-screen filter must never hide it.
export function FacetDialog({ totalCount, ...panel }: PanelProps & { totalCount: number | null }) {
	const t = useTranslation()
	const triggerRef = useRef<HTMLButtonElement>(null)
	const ticked = facetTickCount(panel.filters)
	// A tablet turned to landscape while the dialog is open crosses into the sidebar layout, and
	// the trigger is display: none by the time it closes, so react-aria's focus return would land
	// on <body>. Two frames, so this runs after react-aria's own restore: then focus goes to the
	// first sidebar group, which holds the same boxes.
	const onOpenChange = (open: boolean) => {
		if (open) return
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				if (triggerRef.current && isVisible(triggerRef.current)) return
				document.querySelector<HTMLElement>(".facet-sidebar summary")?.focus()
			})
		)
	}
	const show =
		totalCount === null
			? t("filter.showPending")
			: totalCount === 1
				? t("filter.showOne")
				: fill(t("filter.show"), { n: totalCount })
	return (
		<DialogTrigger onOpenChange={onOpenChange}>
			<Button ref={triggerRef} className="btn-secondary facet-trigger justify-self-start">
				{ticked > 0 ? fill(t("filter.moreCount"), { n: ticked }) : t("filter.more")}
			</Button>
			<ModalOverlay className="facet-overlay">
				<Modal className="facet-modal">
					<Dialog className="facet-dialog">
						{({ close }) => (
							<>
								<div className="facet-dialog-header">
									<Heading slot="title" level={2} className="facet-dialog-title">
										{t("filter.heading")}
									</Heading>
									<QuickExit />
								</div>
								<div className="facet-dialog-body">
									<FacetGroups {...panel} />
								</div>
								<div className="facet-dialog-footer">
									<button type="button" className="btn-primary w-full" onClick={close}>
										{show}
									</button>
								</div>
							</>
						)}
					</Dialog>
				</Modal>
			</ModalOverlay>
		</DialogTrigger>
	)
}
