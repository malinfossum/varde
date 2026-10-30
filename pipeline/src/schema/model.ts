import { z } from "zod"
import { FieldName } from "./common.ts"

// What the model answers in PR 3. No min, max or format here: structured outputs accept a
// subset of JSON Schema, and the gates check every value afterwards anyway.
export const Extraction = z.strictObject({
	fields: z.array(
		z.strictObject({
			field: FieldName.exclude(["lowThreshold"]),
			value: z.string(),
			quote: z.string(),
		})
	),
	referralQuotes: z.array(z.string()),
})
export type Extraction = z.infer<typeof Extraction>

export const DescriptionDraft = z.strictObject({ nb: z.string(), en: z.string() })
export type DescriptionDraft = z.infer<typeof DescriptionDraft>
