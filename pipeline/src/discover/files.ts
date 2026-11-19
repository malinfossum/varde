import { existsSync, readFileSync, rmSync } from "node:fs"
import { join } from "node:path"
import type { z } from "zod"
import { writeJsonAtomic } from "../io/files.ts"
import { type HostEntry, isUnsafeHost } from "../sources/hosts.ts"
import { isCareOfAddress } from "../text/address.ts"
import { httpsHost } from "../text/normalise.ts"
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

const onUnsafeHost = (url: string) => isUnsafeHost(httpsHost(url) ?? url)

// The unsafe lists in src/sources/hosts.ts grow from what fetch finds, so a host can turn unsafe
// after discover wrote its files. Fetch, extract, verify and score all read the files through
// here, so they come back as discover would write them today: no page on such a host, and no
// unit with it as its website. The cached page stays in the cache, unread, until it expires.
function withoutUnsafeHosts(k: KommuneDiscovery): KommuneDiscovery {
	return {
		...k,
		pages: k.pages.filter((p) => !onUnsafeHost(p.url)),
		units: k.units.map((u) => {
			if (u.website === undefined || !onUnsafeHost(u.website)) return u
			const { website: _unsafe, ...rest } = u
			return rest
		}),
	}
}

// Discover stored an address in someone's care until the Brreg reader dropped it, and the name
// on that line is a person's. Read through here, a unit in an older file comes back without it.
function withoutCareOfAddresses(k: KommuneDiscovery): KommuneDiscovery {
	return {
		...k,
		units: k.units.map((u) => {
			if (u.address === undefined || !isCareOfAddress(u.address)) return u
			const { address: _inCare, ...rest } = u
			return rest
		}),
	}
}

export function readDiscovery(dir: string): DiscoveryFiles {
	const report = read(DiscoverReport, dir, "report.json")
	const national = read(NationalDiscovery, dir, "national.json")
	return {
		report,
		hosts: read(HostFile, dir, "hosts.json"),
		national: { ...national, pages: national.pages.filter((p) => !onUnsafeHost(p.url)) },
		kommuner: report.kommuner.map((code) =>
			withoutCareOfAddresses(
				withoutUnsafeHosts(read(KommuneDiscovery, dir, `kommuner/${code}.json`))
			)
		),
	}
}
