// Extracts field values from the pages fetch cached, into <cache>/extract/, and prints counts.
//   node src/cli/extract.ts [--only pilot|3405,0301] [--national] [--cache <dir>] [--offline] [--dry-run]
import { join } from "node:path"
import { parseArgs } from "node:util"
import { DiscoverError } from "../discover/discover.ts"
import { readDiscovery } from "../discover/files.ts"
import { formatExtractSummary, runExtract, type ScopeInput } from "../extract/extract.ts"
import { readCrawlReport } from "../fetch/fetchPages.ts"
import { DEFAULT_CACHE_DIR, PageCache } from "../io/pageCache.ts"
import { CacheBusyError, holdCache } from "../io/runLock.ts"
import { recordTiming } from "../io/timings.ts"
import { parseOnly, selects } from "../pilot/list.ts"
import { isNavOfficeUrl } from "../registers/nav.ts"

const USAGE =
	"usage: extract [--only pilot|3405,0301] [--national] [--cache <dir>] [--offline] [--dry-run]"

const { values } = parseArgs({
	options: {
		only: { type: "string" },
		national: { type: "boolean", default: false },
		cache: { type: "string" },
		offline: { type: "boolean", default: false },
		"dry-run": { type: "boolean", default: false },
	},
})
const only = parseOnly(values.only)
if (only === undefined) {
	console.error(USAGE)
	process.exit(2)
}

const root = values.cache ?? DEFAULT_CACHE_DIR
const dryRun = values["dry-run"]
const started = Date.now()
// One process at a time in the page cache: a fetch running now would change the pages under me.
let held: { release: () => void } | undefined
try {
	held = holdCache(join(root, "pages"))
} catch (err) {
	console.error(
		err instanceof CacheBusyError ? err.message : "extract could not take the page cache"
	)
	process.exit(2)
}
process.on("SIGINT", () => {
	held?.release()
	process.exit(130)
})
try {
	const found = readDiscovery(join(root, "discover"))
	const cache = new PageCache(join(root, "pages"), { dryRun: true })
	const places = found.kommuner.map((k) => k.name)
	const now = new Date(started).toISOString().replace(/\.\d{3}Z$/, "Z")
	const scopes: ScopeInput[] = found.kommuner
		.filter((k) => selects(only, k.kommune))
		.map((k) => ({
			scope: k.kommune,
			name: k.name,
			urls: k.pages.map((p) => p.url),
			ctx: k.site === undefined ? { places } : { places, kommuneHost: k.site.host },
		}))
	if (values.national) {
		scopes.push({
			scope: "national",
			urls: found.national.pages.map((p) => p.url).filter(isNavOfficeUrl),
			ctx: { places },
		})
	}
	// Offline, a page fetch recorded as not fetched is no miss: the run before never had it either.
	const reportPath = join(root, "pages", "report.json")
	const notFetched = new Set((readCrawlReport(reportPath)?.notFetched ?? []).map((n) => n.url))
	// Each scope is written whole or not at all, and one that stops never stops the next.
	const result = runExtract({
		root,
		scopes,
		cache,
		now,
		nowMs: started,
		dryRun,
		offline: values.offline,
		notFetched,
		onDone: (scope, at, of) => console.log(`extract: ${scope} done (${at} of ${of})`),
	})
	if (result.purged !== undefined) console.log(`extraction files purged: ${result.purged}`)
	console.log(formatExtractSummary(result.summaries))
	// Local only: --offline runs on my PC, and a miss must name what it missed.
	for (const miss of result.misses) console.error(miss)
	if (result.failed.length > 0) {
		console.error(
			`extract stopped on ${result.failed.length} of ${scopes.length} scopes; their old files are unchanged`
		)
		console.error(`not finished: ${result.failed.join(", ")}`)
	}
	if (result.failed.length > 0 || result.misses.length > 0) process.exitCode = 1
	if (!dryRun) recordTiming(root, "extract", Date.now() - started)
} catch (err) {
	// The message only: an unexpected error's text could quote a page.
	console.error(
		err instanceof DiscoverError ? err.message : "extract stopped on an unexpected error"
	)
	process.exitCode = 1
} finally {
	held?.release()
}
