// Lists candidate units and pages for the kommuner asked for, from KLASS, Brreg, kommune
// sitemaps, nav.no and the catalogues. Writes to <cache>/discover/ and prints counts only.
//   node src/cli/discover.ts --only 34,0301 [--date 2026-11-03] [--cache <dir>] [--dry-run]
import { join } from "node:path"
import { parseArgs } from "node:util"
import { DiscoverError, discover, formatDiscoverSummary } from "../discover/discover.ts"
import { writeDiscovery } from "../discover/files.ts"
import type { DiscoverReport } from "../discover/types.ts"
import { DEFAULT_CACHE_DIR, PageCache } from "../io/pageCache.ts"
import { AllowList } from "../net/allowList.ts"
import { isoSeconds, systemClock } from "../net/clock.ts"
import { Crawler } from "../net/crawler.ts"
import { httpsTransport } from "../net/http.ts"

const USAGE = "usage: discover --only 34,0301 [--date YYYY-MM-DD] [--cache <dir>] [--dry-run]"

const { values } = parseArgs({
	options: {
		only: { type: "string" },
		date: { type: "string" },
		cache: { type: "string" },
		"dry-run": { type: "boolean", default: false },
	},
})
const only = (values.only ?? "")
	.split(",")
	.map((p) => p.trim())
	.filter((p) => p !== "")
const date = values.date ?? isoSeconds(Date.now()).slice(0, 10)
if (
	only.length === 0 ||
	only.some((p) => !/^\d{2}(?:\d{2})?$/.test(p)) ||
	!/^\d{4}-\d{2}-\d{2}$/.test(date)
) {
	console.error(USAGE)
	process.exit(2)
}

const allowList = new AllowList()
const crawler = new Crawler({ transport: httpsTransport, clock: systemClock, allowList })
try {
	const run = await discover({
		get: crawler.get,
		robots: (host) => crawler.robots(host),
		allowList,
		date,
		only,
		now: () => isoSeconds(Date.now()),
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
		writeDiscovery(join(root, "discover"), run, report, allowList.entries())
		// Every run that starts with discover clears raw pages older than 90 days, even when
		// fetch is not run for a while.
		const pages = new PageCache(join(root, "pages"))
		pages.purge(Date.now())
		pages.save()
	}
	console.log(formatDiscoverSummary(run, report))
} catch (err) {
	// The message only: an unexpected error's text could quote a response.
	console.error(
		err instanceof DiscoverError ? err.message : "discover stopped on an unexpected error"
	)
	process.exit(1)
}
