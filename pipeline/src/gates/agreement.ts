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
// direct line.
export const agreementGate: Gate = (c, ctx) => {
	const key = (p: Candidate): string => {
		if (p.field === "address" && typeof p.value === "string") {
			const hit = ctx.findAddress(p.value)
			if (hit !== undefined) return `id:${hit.addressId}`
		}
		return comparable(p.field, p.value)
	}
	const mine = sourceKey(c)
	const others = ctx.peers.filter(
		(p) =>
			p !== c &&
			p.unitId === c.unitId &&
			p.field === c.field &&
			(p.role ?? "") === (c.role ?? "") &&
			sourceKey(p) !== mine
	)
	if (others.length === 0) return pass("agreement", "single source")
	const value = key(c)
	const disagreeing = others.filter((p) => key(p) !== value).length
	if (disagreeing > 0) return review("agreement", `${disagreeing} other source(s) disagree`)
	return pass("agreement", `${others.length + 1} sources agree`)
}
