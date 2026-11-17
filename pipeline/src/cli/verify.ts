// Runs the five gates on what extract found and writes lock and curated files into --data. The
// repo's own data/ is a valid target: PR 4 commits the pilot there.
//   node src/cli/verify.ts --data <dir> [--only pilot|3405,0301] [--cache <dir>]
//     [--nklm-file <path>] [--nklm-fetch] [--resume] [--offline] [--dry-run]
import { join, resolve } from "node:path"
import { parseArgs } from "node:util"
import { DataBusyError, holdDataDir, SaveError } from "../curate/write.ts"
import { DiscoverError } from "../discover/discover.ts"
import { readDiscovery } from "../discover/files.ts"
import { readExtraction } from "../extract/extract.ts"
import { readCrawlReport } from "../fetch/fetchPages.ts"
import { AddressCache } from "../io/addressCache.ts"
import { writeJsonAtomic } from "../io/files.ts"
import { offlineGet } from "../io/offline.ts"
import { DEFAULT_CACHE_DIR, PageCache } from "../io/pageCache.ts"
import { CacheBusyError, holdCache } from "../io/runLock.ts"
import { recordTiming } from "../io/timings.ts"
import { AllowList } from "../net/allowList.ts"
import { systemClock } from "../net/clock.ts"
import { Crawler, type Get } from "../net/crawler.ts"
import { httpsTransport } from "../net/http.ts"
import { parseOnly, selects } from "../pilot/list.ts"
import { fetchNklm, kommuneLookup, loadNklm, readNklm } from "../registers/nklm.ts"
import type { LockFailure } from "../schema/lock.ts"
import {
	failedCounts,
	failedKind,
	fetchSettled,
	ownSiteStopTransient,
	TRANSIENT_KINDS,
	writeFailedLock,
} from "../verify/failed.ts"
import { lockInputs, splitResume } from "../verify/resume.ts"
import {
	findCuratedPath,
	formatUnfinished,
	formatVerifySummary,
	readCuratedFile,
	VerifyError,
	verifyAndWrite,
	verifyEach,
	verifyKommune,
} from "../verify/verify.ts"

const USAGE =
	"usage: verify --data <dir> [--only pilot|3405,0301] [--cache <dir>] [--nklm-file <path>] [--nklm-fetch] [--resume] [--offline] [--dry-run]"

const { values } = parseArgs({
	options: {
		data: { type: "string" },
		only: { type: "string" },
		cache: { type: "string" },
		"nklm-file": { type: "string" },
		"nklm-fetch": { type: "boolean", default: false },
		resume: { type: "boolean", default: false },
		offline: { type: "boolean", default: false },
		"dry-run": { type: "boolean", default: false },
	},
})
const only = parseOnly(values.only)
// Offline nothing is fetched, so --nklm-fetch with --offline asks for two opposite things.
if (values.data === undefined || only === undefined || (values.offline && values["nklm-fetch"])) {
	console.error(USAGE)
	process.exit(2)
}
const dataDir = resolve(values.data)
const root = values.cache ?? DEFAULT_CACHE_DIR
const dryRun = values["dry-run"]
const offline = values.offline
const started = Date.now()
const now = new Date(started).toISOString().replace(/\.\d{3}Z$/, "Z")

