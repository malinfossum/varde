import { z } from "zod"
import { CuratedFile } from "./curated.ts"
import { LockFile } from "./lock.ts"
import { DescriptionDraft, Extraction } from "./model.ts"

const SCHEMAS = {
	curated: CuratedFile,
	lock: LockFile,
	extraction: Extraction,
	description: DescriptionDraft,
} as const

export type SchemaName = keyof typeof SCHEMAS
export const SCHEMA_NAMES = Object.keys(SCHEMAS) as SchemaName[]

// Refinements (unique ids, the dropped-field rule) do not survive the export; CI runs the
// Zod schemas themselves, the JSON Schemas are for editors and the model.
export function jsonSchemas(): Record<SchemaName, unknown> {
	const out = {} as Record<SchemaName, unknown>
	for (const name of SCHEMA_NAMES) out[name] = z.toJSONSchema(SCHEMAS[name], { io: "input" })
	return out
}

export function schemaFileText(schema: unknown): string {
	return `${JSON.stringify(schema, null, "\t")}\n`
}
