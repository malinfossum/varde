// Fetches the pages discover listed into <cache>/pages/, with a manifest, and prints counts.
//   node src/cli/fetch.ts [--only 3405,0301] [--national] [--limit 3] [--cache <dir>] [--dry-run]
import { join } from "node:path"
import { parseArgs } from "node:util"
import { DiscoverError } from "../discover/discover.ts"
import { readDiscovery } from "../discover/files.ts"
import { fetchPages, formatFetchSummary, pagesToFetch } from "../fetch/fetchPages.ts"
import { writeJsonAtomic } from "../io/files.ts"
import { DEFAULT_CACHE_DIR, PageCache } from "../io/pageCache.ts"
import { AllowList } from "../net/allowList.ts"
import { systemClock } from "../net/clock.ts"
import { Crawler } from "../net/crawler.ts"
import { httpsTransport } from "../net/http.ts"

const USAGE = "usage: fetch [--only 3405,0301] [--national] [--limit N] [--cache <dir>] [--dry-run]"

const { values } = parseArgs({
	options: {
		only: { type: "string" },
		national: { type: "boolean", default: false },
		limit: { type: "string" },
		cache: { type: "string" },
		"dry-run": { type: "boolean", default: false },
	},
})
const only = (values.only ?? "")
	.split(",")
	.map((p) => p.trim())
	.filter((p) => p !== "")
const limit = values.limit === undefined ? undefined : Number(values.limit)
if (
	only.some((p) => !/^\d{2}(?:\d{2})?$/.test(p)) ||
	(limit !== undefined && (!Number.isInteger(limit) || limit < 1))
) {
	console.error(USAGE)
	process.exit(2)
}

const root = values.cache ?? DEFAULT_CACHE_DIR
const dryRun = values["dry-run"]
try {
	const found = readDiscovery(join(root, "discover"))
	const kommuner = found.kommuner.filter(
		(k) => only.length === 0 || only.some((p) => k.kommune.startsWith(p))
	)
	const urls = pagesToFetch(kommuner, values.national ? found.national : undefined, limit)
	// A selection that matches nothing must not purge the cache or overwrite the last report.
	if (urls.length === 0) {
		console.error("nothing to fetch for this selection: pages/report.json was left as it was")
		process.exit(2)
	}
	const allowList = AllowList.restore(found.hosts)
	const cache = new PageCache(join(root, "pages"), { dryRun })
	cache.purge(Date.now())
	const crawler = new Crawler({ transport: httpsTransport, clock: systemClock, allowList })
	const summary = await fetchPages(crawler.get, cache, urls)
	cache.save()
	if (!dryRun) writeJsonAtomic(join(root, "pages", "report.json"), crawler.report())
	console.log(formatFetchSummary(summary, crawler.report()))
} catch (err) {
	// The message only: an unexpected error's text could quote a response.
	console.error(err instanceof DiscoverError ? err.message : "fetch stopped on an unexpected error")
	process.exit(1)
}
