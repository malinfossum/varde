import { z } from "zod"

// KLASS classification 131 numbers are four digits as text, so Oslo stays "0301".
export const KommuneNumber = z.string().regex(/^\d{4}$/)
// UTC only: Zod's iso.datetime() refuses offsets unless asked to allow them.
export const UtcTimestamp = z.iso.datetime()
export const CalendarDate = z.iso.date()
export const HttpsUrl = z.url({ protocol: /^https$/ })
export const NonBlank = z.string().regex(/\S/)
// A quote longer than this would ground anything on the page and carry staff names along.
export const MAX_QUOTE = 400

// Category ids 1 to 10, in id order, as the site's categories.nb.json lists them.
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
export const CategorySlug = z.enum(CATEGORY_SLUGS)
export type CategorySlug = z.infer<typeof CategorySlug>

export const ProviderType = z.enum(["offentlig", "frivillig"])
export const Cost = z.enum(["free", "paid", "partly"])
export type Cost = z.infer<typeof Cost>

export const FIELD_NAMES = [
	"name",
	"phone",
	"phoneHours",
	"address",
	"email",
	"website",
	"chatUrl",
	"openingHours",
	"cost",
	"costNote",
	"alwaysOpen",
	"lowThreshold",
] as const
export const FieldName = z.enum(FIELD_NAMES)
export type FieldName = z.infer<typeof FieldName>

export const FieldValue = z.union([NonBlank, z.boolean()])
export type FieldValue = z.infer<typeof FieldValue>

const BOOLEAN_FIELDS: ReadonlySet<FieldName> = new Set(["alwaysOpen", "lowThreshold"])

export function valueFitsField(field: FieldName, value: FieldValue): boolean {
	if (BOOLEAN_FIELDS.has(field)) return typeof value === "boolean"
	if (field === "cost") return Cost.safeParse(value).success
	return typeof value === "string" && /\S/.test(value)
}

export const GATE_NAMES = ["source", "grounding", "validity", "agreement", "safety"] as const
export const GateName = z.enum(GATE_NAMES)
export type GateName = z.infer<typeof GateName>
