import type { ProviderType } from "../schema/common.ts"
import { CATEGORY_SLUGS, type CategorySlug } from "../schema/common.ts"
import { foldNorwegian, siteHost } from "../text/normalise.ts"

// Categories a unit gets without my look, and the ones I am only offered. Decided at plan
// review (PR 3 plan, decision 9), checked against the 138-row answer key on 06.11.2026:
// - barnevern 4 of 6 agree; the two barnevernvakt rows also carry nodtjenester and
//   vold-og-overgrep, so barnevernvakt maps to nothing.
// - familievern 5 of 5, gjeldsrådgivning 2 of 2.
// - legevakt: all 4 carry nodtjenester; 3 also psykisk-helse. Automatic, decided 06.11.2026.
// - helsestasjon: both key rows (helsestasjon for ungdom) also carry psykisk-helse, so it goes
//   to review with familie-og-barn as the suggestion (decided 06.11.2026).
// - krisesenter: all 4 key rows carry vold-og-overgrep and nodtjenester (2 also bolig). The code
//   87.999 covers other social housing too, so alone it is a suggestion.
// known: false marks a known service with no one-to-one category: its categories are only my
// suggestion, and the unit goes to review.
export type CategoryRule = { categories: readonly CategorySlug[]; known: boolean }

const KRISESENTER: readonly CategorySlug[] = ["vold-og-overgrep", "nodtjenester"]

export const SN_CATEGORIES: Readonly<Record<string, CategoryRule>> = {
	"86.942": { categories: ["familie-og-barn"], known: false },
	"88.991": { categories: ["familie-og-barn"], known: true },
	"88.992": { categories: ["familie-og-barn"], known: true },
	// Known only beside a krisesenter word: categoriesFor decides.
	"87.999": { categories: KRISESENTER, known: false },
}

// Codes that cover several kinds of service. A unit with one of them goes to review whatever its
// path says: 86.941 is psykisk helse and rus at home, 88.995 Nav and advice, 88.994 rus and
// outreach, 88.996 frivilligsentraler and activity.
export const AMBIGUOUS_CODES: ReadonlySet<string> = new Set([
	"86.941",
	"88.995",
	"88.994",
	"88.996",
])

// Path words, read from the last segment of the path only: a word that starts with the stem.
// The first stem that matches a word wins, so barnevernvakt is tried before barnevern.
export const PATH_CATEGORIES: readonly ({ stem: string } & CategoryRule)[] = [
	{ stem: "barnevernvakt", categories: [], known: false },
	{ stem: "helsestasjon", categories: ["familie-og-barn"], known: false },
	{ stem: "barnevern", categories: ["familie-og-barn"], known: true },
	{ stem: "familievern", categories: ["familie-og-barn"], known: true },
	{ stem: "krisesenter", categories: KRISESENTER, known: true },
	{ stem: "legevakt", categories: ["nodtjenester"], known: true },
	{ stem: "gjeldsradgiv", categories: ["okonomi"], known: true },
]

const LEGEVAKT: CategoryRule = { categories: ["nodtjenester"], known: true }

// The words of a URL's last path segment, folded: "/familie/helsestasjon-for-ungdom/" gives
// helsestasjon, for and ungdom. A parent segment names the section, not the service.
function lastSegmentWords(url: string): string[] {
	try {
		const segments = new URL(url).pathname.split("/").filter((s) => s !== "")
		const last = segments.at(-1)
		return last === undefined
			? []
			: foldNorwegian(decodeURIComponent(last))
					.split(/[^a-z0-9]+/)
					.filter((w) => w !== "")
	} catch {
		return []
	}
}

const ordered = (slugs: Iterable<CategorySlug>) => {
	const set = new Set(slugs)
	return CATEGORY_SLUGS.filter((s) => set.has(s))
}

export function categoriesFor(input: {
	naeringskode?: string
	urls: readonly string[]
	names?: readonly string[]
	nklmLegevakt: boolean
}): {
	categories: CategorySlug[]
	known: boolean
	isKrisesenter: boolean
} {
	const rules: CategoryRule[] = []
	let pathKrisesenter = false
	for (const url of input.urls) {
		for (const word of lastSegmentWords(url)) {
			const hit = PATH_CATEGORIES.find((p) => word.startsWith(p.stem))
			if (hit === undefined) continue
			if (hit.stem === "krisesenter") pathKrisesenter = true
			rules.push(hit)
		}
	}
	const nameKrisesenter = (input.names ?? []).some((n) => foldNorwegian(n).includes("krisesenter"))
	if (nameKrisesenter) rules.push({ categories: KRISESENTER, known: true })
	const code = input.naeringskode
	if (code === "87.999") {
		rules.push({ categories: KRISESENTER, known: pathKrisesenter || nameKrisesenter })
	} else if (code !== undefined) {
		const rule = SN_CATEGORIES[code]
		if (rule !== undefined) rules.push(rule)
	}
	if (input.nklmLegevakt) rules.push(LEGEVAKT)
	// Known only when every source is a known one-to-one rule, they all give the same set, and no
	// ambiguous code stands behind the unit. Otherwise every category found is my suggestion.
	const distinct = new Set(rules.map((r) => ordered(r.categories).join(",")))
	const ambiguous = code !== undefined && AMBIGUOUS_CODES.has(code)
	return {
		categories: ordered(rules.flatMap((r) => r.categories)),
		known: rules.length > 0 && !ambiguous && rules.every((r) => r.known) && distinct.size === 1,
		isKrisesenter: code === "87.999" || pathKrisesenter || nameKrisesenter,
	}
}

const PUBLIC_FORMS: ReadonlySet<string> = new Set([
	"KOMM",
	"ORGL",
	"STAT",
	"IKS",
	"KF",
	"FYLK",
	"SF",
])
const VOLUNTARY_FORMS: ReadonlySet<string> = new Set(["FLI", "STI"])

// The org form first: offentlig for a public form, frivillig for an association (FLI) or a
// foundation (STI). Then the host: offentlig for a page on the kommune's own site or nav.no.
// When the two disagree (an association's page on the kommune's site), I decide. A sub-unit's
// form (BEDR) says nothing, so only the host can speak for it.
export function providerTypeFor(input: {
	orgForm?: string
	urls: readonly string[]
	kommuneHost?: string
}): ProviderType | undefined {
	const form =
		input.orgForm === undefined
			? undefined
			: PUBLIC_FORMS.has(input.orgForm)
				? "offentlig"
				: VOLUNTARY_FORMS.has(input.orgForm)
					? "frivillig"
					: undefined
	const own =
		input.kommuneHost === undefined ? undefined : siteHost(`https://${input.kommuneHost}/`)
	const publicHost = input.urls
		.map(siteHost)
		.some((h) => h !== undefined && (h === own || h === "nav.no"))
	const host = publicHost ? "offentlig" : undefined
	if (form !== undefined && host !== undefined && form !== host) return undefined
	return form ?? host
}
