// Rewrites pipeline/schema/*.schema.json from the Zod schemas. Run after any schema change.
import { mkdirSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { jsonSchemas, SCHEMA_NAMES, schemaFileText } from "../schema/export.ts"

const dir = fileURLToPath(new URL("../../schema/", import.meta.url))
mkdirSync(dir, { recursive: true })
const schemas = jsonSchemas()
for (const name of SCHEMA_NAMES) {
	writeFileSync(`${dir}${name}.schema.json`, schemaFileText(schemas[name]))
	console.log(`wrote schema/${name}.schema.json`)
}
