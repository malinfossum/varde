import { getDomain } from "tldts"
import type { LicenceStatus } from "../gates/types.ts"
import {
	FIXED_HOSTS,
	type HostEntry,
	type HostKind,
	NOT_PROVIDER_DOMAINS,
} from "../sources/hosts.ts"
import { httpsHost } from "../text/normalise.ts"

export function wwwTwin(host: string): string {
	return host.startsWith("www.") ? host.slice(4) : `www.${host}`
}

const byHost = (a: HostEntry, b: HostEntry) => (a.host < b.host ? -1 : a.host > b.host ? 1 : 0)

// The hosts the crawler may reach, each with its kind and licence. Registers and catalogues
// come first; discover adds kommune sites and provider sites it finds.
export class AllowList {
	readonly #hosts = new Map<string, HostEntry>()

	constructor(entries: readonly HostEntry[] = FIXED_HOSTS) {
		for (const e of entries) this.add(e.host, e.kind, e.licence)
	}

	// The allow-list fetch rebuilds from the hosts file discover wrote. Registers and catalogues
	// come from FIXED_HOSTS only: a file in the cache folder can add a kommune or a provider,
	// never a host with a register's lenient robots.txt or a catalogue's licence.
	static restore(entries: readonly HostEntry[]): AllowList {
		const list = new AllowList()
		for (const e of entries) {
			if (e.kind === "kommune" || e.kind === "provider") list.add(e.host, e.kind, e.licence)
		}
		return list
	}

	// The first entry for a host wins, so a register or catalogue never turns into a provider.
	// The www twin comes along, since kommune sites redirect between the two. A register gets
	// no twin: Malin's ruling of 03.11.2026 names its exact hosts, and the register kind carries
	// a lenient robots.txt read.
	add(host: string, kind: HostKind, licence: LicenceStatus): boolean {
		const clean = httpsHost(`https://${host.toLowerCase()}/`)
		if (clean === undefined) return false
		if (kind === "provider" && NOT_PROVIDER_DOMAINS.includes(getDomain(clean) ?? clean)) {
			return false
		}
		for (const h of kind === "register" ? [clean] : [clean, wwwTwin(clean)]) {
			if (httpsHost(`https://${h}/`) !== undefined && !this.#hosts.has(h)) {
				this.#hosts.set(h, { host: h, kind, licence })
			}
		}
		return true
	}

	has(host: string): boolean {
		return this.#hosts.has(host.toLowerCase())
	}

	get(host: string): HostEntry | undefined {
		return this.#hosts.get(host.toLowerCase())
	}

	licence(host: string): LicenceStatus | undefined {
		return this.get(host)?.licence
	}

	entries(): HostEntry[] {
		return [...this.#hosts.values()].sort(byHost)
	}
}
