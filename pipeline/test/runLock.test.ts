import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { CacheBusyError, holdCache, pidAlive } from "../src/io/runLock.ts"

// A pages folder inside a fresh temporary folder, so the message names "pages/run.lock".
function pagesDir(): string {
	const dir = join(mkdtempSync(join(tmpdir(), "varde-runlock-")), "pages")
	mkdirSync(dir, { recursive: true })
	return dir
}
const lockOf = (dir: string) => join(dir, "run.lock")

describe("holdCache", () => {
	it("writes run.lock with my process id, and removes it on release", () => {
		const dir = pagesDir()
		const held = holdCache(dir)
		expect(readFileSync(lockOf(dir), "utf8")).toBe(`${process.pid}\n`)
		held.release()
		expect(existsSync(lockOf(dir))).toBe(false)
	})

	it("refuses a second fetch on a held cache, and names the lock file", () => {
		const dir = pagesDir()
		const held = holdCache(dir)
		expect(() => holdCache(dir)).toThrow(CacheBusyError)
		expect(() => holdCache(dir)).toThrow("pages/run.lock")
		expect(() => holdCache(dir)).toThrow("another fetch, extract or verify is running")
		held.release()
	})

	it("refuses a lock whose process is alive, and leaves it as it was", () => {
		const dir = pagesDir()
		writeFileSync(lockOf(dir), "4242\n")
		expect(() => holdCache(dir, (pid) => pid === 4242)).toThrow(CacheBusyError)
		expect(readFileSync(lockOf(dir), "utf8")).toBe("4242\n")
	})

	it("takes over a lock whose process is gone", () => {
		const dir = pagesDir()
		writeFileSync(lockOf(dir), "4242\n")
		const held = holdCache(dir, () => false)
		expect(readFileSync(lockOf(dir), "utf8")).toBe(`${process.pid}\n`)
		held.release()
	})

	it("takes over a lock it cannot read a process id from", () => {
		const dir = pagesDir()
		writeFileSync(lockOf(dir), "Kari Nordmann")
		const held = holdCache(dir, () => true)
		expect(readFileSync(lockOf(dir), "utf8")).toBe(`${process.pid}\n`)
		held.release()
	})

	it("releases once, and never removes a later holder's lock", () => {
		const dir = pagesDir()
		const first = holdCache(dir)
		first.release()
		const second = holdCache(dir)
		first.release()
		expect(existsSync(lockOf(dir))).toBe(true)
		second.release()
		expect(existsSync(lockOf(dir))).toBe(false)
	})

	it("creates the folder when it does not exist yet", () => {
		const dir = join(mkdtempSync(join(tmpdir(), "varde-runlock-")), "ny", "pages")
		const held = holdCache(dir)
		expect(existsSync(lockOf(dir))).toBe(true)
		held.release()
	})
})

describe("pidAlive", () => {
	it("finds my own process alive", () => {
		expect(pidAlive(process.pid)).toBe(true)
	})
})
