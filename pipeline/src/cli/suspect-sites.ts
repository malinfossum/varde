// Lists the Brreg websites whose cached page no longer looks like the unit's own: a domain
// that may have changed hands. Prints domains and reasons only, never page text. I look at
// each one before it goes into UNSAFE_DOMAINS (src/sources/hosts.ts).
//   node src/cli/suspect-sites.ts [--cache <dir>] [--all]
import { join } from "node:path"
import { parseArgs } from "node:util"
import { getDomain } from "tldts"
import { STRONG_REASONS, type SuspectReason, suspectReason } from "../check/suspectSites.ts"
import { DiscoverError } from "../discover/discover.ts"
import { readDiscovery } from "../discover/files.ts"
import { DEFAULT_CACHE_DIR, PageCache } from "../io/pageCache.ts"
import { isUnsafeHost } from "../sources/hosts.ts"
import { httpsHost } from "../text/normalise.ts"

const { values } = parseArgs({ options: { cache: { type: "string" }, all: { type: "boolean" } } })

try {
	const root = values.cache ?? DEFAULT_CACHE_DIR
	const found = readDiscovery(join(root, "discover"))
	const cache = new PageCache(join(root, "pages"), { dryRun: true })
	const suspects = new Map<string, { reason: SuspectReason; kommuner: Set<string> }>()
	let checked = 0
	let notCached = 0
	let alreadyUnsafe = 0
	for (const k of found.kommuner) {
		for (const u of k.units) {
			if (u.website === undefined) continue
			const host = httpsHost(u.website)
			if (host === undefined) continue
			if (isUnsafeHost(host)) {
				alreadyUnsafe++
				continue
			}
			const entry = cache.get(u.website)
			const html = entry === undefined ? undefined : cache.read(entry)
			if (entry === undefined || html === undefined) {
				notCached++
				continue
			}
			checked++
			const reason = suspectReason(
				{ name: u.name, orgNumber: u.orgNumber, website: u.website },
				{ finalUrl: entry.finalUrl, html }
			)
			if (reason === undefined) continue
			const domain = getDomain(host) ?? host
			const seen = suspects.get(domain) ?? { reason, kommuner: new Set<string>() }
			seen.kommuner.add(k.kommune)
			suspects.set(domain, seen)
		}
	}
	const rows = [...suspects].sort(([a], [b]) => (a < b ? -1 : 1))
	const strong = rows.filter(([, s]) => STRONG_REASONS.includes(s.reason))
	const weak = rows.filter(([, s]) => !STRONG_REASONS.includes(s.reason))
	const line = ([domain, s]: (typeof rows)[number]) =>
		`${domain}\t${s.reason}\t${[...s.kommuner].sort().join(" ")}`
	console.log(
		`Checked ${checked} Brreg websites (${notCached} not in the cache, ${alreadyUnsafe} already unsafe).`
	)
	console.log(`\nStrong signs, ${strong.length}: look at these first.`)
	for (const r of strong) console.log(line(r))
	console.log(
		`\nWeak signs, ${weak.length}: mostly umbrella sites and redirects. --all lists them.`
	)
	if (values.all) for (const r of weak) console.log(line(r))
} catch (err) {
	console.error(
		err instanceof DiscoverError ? err.message : "suspect-sites stopped on an unexpected error"
	)
	process.exit(1)
}
