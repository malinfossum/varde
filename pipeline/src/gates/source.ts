import { drop, type Gate, pass } from "./types.ts"

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
	const licence = ctx.licence(host)
	if (licence === undefined) return drop("source", `no licence status recorded for ${host}`)
	if (licence === "pending") {
		return drop("source", `${host} is a catalogue without a licence yet: cross-check only`)
	}
	return pass("source")
}
