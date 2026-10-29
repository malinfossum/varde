import { z } from "zod"
import {
	FIELD_NAMES,
	FieldName,
	FieldValue,
	GATE_NAMES,
	GateName,
	HttpsUrl,
	KommuneNumber,
	MAX_QUOTE,
	NonBlank,
	UtcTimestamp,
	valueFitsField,
} from "./common.ts"
import { UnitId } from "./ids.ts"

export const Evidence = z.discriminatedUnion("kind", [
	z.strictObject({
		kind: z.literal("register"),
		register: z.enum(["brreg", "nav", "klass", "nklm", "kartverket"]),
		recordId: NonBlank,
	}),
	z.strictObject({ kind: z.literal("quote"), quotes: z.array(NonBlank.max(MAX_QUOTE)).min(1) }),
])
export type Evidence = z.infer<typeof Evidence>

export const GateResult = z.strictObject({
	gate: GateName,
	pass: z.boolean(),
	onFail: z.enum(["drop", "review"]).optional(),
	reason: NonBlank.optional(),
})
export type GateResult = z.infer<typeof GateResult>

export const LockField = z
	.strictObject({
		status: z.enum(["accepted", "review", "dropped"]),
		value: FieldValue.optional(),
		role: NonBlank.optional(),
		addressId: NonBlank.optional(),
		sourceUrl: HttpsUrl,
		evidence: Evidence.optional(),
		fetchedAt: UtcTimestamp,
		verifiedAt: UtcTimestamp,
		gates: z.array(GateResult),
		reason: NonBlank.optional(),
	})
	.superRefine((field, ctx) => {
		const issue = (message: string) => ctx.addIssue({ code: "custom", message })
		if (field.status === "dropped") {
			// The address id points at a value, so a dropped field may not keep it either.
			if (
				field.value !== undefined ||
				field.evidence !== undefined ||
				field.role !== undefined ||
				field.addressId !== undefined
			) {
				issue("a dropped field keeps no value, evidence, role or address id")
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
	kind: z.enum(["brreg", "nav", "nklm", "page"]),
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

export const LockUnit = z
	.strictObject({
		unitId: UnitId,
		sources: z.array(SourceRef).min(1),
		fields: LockFields,
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
