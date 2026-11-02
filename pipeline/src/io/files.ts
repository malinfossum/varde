import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

export type JsonFile = { file: string; data: unknown; valid: boolean }

// Every .json file in a folder, sorted by name. A missing folder is an empty one. A file
// that does not parse comes back with valid: false; its parse error is dropped, because
// Node's message quotes the file's text.
export function readJsonDir(dir: string): JsonFile[] {
	if (!existsSync(dir)) return []
	return readdirSync(dir)
		.filter((f) => f.endsWith(".json"))
		.sort()
		.map((file) => {
			try {
				return { file, data: JSON.parse(readFileSync(join(dir, file), "utf8")), valid: true }
			} catch {
				return { file, data: undefined, valid: false }
			}
		})
}
