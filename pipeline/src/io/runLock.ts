import { closeSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { basename, join } from "node:path"

export const RUN_LOCK = "run.lock"

// The message names the lock file by its folder only, never a machine path: Actions logs are public.
export class CacheBusyError extends Error {
	constructor(dir: string) {
		super(
			`another discover, fetch, extract or verify is running on this cache: ${basename(dir)}/${RUN_LOCK} holds its process id. If none is running, delete that file and start again`
		)
		this.name = "CacheBusyError"
	}
}

// Signal 0 checks that a process exists and sends nothing. EPERM means it exists but is not mine.
export function pidAlive(pid: number): boolean {
	try {
		process.kill(pid, 0)
		return true
	} catch (err) {
		return (err as { code?: string }).code === "EPERM"
	}
}

function readPid(path: string): number | undefined {
	try {
		const text = readFileSync(path, "utf8").trim()
		return /^\d{1,10}$/.test(text) && Number(text) > 0 ? Number(text) : undefined
	} catch {
		return undefined
	}
}

// The "wx" flag creates the file only when it does not exist yet, in one step. false: it exists.
function create(path: string): boolean {
	let fd: number
	try {
		fd = openSync(path, "wx")
	} catch (err) {
		if ((err as { code?: string }).code === "EEXIST") return false
		throw err
	}
	writeFileSync(fd, `${process.pid}\n`)
	closeSync(fd)
	return true
}

// One process per cache. Two fetch runs in two terminal tabs would interleave the journal and
// both write manifest.json at the end, so each stage holds run.lock in the cache folder while it
// runs. A lock whose process is gone (a closed tab, a crash) is taken over, and so is one with no
// process id I can read.
export function holdCache(
	dir: string,
	isAlive: (pid: number) => boolean = pidAlive
): { release: () => void } {
	mkdirSync(dir, { recursive: true })
	const path = join(dir, RUN_LOCK)
	if (!create(path)) {
		const pid = readPid(path)
		if (pid !== undefined && isAlive(pid)) throw new CacheBusyError(dir)
		rmSync(path, { force: true })
		// Another process took it over in between: it is busy after all.
		if (!create(path)) throw new CacheBusyError(dir)
	}
	let released = false
	return {
		release: () => {
			if (released) return
			released = true
			rmSync(path, { force: true })
		},
	}
}
