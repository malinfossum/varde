// Runs the five gates on what extract found and writes lock and curated files into --data.
//   node src/cli/verify.ts --data <dir> [--only pilot|3405] [--cache <dir>] [--nklm-file <path>] [--nklm-fetch] [--dry-run]
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { parseArgs } from "node:util"
import { DataBusyError, holdDataDir, isRepoData, SaveError } from "../curate/write.ts"
import { DiscoverError } from "../discover/discover.ts"
import { readDiscovery } from "../discover/files.ts"
import { readExtraction } from "../extract/extract.ts"
import { DEFAULT_CACHE_DIR, PageCache } from "../io/pageCache.ts"
import { AllowList } from "../net/allowList.ts"
import { systemClock } from "../net/clock.ts"
import { Crawler } from "../net/crawler.ts"
import { httpsTransport } from "../net/http.ts"
import { parseOnly, selects } from "../pilot/list.ts"
import { fetchNklm, kommuneLookup, loadNklm, readNklm } from "../registers/nklm.ts"
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
	"usage: verify --data <dir> [--only pilot|3405,0301] [--cache <dir>] [--nklm-file <path>] [--nklm-fetch] [--dry-run]"

const { values } = parseArgs({
	options: {
		data: { type: "string" },
		only: { type: "string" },
		cache: { type: "string" },
		"nklm-file": { type: "string" },
		"nklm-fetch": { type: "boolean", default: false },
		"dry-run": { type: "boolean", default: false },
	},
})
const only = parseOnly(values.only)
if (values.data === undefined || only === undefined) {
	console.error(USAGE)
	process.exit(2)
}
const dataDir = resolve(values.data)
// PR 3 never writes to the repo's own data/ or any folder inside it, in any spelling of the path:
// PR 4 lifts this when it commits the pilot.
const repoData = resolve(fileURLToPath(new URL("../../../data/", import.meta.url)))
if (isRepoData(dataDir, repoData)) {
	console.error("verify does not write to the repo's data/ yet: point --data at another folder")
	process.exit(2)
}

const root = values.cache ?? DEFAULT_CACHE_DIR
const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
// One writer at a time in the data folder: a review running now would lose my answers.
let held: { release: () => void } | undefined
try {
	held = values["dry-run"] ? undefined : holdDataDir(dataDir)
} catch (err) {
	console.error(
		err instanceof DataBusyError ? err.message : "verify could not take the data folder"
	)
	process.exit(2)
}
process.on("SIGINT", () => {
	held?.release()
	process.exit(130)
})
try {
	const found = readDiscovery(join(root, "discover"))
	const allowList = AllowList.restore(found.hosts)
	const crawler = new Crawler({ transport: httpsTransport, clock: systemClock, allowList })
	const cache = new PageCache(join(root, "pages"), { dryRun: true })
	const nklmDir = join(root, "nklm")
	if (values["nklm-fetch"]) {
		const fetched = await fetchNklm(crawler.get, nklmDir, now)
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
	const national = readExtraction(root, "national")
	const kommuner = found.kommuner.filter((k) => selects(only, k.kommune))
	// One kommune that stops never stops the next: the summary prints the ones done, then names
	// the ones not finished.
	const { counts, missing, unfinished } = await verifyEach(kommuner, async (k) => {
		const extraction = readExtraction(root, k.kommune)
		if (extraction === undefined) return undefined
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
			get: crawler.get,
			...(nklm === undefined ? {} : { nklm }),
			...(curatedAt === undefined ? {} : { curated: readCuratedFile(curatedAt, k.kommune) }),
			now,
		}
		return values["dry-run"] ? (await verifyKommune(input)).counts : verifyAndWrite(dataDir, input)
	})
	console.log(formatVerifySummary(counts))
	if (missing.length > 0)
		console.log(`No extraction file (run extract first): ${missing.join(", ")}`)
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
	held?.release()
}
