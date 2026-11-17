import { type RenameIo, writeLockFile } from "../curate/write.ts"
import type { KommuneDiscovery } from "../discover/types.ts"
import type { CrawlReport } from "../net/crawler.ts"
import type { FailedKind, LockFailure, LockFile, LockInputs } from "../schema/lock.ts"
import { httpsHost } from "../text/normalise.ts"
import { lockPath, type VerifyCounts } from "./verify.ts"

export type { FailedKind }

// The stops a sleeping PC or one bad hour causes. A kommune failed for one of these is not a
// result: score refuses the pilot until fetch --resume has fetched it again. Every other kind is
// lasting and scored as lost recall.
export const TRANSIENT_KINDS: readonly FailedKind[] = ["timeout", "network", "serverError"]

const hostStopped = (host: string, kind: FailedKind): LockFailure => ({
	kind,
	reason: `host stopped: ${kind} (${host})`,
})

// Why nothing came through for a kommune, from the crawl report: its own site's stop first, then
// the first stopped host among its pages' hosts (in the report's host order), then robots when
// robots.txt refused every page, else no pages. Hosts are public; a reason never holds a URL.
export function failedKind(k: KommuneDiscovery, report: CrawlReport | undefined): LockFailure {
	const hosts = report?.hosts ?? []
	const own = k.site?.host.toLowerCase()
	const ownLine = hosts.find((h) => h.host === own)
	if (ownLine?.stopped !== undefined) return hostStopped(ownLine.host, ownLine.stopped)
	const pageHosts = new Set(k.pages.map((p) => httpsHost(p.url)))
	const pageLine = hosts.find((h) => h.stopped !== undefined && pageHosts.has(h.host))
	if (pageLine?.stopped !== undefined) return hostStopped(pageLine.host, pageLine.stopped)
	const refused = new Set(
		(report?.notFetched ?? []).filter((n) => n.reason === "robots").map((n) => n.url)
	)
	if (k.pages.length > 0 && k.pages.every((p) => refused.has(p.url))) {
		return { kind: "robots", reason: "every page refused by robots.txt" }
	}
	return { kind: "noPages", reason: "no pages fetched" }
}

// True when the kommune's own site host stopped for a transient reason. Only that host's line
// counts, never another page host's, so verify names the kommuner score refuses.
export function ownSiteStopTransient(
	k: KommuneDiscovery,
	report: CrawlReport | undefined
): boolean {
	const own = k.site?.host.toLowerCase()
	const stop = report?.hosts.find((h) => h.host === own)?.stopped
	return stop !== undefined && TRANSIENT_KINDS.includes(stop)
}

// Whether the crawl report settles every page of a kommune: each one is listed as not fetched (a
// stop, a refusal, a 404). A fetch stopped with Ctrl+C leaves its remaining URLs in neither the
// cache nor the report, and can leave a stale hostSkipped line: a resumed run that made requests
// cleared the host's stop, then stopped itself. So a hostSkipped line counts only while the
// report's line for that URL's host still carries a stop. A kommune that is not settled is not
// finished: it gets no failed lock. A kommune with no pages to fetch is settled.
export function fetchSettled(k: KommuneDiscovery, report: CrawlReport | undefined): boolean {
	if (k.pages.length === 0) return true
	if (report === undefined) return false
	const stopped = new Set(report.hosts.filter((h) => h.stopped !== undefined).map((h) => h.host))
	const settled = new Set(
		report.notFetched
			.filter((n) => n.reason !== "hostSkipped" || stopped.has(httpsHost(n.url) ?? ""))
			.map((n) => n.url)
	)
	return k.pages.every((p) => settled.has(p.url))
}

// A kommune that came through with no pages still gets a lock: no units, and why.
export function failedLock(kommune: string, failure: LockFailure, inputs: LockInputs): LockFile {
	return { kommune, inputs, failed: failure, units: [] }
}

// Writes the failed lock whole. The curated file is left alone, so my answers survive a run whose
// host stopped.
export async function writeFailedLock(
	dataDir: string,
	k: KommuneDiscovery,
	report: CrawlReport | undefined,
	inputs: LockInputs,
	io: RenameIo = {}
): Promise<LockFailure> {
	const failure = failedKind(k, report)
	await writeLockFile(lockPath(dataDir, k.kommune), failedLock(k.kommune, failure, inputs), io)
	return failure
}

// A failed kommune's line in the summary: zero of everything.
export function failedCounts(k: { kommune: string; name: string }): VerifyCounts {
	return {
		kommune: k.kommune,
		name: k.name,
		units: 0,
		auto: 0,
		inclusionReview: 0,
		accepted: 0,
		review: 0,
		dropped: 0,
		noUnitId: 0,
		unitsWithoutPage: 0,
		nationalUnmatched: 0,
		pagesWithProblem: 0,
		pagesStale: 0,
		foldedParents: 0,
		answersUnsettled: 0,
	}
}
