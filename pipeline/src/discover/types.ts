import { z } from "zod"
import { LICENCE_STATUSES } from "../gates/types.ts"
import { HOST_STOPS, SKIP_REASONS } from "../net/crawler.ts"
import { CalendarDate, HttpsUrl, KommuneNumber, NonBlank, UtcTimestamp } from "../schema/common.ts"
import { HOST_KINDS } from "../sources/hosts.ts"
import { CATALOGUE_NAMES } from "./catalogues.ts"

// The files discover writes to <cache>/discover/ and fetch and recall-report read. Unit names
// stay in these files and are never printed.

export const DiscoveredUnit = z.strictObject({
	orgNumber: z.string().regex(/^\d{9}$/),
	name: NonBlank,
	orgForm: NonBlank,
	naeringskode: z.string().optional(),
	address: z.string().optional(),
	kommune: z.string().optional(),
	website: HttpsUrl.optional(),
	parent: z.string().optional(),
	register: z.enum(["enheter", "underenheter"]),
})
export type DiscoveredUnit = z.infer<typeof DiscoveredUnit>

export const DiscoveredPage = z.strictObject({
	url: HttpsUrl,
	from: z.enum(["sitemap", "brreg", "nav", "catalogue"]),
	catalogue: z.enum(CATALOGUE_NAMES).optional(),
	lastmod: z.string().optional(),
})
export type DiscoveredPage = z.infer<typeof DiscoveredPage>

const Count = z.number().int().nonnegative()

export const SiteSummary = z.strictObject({
	host: NonBlank,
	sitemap: z.enum(["robots", "probe", "none"]),
	sitemapUrls: Count,
	servicePages: Count,
	kept: Count,
	truncated: z.boolean(),
})

export const KommuneDiscovery = z.strictObject({
	kommune: KommuneNumber,
	name: NonBlank,
	discoveredAt: UtcTimestamp,
	site: SiteSummary.optional(),
	// The kommune's own switchboard from its Brreg record (rank 3 of the phone order). Optional,
	// so a discovery file written before PR 3 still parses.
	switchboard: z
		.strictObject({ phone: NonBlank, orgNumber: z.string().regex(/^\d{9}$/) })
		.optional(),
	brregComplete: z.boolean(),
	allSitemapUrls: z.array(z.string()),
	units: z.array(DiscoveredUnit),
	pages: z.array(DiscoveredPage),
})
export type KommuneDiscovery = z.infer<typeof KommuneDiscovery>

export const NationalDiscovery = z.strictObject({
	discoveredAt: UtcTimestamp,
	pages: z.array(DiscoveredPage),
	catalogues: z.array(
		z.strictObject({
			name: z.enum(CATALOGUE_NAMES),
			rows: Count,
			findings: Count,
			complete: z.boolean(),
		})
	),
	navOffices: Count,
})
export type NationalDiscovery = z.infer<typeof NationalDiscovery>

export const DiscoverReport = z.strictObject({
	ranAt: UtcTimestamp,
	date: CalendarDate,
	only: z.array(z.string()),
	kommuner: z.array(KommuneNumber),
	renumberings: z.array(
		z.strictObject({
			oldCode: z.string(),
			oldName: z.string(),
			newCode: z.string(),
			newName: z.string(),
			changeOccurred: z.string(),
		})
	),
	nameMismatches: z.array(z.string()),
	problems: z.array(z.string()),
	hosts: z.array(
		z.strictObject({ host: NonBlank, requests: Count, stopped: z.enum(HOST_STOPS).optional() })
	),
	notFetched: z.array(
		z.strictObject({
			ok: z.literal(false),
			url: z.string(),
			reason: z.enum(SKIP_REASONS),
			status: z.number().int().optional(),
			contentType: z.string().optional(),
		})
	),
})
export type DiscoverReport = z.infer<typeof DiscoverReport>

export const HostFile = z.array(
	z.strictObject({
		host: NonBlank,
		kind: z.enum(HOST_KINDS),
		licence: z.enum(LICENCE_STATUSES),
	})
)
