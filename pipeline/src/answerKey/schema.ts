import { z } from "zod"
import { CalendarDate, CategorySlug, Cost, KommuneNumber, NonBlank } from "../schema/common.ts"

// The 138 hand-verified rows, frozen once from the live site. Field names follow the lock
// file's, so the scorer compares like with like.
export const KeyFields = z.strictObject({
	phone: z.string().nullable(),
	address: z.string().nullable(),
	email: z.string().nullable(),
	website: z.string().nullable(),
	chatUrl: z.string().nullable(),
	openingHours: z.string().nullable(),
	cost: Cost.nullable(),
	costNote: z.string().nullable(),
	alwaysOpen: z.boolean(),
	lowThreshold: z.boolean(),
})

export const KeyRow = z.strictObject({
	id: z.number().int().positive(),
	kommune: KommuneNumber.nullable(),
	national: z.boolean(),
	servedKommuner: z.array(KommuneNumber),
	parentId: z.number().int().positive().nullable(),
	name: NonBlank,
	nameEn: NonBlank,
	categories: z.array(CategorySlug).min(1),
	fields: KeyFields,
})
export type KeyRow = z.infer<typeof KeyRow>

export const AnswerKey = z.strictObject({
	frozenOn: CalendarDate,
	source: z.url(),
	rows: z.array(KeyRow),
})
export type AnswerKey = z.infer<typeof AnswerKey>
