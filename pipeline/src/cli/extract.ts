// Extracts field values from the pages fetch cached, into <cache>/extract/, and prints counts.
//   node src/cli/extract.ts [--only 3405,0301] [--national] [--cache <dir>] [--dry-run]
import { join } from "node:path"
import { parseArgs } from "node:util"
import { DiscoverError } from "../discover/discover.ts"
import { readDiscovery } from "../discover/files.ts"
import {
	extractionPath,
	extractScopes,
	formatExtractSummary,
	purgeExtractions,
	type ScopeInput,
} from "../extract/extract.ts"
import { writeJsonAtomic } from "../io/files.ts"
import { DEFAULT_CACHE_DIR, PageCache } from "../io/pageCache.ts"
import { isNavOfficeUrl } from "../registers/nav.ts"

const USAGE = "usage: extract [--only 3405,0301] [--national] [--cache <dir>] [--dry-run]"

const { values } = parseArgs({
	options: {
		only: { type: "string" },
		national: { type: "boolean", default: false },
		cache: { type: "string" },
		"dry-run": { type: "boolean", default: false },
	},
})
const only = (values.only ?? "")
	.split(",")
	.map((p) => p.trim())
	.filter((p) => p !== "")
if (only.some((p) => !/^\d{2}(?:\d{2})?$/.test(p))) {
	console.error(USAGE)
	process.exit(2)
}

const root = values.cache ?? DEFAULT_CACHE_DIR
try {
	const found = readDiscovery(join(root, "discover"))
	const cache = new PageCache(join(root, "pages"), { dryRun: true })
	const places = found.kommuner.map((k) => k.name)
	const now = new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
	const scopes: ScopeInput[] = found.kommuner
		.filter((k) => only.length === 0 || only.some((p) => k.kommune.startsWith(p)))
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
	if (!values["dry-run"])
		console.log(`extraction files purged: ${purgeExtractions(root, Date.now())}`)
	// Each scope is written whole or not at all, and one that stops never stops the next.
	const { summaries, failed } = extractScopes(scopes, cache, now, (scope, file) => {
		if (!values["dry-run"]) writeJsonAtomic(extractionPath(root, scope), file)
	})
	console.log(formatExtractSummary(summaries))
	if (failed.length > 0) {
		console.error(
			`extract stopped on ${failed.length} of ${scopes.length} scopes; their old files are unchanged`
		)
		console.error(`not finished: ${failed.join(", ")}`)
		process.exit(1)
	}
} catch (err) {
	// The message only: an unexpected error's text could quote a page.
	console.error(
		err instanceof DiscoverError ? err.message : "extract stopped on an unexpected error"
	)
	process.exit(1)
}
