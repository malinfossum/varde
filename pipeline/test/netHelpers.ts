import type { Clock } from "../src/net/clock.ts"
import type { CrawlResult, Get, Kind } from "../src/net/crawler.ts"
import { NetError, type RawResponse, type Transport } from "../src/net/types.ts"

// 12:00 UTC on 03.11.2026: outside frivilligsentral.no's visiting hours.
export const T_NOON = Date.parse("2026-11-03T12:00:00Z")

// Time moves only when the code under test sleeps, so every wait is recorded and exact.
export class FakeClock implements Clock {
	t: number
	readonly sleeps: number[] = []

	constructor(start: number = T_NOON) {
		this.t = start
	}

	now(): number {
		return this.t
	}

	async sleep(ms: number): Promise<void> {
		this.sleeps.push(ms)
		this.t += ms
	}
}

type Reply = RawResponse | NetError
export type Route = Reply | ((call: number) => Reply)

function response(
	status: number,
	contentType: string,
	body: string | Buffer,
	headers: Record<string, string> = {}
): RawResponse {
	return {
		status,
		headers: { "content-type": contentType, ...headers },
		body: typeof body === "string" ? Buffer.from(body) : body,
	}
}
export const html = (body: string, status = 200, headers: Record<string, string> = {}) =>
	response(status, "text/html; charset=utf-8", body, headers)
export const xml = (body: string) => response(200, "application/xml", body)
export const json = (body: unknown, headers: Record<string, string> = {}) =>
	response(200, "application/json;charset=UTF-8", JSON.stringify(body), headers)
export const text = (body: string, status = 200) => response(status, "text/plain", body)
export const redirect = (location: string, status = 301): RawResponse => ({
	status,
	headers: { location },
	body: Buffer.alloc(0),
})

// A web of fixed answers. A URL without a route answers 404, so a host with no robots.txt
// route has no rules, as RFC 9309 reads a 404.
export function fakeWeb(routes: Record<string, Route>) {
	const calls: string[] = []
	const transport: Transport = async (url) => {
		calls.push(url.href)
		const route = routes[url.href]
		const call = calls.filter((c) => c === url.href).length
		const reply = typeof route === "function" ? route(call) : route
		if (reply === undefined) return html("Fant ikke siden", 404)
		if (reply instanceof NetError) throw reply
		return reply
	}
	return { transport, calls }
}

// A get() that answers from a table of bodies, for readers that do not need the crawler.
export function fakeGet(
	routes: Record<string, { body: string; contentType?: string; headers?: Record<string, string> }>
): Get {
	return async (url: string, _kind: Kind): Promise<CrawlResult> => {
		const route = routes[url]
		if (route === undefined) return { ok: false, url, reason: "httpStatus", status: 404 }
		return {
			ok: true,
			url,
			finalUrl: url,
			status: 200,
			contentType: route.contentType ?? "application/json",
			headers: route.headers ?? {},
			body: route.body,
			fetchedAt: "2026-11-03T12:00:00Z",
		}
	}
}
