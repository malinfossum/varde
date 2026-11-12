// Walks me through every open review item, one at a time, and writes each answer into the
// curated file at once. Local only: it refuses to run without an interactive terminal.
//   node src/cli/review.ts --data <dir> [--kommune 3405] [--cache <dir>]
import { join, resolve } from "node:path"
import { parseArgs } from "node:util"
import { CuratedWriteError, DataBusyError, holdDataDir } from "../curate/write.ts"
import { DiscoverError } from "../discover/discover.ts"
import { readDiscovery } from "../discover/files.ts"
import { DEFAULT_CACHE_DIR } from "../io/pageCache.ts"
import { AllowList } from "../net/allowList.ts"
import { systemClock } from "../net/clock.ts"
import { Crawler } from "../net/crawler.ts"
import { httpsTransport } from "../net/http.ts"
import { findAddress } from "../registers/kartverket.ts"
import { kommuneArg, ReviewError, readKommuneFiles } from "../review/queue.ts"
import { osloDate, runReview } from "../review/session.ts"

const USAGE = "usage: review --data <dir> [--kommune 3405] [--cache <dir>]"
const { values } = parseArgs({
	options: { data: { type: "string" }, kommune: { type: "string" }, cache: { type: "string" } },
})
if (values.data === undefined) {
	console.error(USAGE)
	process.exit(2)
}
const dataDir = resolve(values.data)
const root = values.cache ?? DEFAULT_CACHE_DIR
const isTTY = process.stdin.isTTY === true && process.stdout.isTTY === true
let held: { release: () => void } | undefined
const controller = new AbortController()
let interrupts = 0
process.on("SIGINT", () => {
	interrupts++
	controller.abort()
	// A second Ctrl+C leaves at once, even in the middle of a live check. Every answer is already
	// saved whole, and a write in flight leaves the old file whole, so nothing is lost.
	if (interrupts > 1) {
		held?.release()
		process.exit(130)
	}
})
try {
	const found = readDiscovery(join(root, "discover"))
	const known = new Set(found.report.kommuner)
	// Checked before the number is used in any path.
	const arg = kommuneArg(values.kommune, known)
	if (!arg.ok)
		throw new ReviewError("--kommune must be a KLASS kommune number the last discover run read")
	// One writer at a time: a verify running now would overwrite my answers. The hold comes before
	// the read, so a verify that finishes in between can never be overwritten by my first save. A
	// run that refuses (no terminal) writes nothing, so it takes no hold.
	held = isTTY ? holdDataDir(dataDir) : undefined
	const files = readKommuneFiles(dataDir, arg.kommune)
	const crawler = new Crawler({
		transport: httpsTransport,
		clock: systemClock,
		allowList: AllowList.restore(found.hosts),
	})
	const result = await runReview(files, {
		input: process.stdin,
		output: process.stdout,
		isTTY,
		// NO_COLOR set to any non-empty value turns colour off (no-color.org).
		color: isTTY && !process.env.NO_COLOR,
		signal: controller.signal,
		today: () => osloDate(),
		checks: {
			findAddress: (address, kommune) => findAddress(crawler.get, address, kommune),
			urlStatus: async (url) => (await crawler.get(url, "html")).status,
			validKommuner: known,
		},
	})
	process.exitCode = result.outcome === "refused" ? 2 : result.outcome === "stopped" ? 1 : 0
} catch (err) {
	const known =
		err instanceof DiscoverError ||
		err instanceof ReviewError ||
		err instanceof CuratedWriteError ||
		err instanceof DataBusyError
	console.error(known ? err.message : "review stopped on an unexpected error")
	process.exitCode = err instanceof DataBusyError || err instanceof ReviewError ? 2 : 1
} finally {
	held?.release()
}
// stdin keeps the process alive after the last answer, so leave on purpose.
process.exit()
