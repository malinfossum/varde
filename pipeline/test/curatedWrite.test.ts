import { existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import {
	CuratedWriteError,
	DataBusyError,
	holdDataDir,
	isRepoData,
	SaveError,
	writeCuratedFile,
	writeLockFile,
} from "../src/curate/write.ts"
import type { CuratedFile } from "../src/schema/curated.ts"
import { curatedUnit, lockUnit } from "./helpers.ts"

const file: CuratedFile = { kommune: "3405", name: "Lillehammer", units: [curatedUnit()] }
const busy = () => Object.assign(new Error("busy"), { code: "EBUSY" })
const noWait = async () => {}

describe("writeCuratedFile", () => {
	it("writes the file whole, through a temporary file", async () => {
		const path = join(
			mkdtempSync(join(tmpdir(), "varde-curated-")),
			"curated",
			"3405-lillehammer.json"
		)
		await writeCuratedFile(path, file)
		expect(JSON.parse(readFileSync(path, "utf8"))).toEqual(file)
	})

	it("retries a rename that fails once, as on Windows when a scanner holds the file", async () => {
		const path = join(mkdtempSync(join(tmpdir(), "varde-curated-")), "3405-lillehammer.json")
		let calls = 0
		const rename = (from: string, to: string) => {
			calls++
			if (calls === 1) throw busy()
			renameSync(from, to)
		}
		await writeCuratedFile(path, file, { rename, sleep: noWait })
		expect(calls).toBe(2)
		expect(existsSync(path)).toBe(true)
	})

	it("stops with a clear message and keeps the temporary file when the rename keeps failing", async () => {
		const path = join(mkdtempSync(join(tmpdir(), "varde-curated-")), "3405-lillehammer.json")
		const err = await writeCuratedFile(path, file, {
			rename: () => {
				throw busy()
			},
			sleep: noWait,
		}).catch((e) => e)
		expect(err).toBeInstanceOf(CuratedWriteError)
		expect(existsSync((err as CuratedWriteError).tempPath)).toBe(true)
		expect(existsSync(path)).toBe(false)
		expect(String(err.message)).toContain("kept")
	})

	it("refuses a file that does not match its schema, and writes nothing", async () => {
		const path = join(mkdtempSync(join(tmpdir(), "varde-curated-")), "3405-lillehammer.json")
		const bad = { ...file, units: [curatedUnit({ include: true, categories: [] })] }
		await expect(writeCuratedFile(path, bad)).rejects.toThrow("does not match its schema")
		expect(existsSync(path)).toBe(false)
	})
})

describe("writeLockFile", () => {
	it("retries a busy rename too, and keeps the temporary file when it keeps failing", async () => {
		const path = join(mkdtempSync(join(tmpdir(), "varde-lock-")), "lock", "3405.json")
		const lock = { kommune: "3405", units: [lockUnit()] }
		let calls = 0
		await writeLockFile(path, lock, {
			rename: (from, to) => {
				calls++
				if (calls === 1) throw busy()
				renameSync(from, to)
			},
			sleep: noWait,
		})
		expect(JSON.parse(readFileSync(path, "utf8")).kommune).toBe("3405")
		const err = await writeLockFile(path, lock, {
			rename: () => {
				throw busy()
			},
			sleep: noWait,
		}).catch((e) => e)
		expect(err).toBeInstanceOf(SaveError)
		expect(String(err.message)).toContain("the lock file")
	})
})

describe("holdDataDir", () => {
	it("lets one command at a time write into the data folder, and frees it on release", () => {
		const dir = mkdtempSync(join(tmpdir(), "varde-data-"))
		const held = holdDataDir(dir)
		expect(existsSync(join(dir, ".pipeline.lock"))).toBe(true)
		expect(() => holdDataDir(dir)).toThrow(DataBusyError)
		held.release()
		expect(existsSync(join(dir, ".pipeline.lock"))).toBe(false)
		holdDataDir(dir).release()
	})
})

describe("isRepoData", () => {
	const repo = join(tmpdir(), "varde-repo", "data")
	it("knows the repo's data folder in any spelling, and every folder inside it", () => {
		mkdirSync(join(repo, "curated"), { recursive: true })
		expect(isRepoData(repo, repo)).toBe(true)
		expect(isRepoData(`${repo}/`, repo)).toBe(true)
		expect(isRepoData(join(repo, "curated"), repo)).toBe(true)
		expect(isRepoData(repo.toUpperCase(), repo, "win32")).toBe(true)
		expect(isRepoData(join(repo, "..", "annet"), repo)).toBe(false)
		expect(isRepoData(join(repo, "..x"), repo)).toBe(true)
		expect(isRepoData(join(repo, ".."), repo)).toBe(false)
	})
})
