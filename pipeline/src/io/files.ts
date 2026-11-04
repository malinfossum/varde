import {
	existsSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	renameSync,
	writeFileSync,
} from "node:fs"
import { dirname, join } from "node:path"

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

// Writes to a temporary file beside the target and renames it into place, so a run that
// stops halfway leaves the old file whole.
export function writeFileAtomic(path: string, data: string): void {
	mkdirSync(dirname(path), { recursive: true })
	const temp = `${path}.${process.pid}.tmp`
	writeFileSync(temp, data)
	renameSync(temp, path)
}

export function writeJsonAtomic(path: string, value: unknown): void {
	writeFileAtomic(path, `${JSON.stringify(value, null, "\t")}\n`)
}
