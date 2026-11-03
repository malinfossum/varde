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

	// The first entry for a host wins, so a register or catalogue never turns into a provider.
	// The www twin comes along, since kommune sites redirect between the two.
	add(host: string, kind: HostKind, licence: LicenceStatus): boolean {
		const clean = httpsHost(`https://${host.toLowerCase()}/`)
		if (clean === undefined) return false
		if (kind === "provider" && NOT_PROVIDER_DOMAINS.includes(getDomain(clean) ?? clean)) {
			return false
		}
		for (const h of [clean, wwwTwin(clean)]) {
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
