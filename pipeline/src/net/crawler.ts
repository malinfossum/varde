import { getDomain } from "tldts"
import { httpsHost } from "../text/normalise.ts"
import type { AllowList } from "./allowList.ts"
import { type Clock, isoSeconds } from "./clock.ts"
import {
	ALLOW_ALL,
	DISALLOW_ALL,
	inVisitWindow,
	type Robots,
	robotsFromResponse,
	type VisitWindow,
} from "./robots.ts"
import {
	DEFAULT_RETRY_MS,
	FLOOR_MS,
	MAX_CRAWL_DELAY_MS,
	MAX_REDIRECTS,
	MAX_RETRY_AFTER_MS,
	NetError,
	type RawResponse,
	type Transport,
} from "./types.ts"

export type Kind = "html" | "xml" | "json" | "text"

export const SKIP_REASONS = [
	"notHttps",
	"notAllowListed",
	"robots",
	"hostSkipped",
	"httpStatus",
	"wrongType",
	"tooLarge",
	"tooManyRedirects",
] as const
export type SkipReason = (typeof SKIP_REASONS)[number]

export const HOST_STOPS = [
	"visitTime",
	"crawlDelayTooLong",
	"retryAfterTooLong",
	"secondTooMany",
	"serverError",
	"timeout",
	"privateAddress",
	"network",
	"robotsUnreachable",
] as const
export type HostStop = (typeof HOST_STOPS)[number]

export type Fetched = {
	ok: true
	url: string
	finalUrl: string
	status: number
	contentType: string
	headers: Readonly<Record<string, string>>
	body: string
	fetchedAt: string
}
export type NotFetched = {
	ok: false
	url: string
	reason: SkipReason
	status?: number
	contentType?: string
}
export type CrawlResult = Fetched | NotFetched
export type Get = (url: string, kind: Kind) => Promise<CrawlResult>

export type HostLine = { host: string; requests: number; stopped?: HostStop }
export type CrawlReport = { hosts: HostLine[]; notFetched: NotFetched[] }

const ACCEPT: Readonly<Record<Kind, string>> = {
	html: "text/html,application/xhtml+xml",
	xml: "application/xml,text/xml",
	json: "application/json",
	text: "text/plain,*/*",
}

const TYPE_FITS: Readonly<Record<Kind, (contentType: string, body: string) => boolean>> = {
	html: (t) => /^(?:text\/html|application\/xhtml\+xml)\b/i.test(t),
	// Sitemaps come typed as XML, as a .gz file the transport unpacked, or untyped.
	xml: (t, body) => /\bxml\b/i.test(t) || /^\s*<(?:\?xml|urlset|sitemapindex)\b/.test(body),
	json: (t) => /\bjson\b/i.test(t),
	text: () => true,
}

// One request at a time per server: www and the bare domain, and every subdomain of one
// registrable domain (the 371 *.frivilligsentral.no sites), share one queue and one pace.
// robots.txt and stops stay per host, as RFC 9309 reads robots.txt per host.
type Queue = { delayMs: number; next: number; tail: Promise<unknown> }

type HostState = {
	queue: Queue
	requests: number
	tooMany: number
	robots?: Promise<Robots>
	stopped?: HostStop
}

export function retryAfterMs(value: string | undefined, nowMs: number): number | undefined {
	if (value === undefined) return undefined
	const trimmed = value.trim()
	if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000
	const at = Date.parse(trimmed)
	return Number.isNaN(at) ? undefined : Math.max(0, at - nowMs)
}

export function decodeText(body: Buffer, contentType: string): string {
	const label = /charset\s*=\s*"?([\w.:-]+)/i.exec(contentType)?.[1] ?? "utf-8"
	try {
		return new TextDecoder(label).decode(body)
	} catch {
		return new TextDecoder("utf-8").decode(body)
	}
}

function parseUrl(raw: string, base?: URL): URL | undefined {
	try {
		return new URL(raw, base)
	} catch {
		return undefined
	}
}

const byHost = ([a]: [string, HostState], [b]: [string, HostState]) => (a < b ? -1 : a > b ? 1 : 0)

// Fetches by every rule in the spec. get() never throws: a URL it does not fetch comes back
// with its reason and is listed in the report.
export class Crawler {
	readonly #transport: Transport
	readonly #clock: Clock
	readonly #allow: AllowList
	readonly #hosts = new Map<string, HostState>()
	readonly #queues = new Map<string, Queue>()
	readonly #notFetched: NotFetched[] = []

