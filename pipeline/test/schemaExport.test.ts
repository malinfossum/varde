import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { jsonSchemas, SCHEMA_NAMES, schemaFileText } from "../src/schema/export.ts"

// Every node that describes an object, anywhere in the schema tree, that is not closed.
function openObjects(node: unknown, path = "#"): string[] {
	if (Array.isArray(node)) return node.flatMap((item, i) => openObjects(item, `${path}/${i}`))
	if (node === null || typeof node !== "object") return []
	const record = node as Record<string, unknown>
	const isObject = record.type === "object" || "properties" in record
	const open = isObject && record.additionalProperties !== false ? [path] : []
	return open.concat(
		Object.entries(record).flatMap(([key, child]) => openObjects(child, `${path}/${key}`))
	)
}

describe("committed JSON Schemas", () => {
	const schemas = jsonSchemas()

	for (const name of SCHEMA_NAMES) {
		it(`schema/${name}.schema.json matches the Zod schema (run npm run schema)`, () => {
			const file = readFileSync(new URL(`../schema/${name}.schema.json`, import.meta.url), "utf8")
			expect(file).toBe(schemaFileText(schemas[name]))
		})

		it(`${name} closes every object, as structured outputs need`, () => {
			expect(openObjects(schemas[name])).toEqual([])
		})
	}

	it("the closure check does see an open object", () => {
		const open = {
			type: "object",
			properties: { a: { type: "object", additionalProperties: false } },
		}
		expect(openObjects(open)).toEqual(["#"])
	})
})
