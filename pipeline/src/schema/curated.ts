import { z } from "zod"
import { comparable } from "../gates/compare.ts"
import {
	CalendarDate,
	CategorySlug,
	FieldName,
	FieldValue,
	HttpsUrl,
	KommuneNumber,
	MAX_QUOTE,
	NonBlank,
	ProviderType,
	valueFitsField,
} from "./common.ts"
import { UnitId } from "./ids.ts"

// One answer of mine per question, so the review command never asks twice. A question is one
// value for one field from one page, so the key (field, value, sourceUrl) stays the page's
// value; an edit stores mine in editedValue.
export const ReviewDecision = z
	.strictObject({
		field: FieldName,
		value: FieldValue,
		sourceUrl: HttpsUrl,
		decision: z.enum(["accept", "reject", "edit"]),
		editedValue: FieldValue.optional(),
		role: NonBlank.optional(),
		decidedOn: CalendarDate,
		note: NonBlank.optional(),
	})
	.superRefine((d, ctx) => {
		const issue = (message: string) => ctx.addIssue({ code: "custom", message })
		if (d.decision === "edit" && d.editedValue === undefined)
			issue("an edit needs its edited value")
		if (d.decision !== "edit" && (d.editedValue !== undefined || d.role !== undefined)) {
			issue("only an edit carries an edited value or a role")
		}
		// A value of the wrong kind would make every verify write a lock file LockUnit refuses.
		if (!valueFitsField(d.field, d.value)) issue("the value does not fit the field")
		if (d.editedValue !== undefined && !valueFitsField(d.field, d.editedValue)) {
			issue("the edited value does not fit the field")
		}
	})
export type ReviewDecision = z.infer<typeof ReviewDecision>

// My answer to this question, if I gave one. Values compare as the gates compare them, so
// "62000000" and "62 00 00 00" are one question.
export function findDecision(
	decisions: readonly ReviewDecision[],
	q: { field: z.infer<typeof FieldName>; value: z.infer<typeof FieldValue>; sourceUrl: string }
): ReviewDecision | undefined {
	const wanted = comparable(q.field, q.value)
	return decisions.find(
		(d) =>
			d.field === q.field && d.sourceUrl === q.sourceUrl && comparable(d.field, d.value) === wanted
	)
}

export const CuratedUnit = z
	.strictObject({
		unitId: UnitId,
		name: NonBlank,
		include: z.boolean(),
		excludeReason: NonBlank.optional(),
		sources: z.strictObject({
			orgNumber: z
				.string()
				.regex(/^\d{9}$/)
				.optional(),
			navOfficeId: NonBlank.optional(),
			pages: z.array(HttpsUrl),
		}),
		categories: z.array(CategorySlug),
		providerType: ProviderType,
		lowThreshold: z
			.strictObject({
				value: z.boolean(),
				quotes: z.array(NonBlank.max(MAX_QUOTE)).min(1),
				decidedBy: z.enum(["rule", "me"]),
			})
			.optional(),
		description: z
			.strictObject({ nb: NonBlank, en: NonBlank, source: z.enum(["ai", "human"]) })
			.optional(),
		decisions: z.array(ReviewDecision),
		recheckAfter: CalendarDate.optional(),
	})
	.superRefine((unit, ctx) => {
		const issue = (message: string) => ctx.addIssue({ code: "custom", message })
		if (!unit.include && unit.excludeReason === undefined) issue("a left-out unit needs a reason")
		if (unit.include && unit.categories.length === 0) issue("an included unit needs a category")
		if (new Set(unit.categories).size !== unit.categories.length) issue("categories repeat")
	})
export type CuratedUnit = z.infer<typeof CuratedUnit>

export const CuratedFile = z
	.strictObject({
		$schema: z.string().optional(),
		kommune: KommuneNumber,
		name: NonBlank,
		units: z.array(CuratedUnit),
	})
	.superRefine((file, ctx) => {
		const ids = file.units.map((u) => u.unitId)
		if (new Set(ids).size !== ids.length) {
			ctx.addIssue({ code: "custom", path: ["units"], message: "unit ids must be unique" })
		}
	})
export type CuratedFile = z.infer<typeof CuratedFile>
