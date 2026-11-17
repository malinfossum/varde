import type { KommuneDiscovery } from "../discover/types.ts"
import type { CrawlReport } from "../net/crawler.ts"
import type { ExtractionFile } from "../schema/extraction.ts"
import type { LockFailure, LockInputs } from "../schema/lock.ts"
import { failedCounts, failedKind, fetchSettled, writeFailedLock } from "./failed.ts"
import {
	findCuratedPath,
	readCuratedFile,
	type VerifyCounts,
	VerifyError,
	type VerifyInput,
	verifyAndWrite,
	verifyKommune,
} from "./verify.ts"

// What every kommune of a run shares: the lookups, the registers and the clock. The kommune, its
// extraction and my curated answers are added per kommune.
export type VerifyShared = Omit<VerifyInput, "kommune" | "extraction" | "curated">

// One kommune, as the verify command runs it. A kommune whose extraction holds no pages gets a
// failed lock saying why, with no units, and its curated file keeps my answers. That happens only
// when the crawl report settles every page: after a fetch stopped with Ctrl+C the kommune is not
// finished, gets no lock, and score refuses it as never run. A dry run writes no file. failure is
// set for a kommune that came through with nothing.
export async function verifyOne(o: {
	kommune: KommuneDiscovery
	extraction: ExtractionFile
	shared: VerifyShared
	dataDir: string
	report: CrawlReport | undefined
	inputs: Omit<LockInputs, "curated">
	dryRun: boolean
}): Promise<{ counts: VerifyCounts; failure?: LockFailure }> {
	const k = o.kommune
	if (o.extraction.pages.length === 0) {
		if (!fetchSettled(k, o.report)) {
			throw new VerifyError(
				`${k.kommune}: fetch did not settle every page: run fetch --resume, extract, then verify`
			)
		}
		const failure = o.dryRun
			? failedKind(k, o.report)
			: await writeFailedLock(o.dataDir, k, o.report, o.inputs)
		return { counts: failedCounts(k), failure }
	}
	const curatedAt = findCuratedPath(o.dataDir, k.kommune)
	const input: VerifyInput = {
		...o.shared,
		kommune: k,
		extraction: o.extraction,
		...(curatedAt === undefined ? {} : { curated: readCuratedFile(curatedAt, k.kommune) }),
	}
	return {
		counts: o.dryRun
			? (await verifyKommune(input)).counts
			: await verifyAndWrite(o.dataDir, input, o.inputs),
	}
}
