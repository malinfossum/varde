// Fetches the pages discover listed into <cache>/pages/, with a manifest, and prints counts.
//   node src/cli/fetch.ts [--only 3405,0301|pilot] [--national] [--limit 3] [--resume] [--cache <dir>] [--dry-run]
// A run without --resume gets a new id in pages/run.json. --resume goes on with that run: it
// skips every page the run stored, and any other page fetched under 24 hours ago, and merges its
// crawl report into the stopped run's. Ctrl+C keeps every page stored so far.
import { randomUUID } from "node:crypto"
import { rmSync } from "node:fs"
import { join } from "node:path"
import { parseArgs } from "node:util"
import { DiscoverError } from "../discover/discover.ts"
import { readDiscovery } from "../discover/files.ts"
import {
	fetchPages,
	formatFetchSummary,
	mergeCrawlReports,
	pagesToFetch,
	readCrawlReport,
	resumeFilter,
	urlsByKommune,
} from "../fetch/fetchPages.ts"
import { KommuneProgress } from "../fetch/progress.ts"
import { AddressCache } from "../io/addressCache.ts"
import { writeJsonAtomic } from "../io/files.ts"
import { DEFAULT_CACHE_DIR, PageCache, readRunId, writeRunId } from "../io/pageCache.ts"
import { CacheBusyError, holdCache } from "../io/runLock.ts"
import { readTimings, recordTiming } from "../io/timings.ts"
import { AllowList } from "../net/allowList.ts"
import { systemClock } from "../net/clock.ts"
import { Crawler } from "../net/crawler.ts"
import { httpsTransport } from "../net/http.ts"
import { parseOnly, selects } from "../pilot/list.ts"

const USAGE =
	"usage: fetch [--only 3405,0301|pilot] [--national] [--limit N] [--resume] [--cache <dir>] [--dry-run]"
const HEARTBEAT_MS = 5 * 60_000

const { values } = parseArgs({
	options: {
		only: { type: "string" },
		national: { type: "boolean", default: false },
		limit: { type: "string" },
		resume: { type: "boolean", default: false },
		cache: { type: "string" },
		"dry-run": { type: "boolean", default: false },
	},
})
const only = parseOnly(values.only)
const limit = values.limit === undefined ? undefined : Number(values.limit)
if (only === undefined || (limit !== undefined && (!Number.isInteger(limit) || limit < 1))) {
	console.error(USAGE)
	process.exit(2)
}

const root = values.cache ?? DEFAULT_CACHE_DIR
const pagesDir = join(root, "pages")
const reportPath = join(pagesDir, "report.json")
const dryRun = values["dry-run"]
const resume = values.resume
const count = (n: number) => n.toLocaleString("en-US")

async function main(selection: readonly string[]): Promise<number> {
	const started = Date.now()
	const found = readDiscovery(join(root, "discover"))
	const kommuner = found.kommuner.filter((k) => selects(selection, k.kommune))
	const urls = pagesToFetch(kommuner, values.national ? found.national : undefined, limit)
	// A selection that matches nothing must not purge the cache or overwrite the last report.
	if (urls.length === 0) {
		console.error("nothing to fetch for this selection: pages/report.json was left as it was")
		return 2
	}
	// A dry run writes nothing, so it needs no lock.
	const held = dryRun ? undefined : holdCache(pagesDir)
	try {
		const runId = resume ? readRunId(pagesDir) : randomUUID()
		if (runId === undefined) {
			console.error("fetch --resume needs pages/run.json: start the run without --resume first")
			return 2
		}
		if (!resume && !dryRun) {
			writeRunId(pagesDir, runId)
			// The report belongs to the run in run.json, so an older run's report never merges in.
			rmSync(reportPath, { force: true })
		}
		const now = Date.now()
		const cache = new PageCache(pagesDir, { dryRun, runId })
		cache.purge(now)
		new AddressCache(join(root, "kartverket"), { dryRun }).purge(now)
		const todo = resume ? resumeFilter(urls, cache, runId, now) : urls
		if (resume) {
			console.log(
				`resume: ${count(urls.length - todo.length)} of ${count(urls.length)} pages already fetched`
			)
		}
		const previous = resume ? readCrawlReport(reportPath) : undefined
		// A resumed run adds its time to the stopped run's, so the timing is the whole fetch.
		const before = resume ? (readTimings(root).fetch ?? 0) : 0
		const crawler = new Crawler({
			transport: httpsTransport,
			clock: systemClock,
			allowList: AllowList.restore(found.hosts),
		})
		const settled: string[] = []
		const merged = () => mergeCrawlReports(previous, crawler.report(), settled)
		const left = new Set(todo)
		const byKommune = new Map(
			[...urlsByKommune(kommuner, limit)].map(([k, list]): [string, string[]] => [
				k,
				list.filter((url) => left.has(url)),
			])
		)
		const names = new Map(kommuner.map((k): [string, string] => [k.kommune, k.name]))
		const progress = new KommuneProgress(byKommune, names, (line) => console.log(line))
		const beat = setInterval(() => progress.heartbeat(), HEARTBEAT_MS)
		beat.unref()
		// The report and the timing are written whether the run ends, stops on an error or is
		// stopped with Ctrl+C, so --resume knows which hosts this run stopped.
		const wrapUp = () => {
			clearInterval(beat)
			if (dryRun) return
			writeJsonAtomic(reportPath, merged())
			recordTiming(root, "fetch", before + Date.now() - started)
		}
		const onStop = () => {
			wrapUp()
			held?.release()
			console.error("fetch stopped: the pages fetched so far are kept. Run fetch --resume to go on")
			process.exit(130)
		}
		process.once("SIGINT", onStop)
		const onPage = (url: string) => {
			settled.push(url)
			progress.page(url)
		}
		const summary = await fetchPages(crawler.get, cache, todo, onPage).finally(() => {
			process.off("SIGINT", onStop)
			wrapUp()
		})
		cache.save()
		console.log(formatFetchSummary(summary, merged()))
		return 0
	} finally {
		held?.release()
	}
}

try {
	process.exitCode = await main(only)
} catch (err) {
	// The message only: an unexpected error's text could quote a response.
	console.error(
		err instanceof DiscoverError || err instanceof CacheBusyError
			? err.message
			: "fetch stopped on an unexpected error"
	)
	process.exitCode = 1
}
