// The nine category slugs, in the order api/Varde.Data/Seed/Categories.cs defines them. Slugs
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
] as const
export type CategorySlug = (typeof CATEGORY_SLUGS)[number]
