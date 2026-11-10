import { z } from "zod"
import {
	CalendarDate,
	CategorySlug,
	FIELD_NAMES,
	FieldName,
	FieldValue,
	GATE_NAMES,
	GateName,
	HttpsUrl,
	KommuneNumber,
	MAX_QUOTE,
	NonBlank,
	ProviderType,
	REGISTERS,
	Register,
	UtcTimestamp,
	valueFitsField,
} from "./common.ts"
import { UnitId } from "./ids.ts"

export const RegisterEvidence = z.strictObject({
	kind: z.literal("register"),
	register: Register,
	recordId: NonBlank,
})
export const QuoteEvidence = z.strictObject({
	kind: z.literal("quote"),
	quotes: z.array(NonBlank.max(MAX_QUOTE)).min(1),
})
// My answer in review. It keeps the evidence the page or register gave, so safety and redaction
// still read the page's quotes, and a register value I reviewed keeps its record id.
export const DecisionEvidence = z.strictObject({
	kind: z.literal("decision"),
	decidedOn: CalendarDate,
	original: z.discriminatedUnion("kind", [RegisterEvidence, QuoteEvidence]),
})
export const Evidence = z.discriminatedUnion("kind", [
	RegisterEvidence,
	QuoteEvidence,
	DecisionEvidence,
])
export type Evidence = z.infer<typeof Evidence>

// The page quotes behind a value: a quote's own, a decision's original ones, none for a register.
export function evidenceQuotes(e: Evidence): readonly string[] {
	if (e.kind === "quote") return e.quotes
	if (e.kind === "decision" && e.original.kind === "quote") return e.original.quotes
	return []
}

export const GateResult = z.strictObject({
	gate: GateName,
	pass: z.boolean(),
	onFail: z.enum(["drop", "review"]).optional(),
	reason: NonBlank.optional(),
})
export type GateResult = z.infer<typeof GateResult>

// Where a value was found. gates/types.ts reads its Origin type from here.
// register: a register record. unitContact: the unit's own contact block on its own page.
// unitPage: elsewhere on the unit's own page. staffList, article, jsonLdAuthor: a staff list, an
// article or a JSON-LD author on a page.
export const ORIGINS = [
	"register",
	"unitContact",
	"unitPage",
	"staffList",
	"article",
	"jsonLdAuthor",
] as const

export const LockField = z
	.strictObject({
		status: z.enum(["accepted", "review", "dropped"]),
		value: FieldValue.optional(),
		role: NonBlank.optional(),
		// The origin verify used, so review checks my edit the way verify will (Task 18).
		origin: z.enum(ORIGINS).optional(),
		addressId: NonBlank.optional(),
		sourceUrl: HttpsUrl,
		evidence: Evidence.optional(),
		fetchedAt: UtcTimestamp,
		verifiedAt: UtcTimestamp,
		// runGates writes all five results on every field, whatever its status.
		gates: z.array(GateResult).length(GATE_NAMES.length),
		reason: NonBlank.optional(),
	})
	.superRefine((field, ctx) => {
		const issue = (message: string) => ctx.addIssue({ code: "custom", message })
		if (new Set(field.gates.map((g) => g.gate)).size !== GATE_NAMES.length) {
			issue("a field needs one result for each of the five gates")
		}
		if (field.status === "dropped") {
			// The address id points at a value, so a dropped field may not keep it either.
			if (
				field.value !== undefined ||
				field.evidence !== undefined ||
				field.role !== undefined ||
				field.origin !== undefined ||
				field.addressId !== undefined
			) {
				issue("a dropped field keeps no value, evidence, role, origin or address id")
			}
			if (field.reason === undefined) issue("a dropped field needs its reason")
			return
		}
		if (field.value === undefined || field.evidence === undefined) {
			issue("an accepted or review field needs its value and evidence")
		}
		if (field.status === "review" && field.reason === undefined) {
			issue("a review field needs its reason")
		}
		if (field.status === "accepted") {
			const passed = new Set(field.gates.filter((g) => g.pass).map((g) => g.gate))
			if (passed.size !== GATE_NAMES.length || field.gates.some((g) => !g.pass)) {
				issue("an accepted field needs all five gates passed")
			}
		}
	})
export type LockField = z.infer<typeof LockField>

export const SourceRef = z.strictObject({
	kind: z.enum([...REGISTERS, "page"]),
	ref: NonBlank,
})

// A strict object with one optional key per field, not a record: it types as
// Partial<Record<FieldName, LockField>> and exports as a closed object with a named property
// per field, where a record exports with an open additionalProperties.
const LockFields = z.strictObject(
	Object.fromEntries(FIELD_NAMES.map((name) => [name, LockField.optional()])) as Record<
		FieldName,
		z.ZodOptional<typeof LockField>
	>
)

// "Include this unit?" A clear match is auto (verify writes include: true to the curated file);
// anything else waits for my answer in review. Reasons never hold a value or a name.
export const Inclusion = z
	.strictObject({
		status: z.enum(["auto", "review"]),
		reason: NonBlank,
		suggestedCategories: z.array(CategorySlug),
		providerType: ProviderType.optional(),
	})
	.superRefine((inc, ctx) => {
		// An auto inclusion becomes a curated unit, which needs both (CuratedUnit refuses either gap).
		if (
			inc.status === "auto" &&
			(inc.suggestedCategories.length === 0 || inc.providerType === undefined)
		) {
			ctx.addIssue({
				code: "custom",
				message: "an auto inclusion needs a category and a provider type",
			})
		}
	})
export type Inclusion = z.infer<typeof Inclusion>

export const LockUnit = z
	.strictObject({
		unitId: UnitId,
		sources: z.array(SourceRef).min(1),
		fields: LockFields,
		inclusion: Inclusion.optional(),
	})
	.superRefine((unit, ctx) => {
		for (const name of FieldName.options) {
			const field = unit.fields[name]
			if (field?.value !== undefined && !valueFitsField(name, field.value)) {
				ctx.addIssue({ code: "custom", path: ["fields", name], message: "wrong value kind" })
			}
		}
	})
export type LockUnit = z.infer<typeof LockUnit>

// No file-level timestamp: the refresh-only check allows only verifiedAt and fetchedAt to move.
export const LockFile = z
	.strictObject({
		$schema: z.string().optional(),
		kommune: KommuneNumber,
		units: z.array(LockUnit),
	})
	.superRefine((file, ctx) => {
		const ids = file.units.map((u) => u.unitId)
		if (new Set(ids).size !== ids.length) {
			ctx.addIssue({ code: "custom", path: ["units"], message: "unit ids must be unique" })
		}
	})
export type LockFile = z.infer<typeof LockFile>
