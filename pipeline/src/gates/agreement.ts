import { comparable } from "./compare.ts"
import { type Candidate, type Gate, pass, review } from "./types.ts"

// Two sources are independent when they are different registers, or different hosts.
export function sourceKey(c: Candidate): string {
	if (c.evidence.kind === "register") return `register:${c.evidence.register}`
	try {
		return `host:${new URL(c.sourceUrl).hostname.replace(/^www\./, "")}`
	} catch {
		return `url:${c.sourceUrl}`
	}
}

// Gate 4: independent sources that agree confirm a value; any disagreement goes to me.
// Phone numbers are compared only within one role, so a switchboard never fights a
// direct line. A disagreement counts from any source, the same host included; only
// agreement needs an independent one.
export const agreementGate: Gate = (c, ctx) => {
	const key = (p: Candidate): string => {
		if (p.field === "address" && typeof p.value === "string") {
			const hit = ctx.findAddress(p.value)
			if (hit !== undefined) return `id:${hit.addressId}`
		}
		return comparable(p.field, p.value)
	}
	const peers = ctx.peers.filter(
		(p) =>
			p !== c && p.unitId === c.unitId && p.field === c.field && (p.role ?? "") === (c.role ?? "")
	)
	const value = key(c)
	const disagreeing = peers.filter((p) => key(p) !== value).length
	if (disagreeing > 0) return review("agreement", `${disagreeing} other source(s) disagree`)
	const mine = sourceKey(c)
	const independent = peers.filter((p) => sourceKey(p) !== mine)
	if (independent.length === 0) return pass("agreement", "single source")
	return pass("agreement", `${independent.length + 1} sources agree`)
}