// One writer at a time in the data folder (a review running now would lose my answers), and one
// process at a time in the page cache (a fetch running now would change the pages under me).
let held: { release: () => void } | undefined
let cacheHeld: { release: () => void } | undefined
const releaseAll = () => {
	held?.release()
	cacheHeld?.release()
}
try {
	cacheHeld = holdCache(join(root, "pages"))
	held = dryRun ? undefined : holdDataDir(dataDir)
} catch (err) {
	releaseAll()
	console.error(
		err instanceof DataBusyError || err instanceof CacheBusyError
			? err.message
			: "verify could not take the data folder or the page cache"
	)
	process.exit(2)
}
process.on("SIGINT", () => {
	releaseAll()
	process.exit(130)
})
try {
	const found = readDiscovery(join(root, "discover"))
	const allowList = AllowList.restore(found.hosts)
	// Offline no crawler exists: every lookup answers from the caches, and a miss names itself.
	const get: Get = offline
		? offlineGet
		: new Crawler({ transport: httpsTransport, clock: systemClock, allowList }).get
	const cache = new PageCache(join(root, "pages"), { dryRun: true })
	const addressCache = new AddressCache(join(root, "kartverket"), { offline, dryRun })
	// Kartverket answers are keyed by page text, so they age out like the pages. Offline nothing
	// expires.
	if (!offline && !dryRun)
		console.log(`Kartverket answers purged: ${addressCache.purge(Date.now())}`)
	const nklmDir = join(root, "nklm")
	if (values["nklm-fetch"]) {
		const fetched = await fetchNklm(get, nklmDir, now)
		console.log(
			fetched.ok
				? `NKLM file fetched (${fetched.changed ? "changed" : "unchanged"})`
				: `NKLM: ${fetched.reason}`
		)
	}
	const bytes = loadNklm(nklmDir, values["nklm-file"])
	const read =
		bytes === undefined
			? undefined
			: readNklm(
					bytes,
					kommuneLookup(found.kommuner.map((k) => ({ code: k.kommune, name: k.name })))
				)
	console.log(
		read === undefined
			? "NKLM: not used (no file)"
			: read.ok
				? `NKLM: ${read.rows.length} rows from the ${read.date} edition, ${read.unknownKommuner} kommune names not placed`
				: `NKLM: not used (${read.reason})`
	)
	const nklm = read?.ok === true ? { date: read.date, rows: read.rows } : undefined
	const nklmDate = nklm === undefined ? {} : { nklmDate: nklm.date }
	const national = readExtraction(root, "national")
	const report = readCrawlReport(join(root, "pages", "report.json"))
	const kommuner = found.kommuner.filter((k) => selects(only, k.kommune))
	const { todo, skipped } = values.resume
		? splitResume(kommuner, { cacheDir: root, dataDir, ...nklmDate })
		: { todo: kommuner, skipped: [] }
	if (values.resume)
		console.log(
			`resume: ${skipped.length} of ${kommuner.length} kommuner skipped, their inputs unchanged`
		)
	const failed: { kommune: string; failure: LockFailure }[] = []
	// One kommune that stops never stops the next: the summary prints the ones done, then names
	// the ones not finished.
	const { counts, missing, unfinished } = await verifyEach(
		todo,
		async (k) => {
			const extraction = readExtraction(root, k.kommune)
			if (extraction === undefined) return undefined
			const inputs = lockInputs({ cacheDir: root, dataDir, kommune: k.kommune, ...nklmDate })
			// Nothing came through: the lock says why, with no units, and the curated file keeps my
			// answers. Only when the crawl report settles every page: after a fetch stopped with
			// Ctrl+C the kommune is not finished, gets no lock, and score refuses it as never run.
			if (extraction.pages.length === 0) {
				if (!fetchSettled(k, report)) {
					throw new VerifyError(
						`${k.kommune}: fetch did not settle every page: run fetch --resume, extract, then verify`
					)
				}
				const failure = dryRun
					? failedKind(k, report)
					: await writeFailedLock(dataDir, k, report, inputs)
				failed.push({ kommune: k.kommune, failure })
				return failedCounts(k)
			}
			const curatedAt = findCuratedPath(dataDir, k.kommune)
			const input = {
				kommune: k,
				extraction,
				...(national === undefined ? {} : { national }),
				manifest: cache.entries(),
				readHtml: (e: Parameters<typeof cache.read>[0]) => cache.read(e),
				allowList,
				validKommuner: new Set(found.report.kommuner),
				places: found.kommuner.map((x) => x.name),
				get,
				addressCache,
				...(nklm === undefined ? {} : { nklm }),
				...(curatedAt === undefined ? {} : { curated: readCuratedFile(curatedAt, k.kommune) }),
				now,
			}
			return dryRun ? (await verifyKommune(input)).counts : verifyAndWrite(dataDir, input, inputs)
		},
		(k, at, of) => console.log(`verify: ${k.kommune} ${k.name} done (${at} of ${of})`)
	)
	console.log(formatVerifySummary(counts))
	if (missing.length > 0)
		console.log(`No extraction file (run extract first): ${missing.join(", ")}`)
	if (failed.length > 0)
		console.log(
			`Nothing came through, so the lock has no units and its reason: ${failed
				.map((f) => `${f.kommune} ${f.failure.kind}`)
				.join(", ")}`
		)
	// A host that stopped halfway leaves a kommune with some pages: its lock is normal and the rest
	// is missing. score refuses one whose own site stopped this way (Task 10).
	const cut = kommuner.filter(
		(k) => !failed.some((f) => f.kommune === k.kommune) && ownSiteStopTransient(k, report)
	)
	if (cut.length > 0)
		console.log(
			`Pages missing after a timeout, a network error or a server error: run fetch --resume, extract and verify --resume before score for ${cut
				.map((k) => k.kommune)
				.join(", ")}`
		)
	const transient = failed.filter((f) => TRANSIENT_KINDS.includes(f.failure.kind))
	if (transient.length > 0)
		console.log(
			`Stopped by a timeout, a network error or a server error, so score refuses them: run fetch --resume, extract and verify again for ${transient
				.map((f) => f.kommune)
				.join(", ")}`
		)
	// A resumed run verifies only some kommuner, so its counts and its time would replace the full
	// run's with a part of it. Only a full run writes them.
	if (!dryRun && !values.resume) {
		writeJsonAtomic(join(root, "verify-stats.json"), {
			lookups: addressCache.lookups,
			hits: addressCache.hits,
		})
		recordTiming(root, "verify", Date.now() - started)
	}
	if (unfinished.length > 0) {
		console.error(formatUnfinished(unfinished))
		process.exitCode = 1
	}
} catch (err) {
	const known =
		err instanceof DiscoverError || err instanceof VerifyError || err instanceof SaveError
	console.error(known ? err.message : "verify stopped on an unexpected error")
	process.exitCode = 1
} finally {
	releaseAll()
}
