import { z } from "zod"
import { ADAPTER_NAMES } from "../adapters/types.ts"
import { FieldValue, HttpsUrl, KommuneNumber, MAX_QUOTE, NonBlank, UtcTimestamp } from "./common.ts"
import { QuoteEvidence, RegisterEvidence } from "./lock.ts"

// What extract writes to <cache>/extract/<kommune>.json. Cache data only: it holds page lines,
// so it is never committed, never printed, and has no JSON Schema export. Person names are not
// stored here; verify computes them from the quotes.

// Why a page gave nothing. Counted in the summary; never a value or a URL.
export const PAGE_PROBLEMS = ["cacheMismatch", "noText", "unreadable"] as const
export type PageProblem = (typeof PAGE_PROBLEMS)[number]

// lowThreshold is not a field rule's value: the page's Lavterskel quotes are collected apart,
// and the safety gate's rule decides the badge in verify.
export const EXTRACTED_FIELDS = [
	"name",
	"phone",
	"phoneHours",
	"address",
	"email",
	"website",
	"openingHours",
	"alwaysOpen",
] as const
export type ExtractedField = (typeof EXTRACTED_FIELDS)[number]

export const ExtractedEvidence = z.discriminatedUnion("kind", [RegisterEvidence, QuoteEvidence])
export type ExtractedEvidence = z.infer<typeof ExtractedEvidence>

export const ExtractedCandidate = z.strictObject({
	field: z.enum(EXTRACTED_FIELDS),
	value: FieldValue,
	evidence: ExtractedEvidence,
	origin: z.enum(["unitContact", "unitPage", "register"]),
	role: NonBlank.optional(),
	// The phone order: 1 service phone, 2 a number the kommune publishes with a role, 3 the
	// switchboard.
	rank: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
	// Index into the page's blocks: the shared-page rule reads that block's heading.
	block: z.number().int().nonnegative().optional(),
	// A rule that cannot decide says why, and verify sends the field to review.
	review: NonBlank.optional(),
})
export type ExtractedCandidate = z.infer<typeof ExtractedCandidate>

export const ContactBlock = z.strictObject({
	source: z.enum(["cms", "heading"]),
	// The heading that names the block's service, when there is one above it.
	heading: NonBlank.optional(),
	lines: z.array(z.string()),
})
export type ContactBlock = z.infer<typeof ContactBlock>

export const ExtractedPage = z.strictObject({
	url: HttpsUrl,
	finalUrl: HttpsUrl,
	fetchedAt: UtcTimestamp,
	adapter: z.enum(ADAPTER_NAMES),
	fallback: z.boolean(),
	problem: z.enum(PAGE_PROBLEMS).optional(),
	// From a Nav office page's own data, for matching to a Brreg unit.
	orgNumber: z
		.string()
		.regex(/^\d{9}$/)
		.optional(),
	navOfficeId: NonBlank.optional(),
	blocks: z.array(ContactBlock),
	candidates: z.array(ExtractedCandidate),
	lavterskelQuotes: z.array(NonBlank.max(MAX_QUOTE)),
})
export type ExtractedPage = z.infer<typeof ExtractedPage>

export const ExtractionFile = z.strictObject({
	scope: z.union([KommuneNumber, z.literal("national")]),
	extractedAt: UtcTimestamp,
	pages: z.array(ExtractedPage),
})
export type ExtractionFile = z.infer<typeof ExtractionFile>
