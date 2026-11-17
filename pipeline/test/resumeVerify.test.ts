import { readFileSync, utimesSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"
import { curatedText, writeCuratedFile } from "../src/curate/write.ts"
import { extractionPath, readExtraction } from "../src/extract/extract.ts"
import { writeJsonAtomic } from "../src/io/files.ts"
import { fetchSettled, writeFailedLock } from "../src/verify/failed.ts"
import { canSkip, lockInputs, sha256File, splitResume } from "../src/verify/resume.ts"
import { RULES_VERSION } from "../src/verify/rules.ts"
import {
	findCuratedPath,
	lockPath,
	readCuratedFile,
	verifyAndWrite,
	verifyEach,
} from "../src/verify/verify.ts"
import { BV, NOW, UNIT_PAGE, unit, verifySetup } from "./verifyHelpers.ts"

const LATER = "2026-11-07T10:00:00Z"
type Setup = ReturnType<typeof verifySetup>

const where = (s: Setup) => ({ cacheDir: s.cacheDir, dataDir: s.dataDir })
const lockBytes = (s: Setup) => readFileSync(lockPath(s.dataDir, "3405"))
const curatedAt = (s: Setup) => findCuratedPath(s.dataDir, "3405") ?? ""
// A lock file newer than everything else, as a checkout or a copy leaves it.
const touchAhead = (path: string) => {
	const ahead = new Date(Date.now() + 86_400_000)
	utimesSync(path, ahead, ahead)
}

async function verified(): Promise<Setup> {
	const s = verifySetup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
	await verifyAndWrite(s.dataDir, s.input, lockInputs({ ...where(s), kommune: "3405" }))
	return s
}

// One resumed run, as the verify CLI runs it: split the kommuner, then verify the ones left from
// the files on disk, a day later.
async function resume(s: Setup, nklmDate?: string) {
	const o = { ...where(s), ...(nklmDate === undefined ? {} : { nklmDate }) }
	const { todo, skipped } = splitResume([s.input.kommune], o)
	const { unfinished } = await verifyEach(todo, async (k) => {
		const extraction = readExtraction(s.cacheDir, k.kommune)
		if (extraction === undefined) return undefined
		const at = findCuratedPath(s.dataDir, k.kommune)
		const input = {
			...s.input,
			extraction,
			now: LATER,
			...(at === undefined ? {} : { curated: readCuratedFile(at, k.kommune) }),
		}
		return verifyAndWrite(s.dataDir, input, lockInputs({ ...o, kommune: k.kommune }))
	})
	expect(unfinished).toEqual([])
	return { todo: todo.map((k) => k.kommune), skipped: skipped.map((k) => k.kommune) }
}

describe("lockInputs", () => {
	it("hashes the kommune's extraction file and records the rules version", () => {
		const s = verifySetup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		const inputs = lockInputs({ ...where(s), kommune: "3405" })
		expect(inputs).toEqual({
			extraction: sha256File(extractionPath(s.cacheDir, "3405")),
			rules: RULES_VERSION,
		})
		expect(inputs.extraction).toMatch(/^sha256:[0-9a-f]{64}$/)
	})

	it("adds the national file, the curated file and the NKLM edition when there are any", async () => {
		const s = verifySetup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		writeJsonAtomic(extractionPath(s.cacheDir, "national"), {
			scope: "national",
			extractedAt: NOW,
			pages: [],
		})
		const curated = join(s.dataDir, "curated", "3405-lillehammer.json")
		await writeCuratedFile(curated, { kommune: "3405", name: "Lillehammer", units: [] })
		expect(lockInputs({ ...where(s), kommune: "3405", nklmDate: "2026-11-01" })).toEqual({
			extraction: sha256File(extractionPath(s.cacheDir, "3405")),
			national: sha256File(extractionPath(s.cacheDir, "national")),
			curated: sha256File(curated),
			nklm: "2026-11-01",
			rules: RULES_VERSION,
		})
	})

	it("names the kommune when its extraction file is missing", () => {
		const s = verifySetup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		expect(() => lockInputs({ ...where(s), kommune: "3407" })).toThrow(
			"3407: no extraction file (run extract first)"
		)
	})
})

describe("verifyAndWrite and the lock's inputs", () => {
	it("records the curated file's hash exactly as it saved the file, so a resume right after skips", async () => {
		const s = await verified()
		const lock = JSON.parse(readFileSync(lockPath(s.dataDir, "3405"), "utf8"))
		expect(lock.inputs).toEqual({
			extraction: sha256File(extractionPath(s.cacheDir, "3405")),
			curated: sha256File(curatedAt(s)),
			rules: RULES_VERSION,
		})
		expect(readFileSync(curatedAt(s), "utf8")).toBe(
			curatedText(readCuratedFile(curatedAt(s), "3405"))
		)
		expect(canSkip(s.dataDir, "3405", lockInputs({ ...where(s), kommune: "3405" }))).toBe(true)
	})
})

describe("verify --resume", () => {
	it("leaves a finished kommune byte for byte the same", async () => {
		const s = await verified()
		const lock = lockBytes(s)
		const curated = readFileSync(curatedAt(s))
		expect(await resume(s)).toEqual({ todo: [], skipped: ["3405"] })
		expect(lockBytes(s)).toEqual(lock)
		expect(readFileSync(curatedAt(s))).toEqual(curated)
	})

	it("would change the lock on a plain re-run, so the skip is what keeps it the same", async () => {
		const s = await verified()
		const before = lockBytes(s)
		await verifyAndWrite(
			s.dataDir,
			{ ...s.input, now: LATER },
			lockInputs({ ...where(s), kommune: "3405" })
		)
		expect(lockBytes(s)).not.toEqual(before)
	})

	it("re-runs a kommune whose extraction file changed, even when its lock file is newer", async () => {
		const s = await verified()
		const path = extractionPath(s.cacheDir, "3405")
		writeJsonAtomic(path, { ...JSON.parse(readFileSync(path, "utf8")), extractedAt: LATER })
		touchAhead(lockPath(s.dataDir, "3405"))
		const before = lockBytes(s)
		expect(await resume(s)).toEqual({ todo: ["3405"], skipped: [] })
		expect(lockBytes(s)).not.toEqual(before)
	})

	it("re-runs a kommune whose lock was written under another RULES_VERSION, even when it is newer", async () => {
		const s = await verified()
		const at = lockPath(s.dataDir, "3405")
		const lock = JSON.parse(readFileSync(at, "utf8"))
		const other = { ...lock, inputs: { ...lock.inputs, rules: RULES_VERSION + 1 } }
		writeFileSync(at, `${JSON.stringify(other, null, "\t")}\n`)
		touchAhead(at)
		expect(await resume(s)).toEqual({ todo: ["3405"], skipped: [] })
		expect(JSON.parse(readFileSync(at, "utf8")).inputs.rules).toBe(RULES_VERSION)
	})

	it("re-runs a kommune after review saved my answer in its curated file", async () => {
		const s = await verified()
		const curated = readCuratedFile(curatedAt(s), "3405")
		const decision = {
			field: "phone" as const,
			value: "62 00 00 00",
			sourceUrl: BV,
			decision: "accept" as const,
			decidedOn: "2026-11-07",
		}
		await writeCuratedFile(curatedAt(s), {
			...curated,
			units: curated.units.map((u) => ({ ...u, decisions: [decision] })),
		})
		touchAhead(lockPath(s.dataDir, "3405"))
		expect(await resume(s)).toEqual({ todo: ["3405"], skipped: [] })
		// The re-run lock records the file with my answer, so the next resume skips.
		expect(await resume(s)).toEqual({ todo: [], skipped: ["3405"] })
	})

	it("re-runs a kommune when the NKLM edition changes or a national file appears", async () => {
		const s = await verified()
		expect((await resume(s, "2026-11-01")).todo).toEqual(["3405"])
		expect((await resume(s, "2026-11-01")).skipped).toEqual(["3405"])
		writeJsonAtomic(extractionPath(s.cacheDir, "national"), {
			scope: "national",
			extractedAt: NOW,
			pages: [],
		})
		expect((await resume(s, "2026-11-01")).todo).toEqual(["3405"])
	})

	it("never skips without a lock, with a lock that does not parse, or with a failed lock", async () => {
		const s = verifySetup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		const inputs = lockInputs({ ...where(s), kommune: "3405" })
		expect(canSkip(s.dataDir, "3405", inputs)).toBe(false)
		await writeFailedLock(s.dataDir, s.input.kommune, undefined, inputs)
		expect(canSkip(s.dataDir, "3405", inputs)).toBe(false)
		writeFileSync(lockPath(s.dataDir, "3405"), "{ Kari Nordmann")
		expect(canSkip(s.dataDir, "3405", inputs)).toBe(false)
	})

	it("keeps a kommune with no extraction file in the run, so the run still names it", () => {
		const s = verifySetup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		const other = { ...s.input.kommune, kommune: "3407" }
		expect(splitResume([other], where(s))).toEqual({ todo: [other], skipped: [] })
	})
})

describe("fetchSettled", () => {
	const kommune = () => verifySetup({ pages: { [BV]: UNIT_PAGE } }).input.kommune
	const HOST = "www.eksempel.kommune.no"
	const skippedBv = { ok: false as const, url: BV, reason: "hostSkipped" as const }

	it("is settled when the crawl report lists every page as not fetched", () => {
		const stopped = { host: HOST, requests: 3, delayMs: 5_000, stopped: "timeout" as const }
		expect(fetchSettled(kommune(), { hosts: [stopped], notFetched: [skippedBv] })).toBe(true)
		const refused = { ok: false as const, url: BV, reason: "robots" as const }
		expect(fetchSettled(kommune(), { hosts: [], notFetched: [refused] })).toBe(true)
	})

	it("is not settled when a page is neither cached nor listed, as a fetch stopped with Ctrl+C leaves it", () => {
		expect(fetchSettled(kommune(), { hosts: [], notFetched: [] })).toBe(false)
		expect(fetchSettled(kommune(), undefined)).toBe(false)
	})

	it("is not settled by a stale hostSkipped line, when a resumed run cleared the host's stop", () => {
		const running = { host: HOST, requests: 4, delayMs: 5_000 }
		expect(fetchSettled(kommune(), { hosts: [running], notFetched: [skippedBv] })).toBe(false)
	})

	it("is settled when every page redirected to the www twin and the twin stopped", () => {
		const twin = { host: "eksempel.kommune.no", requests: 1, delayMs: 5_000 }
		const lasting = { ...twin, stopped: "crawlDelayTooLong" as const }
		const running = { host: HOST, requests: 1, delayMs: 5_000 }
		expect(fetchSettled(kommune(), { hosts: [running, lasting], notFetched: [skippedBv] })).toBe(
			true
		)
		expect(fetchSettled(kommune(), { hosts: [running, twin], notFetched: [skippedBv] })).toBe(false)
	})

	it("is settled for a kommune with no pages to fetch", () => {
		expect(fetchSettled({ ...kommune(), pages: [] }, undefined)).toBe(true)
	})
})
