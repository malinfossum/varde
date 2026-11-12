import { REGISTER_SOURCES } from "../sources/registers.ts"
import { siteHost } from "../text/normalise.ts"
import { drop, type Gate, type Origin, pass } from "./types.ts"

const OWN_PAGE_ORIGINS: ReadonlySet<Origin> = new Set(["unitContact", "unitPage"])

// Gate 1: the host is allow-listed, robots.txt allows the fetch, and the source's licence
// status is recorded. A catalogue without a yes can find and cross-check, never supply.
export const sourceGate: Gate = (c, ctx) => {
	let url: URL
	try {
		url = new URL(c.sourceUrl)
	} catch {
		return drop("source", "the source URL does not parse")
	}
	if (url.protocol !== "https:") return drop("source", "the source is not HTTPS")
	const host = url.hostname.toLowerCase()
	if (!ctx.allowedHosts.has(host)) return drop("source", `${host} is not on the allow-list`)
	if (!ctx.robotsAllows(c.sourceUrl)) return drop("source", "robots.txt disallows this URL")
	// A reviewed register value still comes from the register's own host, under a licence that
	// is not pending.
	const evidence = c.evidence.kind === "decision" ? c.evidence.original : c.evidence
	if (evidence.kind === "register") {
		// Grounding skips the page check for register evidence, so it must come from the
		// register itself, under a licence that is not pending.
		const register = REGISTER_SOURCES[evidence.register]
		if (host !== register.host) {
			return drop("source", `${evidence.register} evidence from ${host}, not ${register.host}`)
		}
		if (register.licence === "pending") {
			return drop("source", `the ${evidence.register} licence is still pending`)
		}
		return pass("source", `register ${evidence.register} (${register.licence})`)
	}
	const licence = ctx.licence(host)
	if (licence === undefined) return drop("source", `no licence status recorded for ${host}`)
	if (licence === "pending") {
		return drop("source", `${host} is a catalogue without a licence yet: cross-check only`)
	}
	// A catalogue page must never pass for the unit's own page (a krisesenter address, for one).
	if (OWN_PAGE_ORIGINS.has(c.origin) && !ctx.unit.ownHosts.has(siteHost(c.sourceUrl) ?? "")) {
		return drop("source", `${host} is not the unit's own host`)
	}
	return pass("source")
}
