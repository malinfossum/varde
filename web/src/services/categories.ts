// The ten category slugs, in the order api/Varde.Data/Seed/Categories.cs defines them. Slugs
// are stable by contract (they live in shared URLs); display names come from i18n so the
// landing can render its chips without a request. tests/seedDrift.test.ts reads Categories.cs
// and fails if the order or the slugs ever differ.
export const CATEGORY_SLUGS = [
	"okonomi",
	"bolig",
	"psykisk-helse",
	"rus",
	"vold-og-overgrep",
	"familie-og-barn",
	"arbeid",
	"juridisk-hjelp",
	"nodtjenester",
	"lavterskeltilbud",
] as const
export type CategorySlug = (typeof CATEGORY_SLUGS)[number]

// The landing's featured chips, in order. Both lead the browse area: above the grid of eight
// below 1024 px, a column beside it from 1024 px. Nødtjenester keeps the filled acute style,
// Lavterskeltilbud an accent outline (C1 spec, Landing chips). The mega-menu lists all ten from
// CATEGORY_SLUGS and ignores this split.
export const FEATURED_SLUGS = [
	"nodtjenester",
	"lavterskeltilbud",
] as const satisfies readonly CategorySlug[]
export type FeaturedSlug = (typeof FEATURED_SLUGS)[number]

const featured: readonly string[] = FEATURED_SLUGS
export const GRID_SLUGS: CategorySlug[] = CATEGORY_SLUGS.filter((s) => !featured.includes(s))
