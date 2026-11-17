import type { CrawlReport } from "../net/crawler.ts"
import { compareText } from "./sample.ts"

// The numbers PR 5 sizes its workflows from. They come from the local cache and change with every
// run, so they go in the PR body only, never in the deterministic report.
export type HostScale = { host: string; requests: number; delayMs: number; estimateMs: number }
export type ScaleNumbers = {
	// Slowest first, then by host name.
	hosts: HostScale[]
	slowest?: HostScale
	// Hosts whose estimate is over JOB_LIMIT_MS.
	overJobLimit: string[]
	lockBytes: number
	kartverket?: { lookups: number; hits: number }
	timings: Record<string, number>
}

// A GitHub-hosted job stops after 6 hours.
export const JOB_LIMIT_MS = 6 * 3_600_000

// "8 h 20 min", "2 min 5 s", "5 s": whole seconds, the two largest units that are not zero.
export function formatDuration(ms: number): string {
	const total = Math.round(ms / 1000)
	const h = Math.floor(total / 3600)
	const m = Math.floor((total % 3600) / 60)
	const s = total % 60
	if (h > 0) return m === 0 ? `${h} h` : `${h} h ${m} min`
	if (m > 0) return s === 0 ? `${m} min` : `${m} min ${s} s`
	return `${s} s`
}

// "1,234,567": a comma between each group of three digits, whatever the machine's locale.
export function groupDigits(n: number): string {
	const digits = String(Math.trunc(Math.abs(n)))
	let out = ""
	for (let i = 0; i < digits.length; i++) {
		if (i > 0 && (digits.length - i) % 3 === 0) out += ","
		out += digits.charAt(i)
	}
	return n < 0 ? `-${out}` : out
}

export type ScaleInput = {
	report?: CrawlReport
	lockBytes: number
	stats?: { lookups: number; hits: number }
	timings: Record<string, number>
}

// Each host's time if its requests run one after another at its crawl delay. A host over 6 hours
// cannot finish in one GitHub-hosted job, so PR 5 has to split or resume it.
export function scaleNumbers(o: ScaleInput): ScaleNumbers {
	const hosts = (o.report?.hosts ?? [])
		.map((h) => ({
			host: h.host,
			requests: h.requests,
			delayMs: h.delayMs,
			estimateMs: h.requests * h.delayMs,
		}))
		.sort((a, b) => b.estimateMs - a.estimateMs || compareText(a.host, b.host))
	const [slowest] = hosts
	return {
		hosts,
		...(slowest === undefined ? {} : { slowest }),
		overJobLimit: hosts
			.filter((h) => h.estimateMs > JOB_LIMIT_MS)
			.map((h) => h.host)
			.sort(compareText),
		lockBytes: o.lockBytes,
		...(o.stats === undefined
			? {}
			: { kartverket: { lookups: o.stats.lookups, hits: o.stats.hits } }),
		timings: { ...o.timings },
	}
}
