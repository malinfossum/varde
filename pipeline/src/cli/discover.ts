// Lists candidate units and pages for the kommuner asked for, from KLASS, Brreg, kommune
// sitemaps, nav.no and the catalogues. Writes to <cache>/discover/ and prints counts only.
//   node src/cli/discover.ts --only pilot|34,0301 [--date 2026-11-03] [--cache <dir>] [--dry-run]
import { join } from "node:path"
import { parseArgs } from "node:util"
import { DiscoverError, discover, formatDiscoverSummary } from "../discover/discover.ts"
import { writeDiscovery } from "../discover/files.ts"
import type { DiscoverReport } from "../discover/types.ts"
import { AddressCache } from "../io/addressCache.ts"
import { DEFAULT_CACHE_DIR, PageCache } from "../io/pageCache.ts"
import { CacheBusyError, holdCache } from "../io/runLock.ts"
import { recordTiming } from "../io/timings.ts"
import { AllowList } from "../net/allowList.ts"
import { isoSeconds, systemClock } from "../net/clock.ts"
import { Crawler } from "../net/crawler.ts"
import { httpsTransport } from "../net/http.ts"
import { parseOnly } from "../pilot/list.ts"

const USAGE = "usage: discover --only pilot|34,0301 [--date YYYY-MM-DD] [--cache <dir>] [--dry-run]"

const { values } = parseArgs({
	options: {
		only: { type: "string" },
		date: { type: "string" },
		cache: { type: "string" },
		"dry-run": { type: "boolean", default: false },
	},
})
const only = parseOnly(values.only)
const date = values.date ?? isoSeconds(Date.now()).slice(0, 10)
if (only === undefined || only.length === 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
	console.error(USAGE)
	process.exit(2)
}

const allowList = new AllowList()
const crawler = new Crawler({ transport: httpsTransport, clock: systemClock, allowList })
const started = Date.now()
try {
	const run = await discover({
		get: crawler.get,
		robots: (host) => crawler.robots(host),
		allowList,
		date,
		only,
		now: () => isoSeconds(Date.now()),
		onKommune: (kommune, name, at, of) =>
			console.log(`discover: ${kommune} ${name} done (${at} of ${of})`),
	})
	const crawl = crawler.report()
	const report: DiscoverReport = {
		ranAt: isoSeconds(Date.now()),
		date,
		only,
		kommuner: run.kommuner.map((k) => k.kommune),
		renumberings: run.renumberings,
		nameMismatches: run.nameMismatches,
		problems: run.problems,
		hosts: crawl.hosts,
		notFetched: crawl.notFetched,
	}
	if (!values["dry-run"]) {
		const root = values.cache ?? DEFAULT_CACHE_DIR
		// The cache lock comes before the discovery files are replaced: a fetch, extract or verify
		// running now reads them. It also holds the purge, since save() empties the page journal.
		const held = holdCache(join(root, "pages"))
		try {
			writeDiscovery(join(root, "discover"), run, report, allowList.entries())
			recordTiming(root, "discover", Date.now() - started)
			// Every run that starts with discover clears raw pages and Kartverket answers past their
			// age, even when fetch is not run for a while.
			const pages = new PageCache(join(root, "pages"))
			pages.purge(Date.now())
			pages.save()
			new AddressCache(join(root, "kartverket")).purge(Date.now())
		} finally {
			held.release()
		}
	}
	console.log(formatDiscoverSummary(run, report))
} catch (err) {
	// The message only: an unexpected error's text could quote a response.
	console.error(
		err instanceof DiscoverError || err instanceof CacheBusyError
			? err.message
			: "discover stopped on an unexpected error"
	)
	process.exit(1)
}
