import { lookup as dnsLookup } from "node:dns/promises"
import { request } from "node:https"
import { guardedLookup } from "./address.ts"
import { decode, readCapped } from "./body.ts"
import {
	MAX_BYTES,
	NetError,
	type RawResponse,
	TIMEOUT_MS,
	type Transport,
	USER_AGENT,
} from "./types.ts"

const lookup = guardedLookup((hostname) => dnsLookup(hostname, { all: true, verbatim: true }))

function toNetError(err: unknown): NetError {
	if (err instanceof NetError) return err
	if ((err as { code?: unknown } | null)?.code === "EPRIVATE") return new NetError("privateAddress")
	return new NetError("network")
}

// The only code in the pipeline that opens a socket. One GET, no redirect followed (the
// crawler checks every hop), HTTPS only, private addresses refused at connect time, 30
// seconds for the whole exchange and 5 MB for the body, packed or unpacked. Tests never
// import this file; they use a fake transport.
export const httpsTransport: Transport = (url, accept) =>
	new Promise<RawResponse>((resolve, reject) => {
		if (url.protocol !== "https:") {
			reject(new NetError("network"))
			return
		}
		let timedOut = false
		const fail = (err: unknown) => reject(timedOut ? new NetError("timeout") : toNetError(err))
		const req = request(
			url,
			{
				method: "GET",
				lookup,
				headers: { "user-agent": USER_AGENT, accept, "accept-encoding": "gzip, br, deflate" },
			},
			(res) => {
				const headers: Record<string, string> = {}
				for (const [name, value] of Object.entries(res.headers)) {
					if (value !== undefined) {
						headers[name.toLowerCase()] = Array.isArray(value) ? value.join(", ") : value
					}
				}
				readCapped(res, MAX_BYTES)
					.then((raw) => decode(raw, headers["content-encoding"], MAX_BYTES))
					.then((body) => resolve({ status: res.statusCode ?? 0, headers, body }))
					.catch((err: unknown) => {
						res.destroy()
						fail(err)
					})
			}
		)
		const timer = setTimeout(() => {
			timedOut = true
			req.destroy()
		}, TIMEOUT_MS)
		req.on("close", () => clearTimeout(timer))
		req.on("error", fail)
		req.end()
	})
