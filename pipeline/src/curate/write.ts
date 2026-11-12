import {
	closeSync,
	existsSync,
	mkdirSync,
	openSync,
	realpathSync,
	renameSync,
	rmSync,
	writeFileSync,
} from "node:fs"
import { dirname, join, relative, resolve } from "node:path"
import { CuratedFile } from "../schema/curated.ts"
import { LockFile } from "../schema/lock.ts"

export type RenameIo = {
	rename?: (from: string, to: string) => void
	sleep?: (ms: number) => Promise<void>
	attempts?: number
	waitMs?: number
}

// A file that could not be renamed into place. The temporary file is kept, so nothing is lost.
export class SaveError extends Error {
	readonly tempPath: string

	constructor(message: string, tempPath: string) {
		super(message)
		this.name = "SaveError"
		this.tempPath = tempPath
	}
}

export class CuratedWriteError extends SaveError {
	constructor(tempPath: string) {
		super(`could not save the curated file; my answers are kept in ${tempPath}`, tempPath)
		this.name = "CuratedWriteError"
	}
}

// Another program can hold a file for a moment on Windows (an editor, a virus scanner).
const RETRYABLE = new Set(["EPERM", "EBUSY", "EACCES"])
const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// One file, whole: written to a temporary file, then renamed over the old one, so a crash
// mid-write leaves the old file whole. A busy rename is retried; one that keeps failing stops
// with the temporary file kept.
async function saveWhole(
	path: string,
	text: string,
	io: RenameIo,
	fail: (temp: string) => SaveError
): Promise<void> {
	const rename = io.rename ?? renameSync
	const sleep = io.sleep ?? pause
	const attempts = io.attempts ?? 5
	mkdirSync(dirname(path), { recursive: true })
	const temp = `${path}.${process.pid}.tmp`
	writeFileSync(temp, text)
	for (let attempt = 1; ; attempt++) {
		try {
			rename(temp, path)
			return
		} catch (err) {
			const code = (err as { code?: string }).code ?? ""
			if (!RETRYABLE.has(code) || attempt >= attempts) throw fail(temp)
			await sleep(io.waitMs ?? 200)
		}
	}
}

// Each answer is written at once, checked against the schema first.
export async function writeCuratedFile(
	path: string,
	file: CuratedFile,
	io: RenameIo = {}
): Promise<void> {
	const parsed = CuratedFile.safeParse(file)
	if (!parsed.success)
		throw new Error("the curated file does not match its schema: nothing was written")
	await saveWhole(
		path,
		`${JSON.stringify(parsed.data, null, "\t")}\n`,
		io,
		(temp) => new CuratedWriteError(temp)
	)
}

// The lock file gets the same retry: Windows holds it as readily as the curated file.
export async function writeLockFile(
	path: string,
	file: LockFile,
	io: RenameIo = {}
): Promise<void> {
	const parsed = LockFile.safeParse(file)
	if (!parsed.success)
		throw new Error("the lock file does not match its schema: nothing was written")
	const fail = (temp: string) =>
		new SaveError(`could not save the lock file; it is kept in ${temp}`, temp)
	await saveWhole(path, `${JSON.stringify(parsed.data, null, "\t")}\n`, io, fail)
}

export class DataBusyError extends Error {
	constructor() {
		super(
			"another verify or review is using this data folder. If none is running, delete .pipeline.lock in it and start again"
		)
		this.name = "DataBusyError"
	}
}

// One writer at a time in a data folder. verify and review each read the curated file and later
// write it whole, so two at once would lose my answers. The "wx" flag creates the file only when it
// does not exist yet, in one step.
export function holdDataDir(dataDir: string): { release: () => void } {
	mkdirSync(dataDir, { recursive: true })
	const path = join(dataDir, ".pipeline.lock")
	let fd: number
	try {
		fd = openSync(path, "wx")
	} catch (err) {
		if ((err as { code?: string }).code === "EEXIST") throw new DataBusyError()
		throw err
	}
	writeFileSync(fd, `${process.pid}\n`)
	closeSync(fd)
	let released = false
	return {
		release: () => {
			if (released) return
			released = true
			rmSync(path, { force: true })
		},
	}
}

// The real path when the folder exists, so a junction or a short name resolves the same way.
const real = (path: string) => (existsSync(path) ? realpathSync.native(path) : resolve(path))

// True for the repo's own data/ and every folder inside it, in any spelling: Windows paths ignore
// case, a trailing slash or "x/.." changes nothing, and a junction resolves to its target.
export function isRepoData(
	dataDir: string,
	repoData: string,
	platform: NodeJS.Platform = process.platform
): boolean {
	const fold = (p: string) => (platform === "win32" ? p.toLowerCase() : p)
	const rel = relative(fold(real(repoData)), fold(real(dataDir)))
	// ".." alone or followed by a separator leaves data/; a folder named "..x" inside it does not.
	const outside = rel === ".." || rel.startsWith("../") || rel.startsWith("..\\")
	return rel === "" || (!outside && !rel.startsWith("/") && !/^[a-z]:/i.test(rel))
}