	constructor(options: { transport: Transport; clock: Clock; allowList: AllowList }) {
		this.#transport = options.transport
		this.#clock = options.clock
		this.#allow = options.allowList
	}

	readonly get: Get = async (url, kind) => {
		let current = url
		for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
			const step = await this.#step(url, current, kind)
			if (typeof step === "string") {
				current = step
				continue
			}
			if (!step.ok) this.#notFetched.push(step)
			return step
		}
		const tooMany: NotFetched = { ok: false, url, reason: "tooManyRedirects" }
		this.#notFetched.push(tooMany)
		return tooMany
	}

	// A host's robots.txt, read once per run. undefined when the host is off the allow-list
	// or stopped.
	async robots(host: string): Promise<Robots | undefined> {
		const key = host.toLowerCase()
		if (!this.#allow.has(key)) return undefined
		const state = this.#state(key)
		state.robots ??= this.#readRobots(key)
		const robots = await state.robots
		return state.stopped === undefined ? robots : undefined
	}

	report(): CrawlReport {
		const hosts = [...this.#hosts.entries()]
			.sort(byHost)
			.map(
				([host, s]): HostLine =>
					s.stopped === undefined
						? { host, requests: s.requests }
						: { host, requests: s.requests, stopped: s.stopped }
			)
		return { hosts, notFetched: [...this.#notFetched] }
	}

	// One hop. A string is the next URL of a redirect.
	async #step(original: string, current: string, kind: Kind): Promise<CrawlResult | string> {
		const skip = (
			reason: SkipReason,
			extra: { status?: number; contentType?: string } = {}
		): NotFetched => ({ ok: false, url: original, reason, ...extra })
		const target = parseUrl(current)
		if (target === undefined || target.protocol !== "https:") return skip("notHttps")
		// The whole URL is checked, not just its hostname: a port or user info never gets past.
		const host = httpsHost(target.href)
		if (host === undefined || !this.#allow.has(host)) return skip("notAllowListed")
		const robots = await this.robots(host)
		const state = this.#state(host)
		if (robots === undefined || state.stopped !== undefined) return skip("hostSkipped")
		if (robots.visitTime !== undefined && !inVisitWindow(this.#clock.now(), robots.visitTime)) {
			state.stopped ??= "visitTime"
			return skip("hostSkipped")
		}
		if (!robots.allows(target.pathname + target.search)) return skip("robots")
		const res = await this.#request(state, target, ACCEPT[kind], robots.visitTime)
		if (res === "tooLarge") return skip("tooLarge")
		if (typeof res === "string") return skip("hostSkipped")
		const location = res.headers.location
		if (res.status >= 300 && res.status < 400 && location !== undefined) {
			const next = parseUrl(location, target)
			return next === undefined ? skip("httpStatus", { status: res.status }) : next.href
		}
		if (res.status !== 200) return skip("httpStatus", { status: res.status })
		const contentType = res.headers["content-type"] ?? ""
		const body = decodeText(res.body, contentType)
		if (!TYPE_FITS[kind](contentType, body)) {
			return skip("wrongType", { status: res.status, contentType })
		}
		return {
			ok: true,
			url: original,
			finalUrl: target.href,
			status: res.status,
			contentType,
			headers: res.headers,
			body,
			fetchedAt: isoSeconds(this.#clock.now()),
		}
	}

	async #readRobots(host: string): Promise<Robots> {
		const state = this.#state(host)
		// The kind comes from the host asked for, not from where a redirect leads.
		const isRegister = this.#allow.get(host)?.kind === "register"
		let failure: string | undefined
		let url = new URL(`https://${host}/robots.txt`)
		for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
			// A register's failed robots.txt read must not stop any host in the redirect chain.
			const res = await this.#request(
				this.#state(url.hostname),
				url,
				ACCEPT.text,
				undefined,
				isRegister
			)
			if (typeof res === "string") {
				failure = res
				break
			}
			const location = res.headers.location
			if (res.status >= 300 && res.status < 400 && location !== undefined) {
				const next = parseUrl(location, url)
				// Rules come only from an allow-listed HTTPS host; anything else keeps the host out.
				if (
					next === undefined ||
					next.protocol !== "https:" ||
					httpsHost(next.href) === undefined ||
					!this.#allow.has(next.hostname)
				) {
					break
				}
				url = next
				continue
			}
			const contentType = res.headers["content-type"] ?? ""
			const robots = robotsFromResponse(res.status, decodeText(res.body, contentType))
			if (robots === DISALLOW_ALL) break
			const delay = robots.crawlDelayMs ?? 0
			if (delay > MAX_CRAWL_DELAY_MS) {
				state.stopped ??= "crawlDelayTooLong"
				return robots
			}
			this.#pace(state, delay)
			return robots
		}
		// Registers are documented open APIs (NLOD, CC BY), so since 03.11.2026 I treat an
		// unreadable robots.txt there as no rules. Every other limit still applies, Retry-After included.
		if (isRegister && failure !== "retryAfterTooLong") return ALLOW_ALL
		state.stopped ??= "robotsUnreachable"
		return DISALLOW_ALL
	}

	// A server's pace is the slowest any of its hosts asks for, never under the floor.
	#pace(state: HostState, delay: number): void {
		const queue = state.queue
		queue.delayMs = Math.max(queue.delayMs, FLOOR_MS, delay)
		queue.next = Math.max(queue.next, this.#clock.now() + queue.delayMs)
	}

	// One request, with the 429 and 503 rule. A string is why the host stopped, or tooLarge.
	// visitTime is undefined for robots.txt itself, read before the window is known. With
	// keepRunning, a failure comes back with its reason but does not stop the host: only a
	// register's robots.txt read uses it.
	async #request(
		state: HostState,
		url: URL,
		accept: string,
		visitTime?: VisitWindow,
		keepRunning = false
	): Promise<RawResponse | HostStop | "tooLarge"> {
		const stop = (reason: HostStop): HostStop => {
			if (keepRunning) return reason
			state.stopped ??= reason
			return state.stopped
		}
		for (;;) {
			if (state.stopped !== undefined) return state.stopped
			let res: RawResponse | HostStop
			try {
				res = await this.#turn(state, visitTime, () => this.#transport(url, accept))
			} catch (err) {
				const kind = err instanceof NetError ? err.kind : "network"
				if (kind === "tooLarge") return "tooLarge"
				return stop(kind)
			}
			if (typeof res === "string") return res
			if (res.status === 429 || res.status === 503) {
				state.tooMany++
				if (state.tooMany >= 2 && !keepRunning) return stop("secondTooMany")
				const now = this.#clock.now()
				const wait = retryAfterMs(res.headers["retry-after"], now) ?? DEFAULT_RETRY_MS
				// An over-long Retry-After stops the host even when the read is otherwise lenient.
				if (wait > MAX_RETRY_AFTER_MS) {
					state.stopped ??= "retryAfterTooLong"
					return state.stopped
				}
				state.queue.next = Math.max(state.queue.next, now + wait)
				// Only a register's robots.txt read gets here on the second one: its wait still holds.
				if (state.tooMany >= 2) return "secondTooMany"
				continue
			}
			if (res.status >= 500) return stop("serverError")
			return res
		}
	}

	// One request at a time per server, each starting no sooner than the server's delay after
	// the one before it ended. Servers do not wait for each other. A request may wait in the
	// queue while its host stops or its visiting hours end, so both are checked again when its
	// turn comes. A turn that sends nothing leaves the pace as it was for the rest of the queue.
	#turn<T>(
		state: HostState,
		visitTime: VisitWindow | undefined,
		work: () => Promise<T>
	): Promise<T | HostStop> {
		const queue = state.queue
		const run = queue.tail.then(async () => {
			if (state.stopped !== undefined) return state.stopped
			const wait = queue.next - this.#clock.now()
			if (wait > 0) await this.#clock.sleep(wait)
			if (state.stopped !== undefined) return state.stopped
			if (visitTime !== undefined && !inVisitWindow(this.#clock.now(), visitTime)) {
				state.stopped = "visitTime"
				return state.stopped
			}
			state.requests++
			try {
				return await work()
			} finally {
				queue.next = this.#clock.now() + queue.delayMs
			}
		})
		queue.tail = run.catch(() => undefined)
		return run
	}

	#state(host: string): HostState {
		const key = host.toLowerCase()
		let state = this.#hosts.get(key)
		if (state === undefined) {
			const server = getDomain(key) ?? key
			let queue = this.#queues.get(server)
			if (queue === undefined) {
				queue = { delayMs: FLOOR_MS, next: 0, tail: Promise.resolve() }
				this.#queues.set(server, queue)
			}
			state = { queue, requests: 0, tooMany: 0 }
			this.#hosts.set(key, state)
		}
		return state
	}
}
