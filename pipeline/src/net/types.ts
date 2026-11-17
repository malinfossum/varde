// The rules every request follows (spec, "PR 2: discover and fetch").
export const USER_AGENT = "VardeBot/1.0 (+https://varde.pages.dev/om)"
export const FLOOR_MS = 5_000
// A server's own pace where it is not the website floor, keyed by registrable domain as the
// crawler keys its queues. Kartverket's address API (version 1.2.0, read 12.11.2026) needs no
// login and states no rate limit: I hold it to one request a second, one at a time. Every other
// server keeps FLOOR_MS, and a longer Crawl-delay still wins everywhere.
export const PACE_MS: Readonly<Record<string, number>> = Object.freeze({ "kartverket.no": 1_000 })
export const TIMEOUT_MS = 30_000
export const MAX_BYTES = 5 * 1024 * 1024
export const MAX_REDIRECTS = 5
// A host that asks for longer than these is skipped for the run instead of stalling it.
export const MAX_CRAWL_DELAY_MS = 60_000
export const MAX_RETRY_AFTER_MS = 600_000
// A 429 or 503 that names no Retry-After.
export const DEFAULT_RETRY_MS = 60_000

export type RawResponse = {
	status: number
	headers: Readonly<Record<string, string>>
	body: Buffer
}

// One GET to one URL. It follows no redirect: the crawler checks every hop itself.
export type Transport = (url: URL, accept: string) => Promise<RawResponse>

export type NetErrorKind = "timeout" | "tooLarge" | "privateAddress" | "network"

export class NetError extends Error {
	readonly kind: NetErrorKind

	constructor(kind: NetErrorKind) {
		super(kind)
		this.name = "NetError"
		this.kind = kind
	}
}
