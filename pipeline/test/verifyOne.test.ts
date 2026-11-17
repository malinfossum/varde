import { existsSync, readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import type { CrawlReport } from "../src/net/crawler.ts"
import { LockFile } from "../src/schema/lock.ts"
import { RULES_VERSION } from "../src/verify/rules.ts"
import { lockPath, VerifyError } from "../src/verify/verify.ts"
import { verifyOne } from "../src/verify/verifyOne.ts"
import { BV, K, UNIT_PAGE, unit, verifySetup } from "./verifyHelpers.ts"

const GONE = `${K}/ikke-hentet/`
const INPUTS = { extraction: `sha256:${"0".repeat(64)}`, rules: RULES_VERSION }

// A kommune whose extraction holds no pages, and a crawl report that either lists its one page as
// refused by robots.txt (settled) or does not mention it (a fetch stopped with Ctrl+C).
function emptyRun(settled: boolean, dryRun: boolean) {
	const s = verifySetup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
	const report: CrawlReport = {
		hosts: [],
		notFetched: settled ? [{ ok: false, url: GONE, reason: "robots" }] : [],
	}
	return {
		s,
		run: () =>
			verifyOne({
				kommune: { ...s.input.kommune, pages: [{ url: GONE, from: "sitemap" }] },
				extraction: { ...s.input.extraction, pages: [] },
				shared: s.input,
				dataDir: s.dataDir,
				report,
				inputs: INPUTS,
				dryRun,
			}),
	}
}

describe("verifyOne, a kommune with nothing extracted", () => {
	it("stops with an error that names the kommune only, and writes no lock, when the fetch is not settled", async () => {
		const { s, run } = emptyRun(false, false)
		const err: unknown = await run().catch((e: unknown) => e)
		expect(err).toBeInstanceOf(VerifyError)
		expect((err as VerifyError).message).toBe(
			"3405: fetch did not settle every page: run fetch --resume, extract, then verify"
		)
		expect(existsSync(lockPath(s.dataDir, "3405"))).toBe(false)
	})

	it("writes a failed lock with its kind when the fetch is settled", async () => {
		const { s, run } = emptyRun(true, false)
		const { counts, failure } = await run()
		expect(failure).toEqual({ kind: "robots", reason: "every page refused by robots.txt" })
		expect(counts).toMatchObject({ kommune: "3405", units: 0 })
		const lock = LockFile.parse(JSON.parse(readFileSync(lockPath(s.dataDir, "3405"), "utf8")))
		expect(lock.failed).toEqual(failure)
		expect(lock.units).toEqual([])
	})

	it("writes no file in a dry run, settled or not", async () => {
		const settled = emptyRun(true, true)
		const { failure } = await settled.run()
		expect(failure?.kind).toBe("robots")
		expect(existsSync(lockPath(settled.s.dataDir, "3405"))).toBe(false)
		expect(existsSync(settled.s.dataDir)).toBe(false)
		const open = emptyRun(false, true)
		await expect(open.run()).rejects.toBeInstanceOf(VerifyError)
		expect(existsSync(open.s.dataDir)).toBe(false)
	})
})

describe("verifyOne, a kommune with pages", () => {
	it("writes the lock and the curated file, and a dry run writes neither", async () => {
		const real = verifySetup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		const args = (s: typeof real, dryRun: boolean) => ({
			kommune: s.input.kommune,
			extraction: s.input.extraction,
			shared: s.input,
			dataDir: s.dataDir,
			report: undefined,
			inputs: INPUTS,
			dryRun,
		})
		const { counts, failure } = await verifyOne(args(real, false))
		expect(failure).toBeUndefined()
		expect(counts.units).toBe(1)
		expect(existsSync(lockPath(real.dataDir, "3405"))).toBe(true)
		const dry = verifySetup({ pages: { [BV]: UNIT_PAGE }, units: [unit()] })
		expect((await verifyOne(args(dry, true))).counts.units).toBe(1)
		expect(existsSync(dry.dataDir)).toBe(false)
	})
})
