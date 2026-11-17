import { createHash } from "node:crypto"
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

export type RenameIo = {
	rename?: (from: string, to: string) => void
	sleep?: (ms: number) => void
	attempts?: number
	waitMs?: number
}

// Another program can hold a file for a moment on Windows (an editor, a virus scanner).
const RETRYABLE = new Set(["EPERM", "EBUSY", "EACCES"])
const pause = (ms: number) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)

// Renames temp onto path. A busy rename is retried, five attempts 200 ms apart; one that keeps
// failing, or fails for another reason, throws its error with the temporary file kept. The lock,
// curated, page, report and timing writes all go through this one loop.
export function renameRetrying(temp: string, path: string, io: RenameIo = {}): void {
	const rename = io.rename ?? renameSync
	const sleep = io.sleep ?? pause
	const attempts = io.attempts ?? 5
	for (let attempt = 1; ; attempt++) {
		try {
			rename(temp, path)
			return
		} catch (err) {
			const code = (err as { code?: string }).code ?? ""
			if (!RETRYABLE.has(code) || attempt >= attempts) throw err
			sleep(io.waitMs ?? 200)
		}
	}
}

// Writes to a temporary file beside the target and renames it into place, so a run that
// stops halfway leaves the old file whole.
export function writeFileAtomic(path: string, data: string | Uint8Array, io: RenameIo = {}): void {
	mkdirSync(dirname(path), { recursive: true })
	const temp = `${path}.${process.pid}.tmp`
	writeFileSync(temp, data)
	renameRetrying(temp, path, io)
}

export function writeJsonAtomic(path: string, value: unknown): void {
	writeFileAtomic(path, `${JSON.stringify(value, null, "\t")}\n`)
}

// "sha256:<hex>" of a text or a file's bytes, the form lock files and the page cache use.
export function sha256Of(data: string | Uint8Array): string {
	return `sha256:${createHash("sha256").update(data).digest("hex")}`
}
