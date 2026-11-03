import { existsSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import type { z } from "zod"
import { writeJsonAtomic } from "../io/files.ts"
import type { HostEntry } from "../sources/hosts.ts"
import { DiscoverError, type DiscoverRun } from "./discover.ts"
import { DiscoverReport, HostFile, KommuneDiscovery, NationalDiscovery } from "./types.ts"

export type DiscoveryFiles = {
	report: DiscoverReport
	hosts: HostEntry[]
	kommuner: KommuneDiscovery[]
	national: NationalDiscovery
}

// The old report goes first and the new one last, so a write that stops halfway leaves no
// report at all, and fetch and recall-report refuse to read a mix of two runs. Each file is
// written whole or not at all.
export function writeDiscovery(
	dir: string,
	run: DiscoverRun,
	report: DiscoverReport,
	hosts: readonly HostEntry[]
): void {
	rmSync(join(dir, "report.json"), { force: true })
	for (const k of run.kommuner) writeJsonAtomic(join(dir, "kommuner", `${k.kommune}.json`), k)
	writeJsonAtomic(join(dir, "national.json"), run.national)
	writeJsonAtomic(join(dir, "hosts.json"), hosts)
	writeJsonAtomic(join(dir, "report.json"), report)
}

// Messages name the file only; a parse error would quote its text.
function read<S extends z.ZodType>(schema: S, dir: string, name: string): z.output<S> {
	const path = join(dir, name)
	if (!existsSync(path)) throw new DiscoverError(`${name} is missing: run discover first`)
	let data: unknown
	try {
		data = JSON.parse(readFileSync(path, "utf8"))
	} catch {
		throw new DiscoverError(`${name} is not valid JSON`)
	}
	const parsed = schema.safeParse(data)
	if (!parsed.success) throw new DiscoverError(`${name} does not match its schema`)
	return parsed.data
}

export function readDiscovery(dir: string): DiscoveryFiles {
	const report = read(DiscoverReport, dir, "report.json")
	return {
		report,
		hosts: read(HostFile, dir, "hosts.json"),
		national: read(NationalDiscovery, dir, "national.json"),
		kommuner: report.kommuner.map((code) => read(KommuneDiscovery, dir, `kommuner/${code}.json`)),
	}
}
