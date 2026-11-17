import type { Get } from "../net/crawler.ts"

// A gap PR scores from the local caches only (spec, "Gap PRs score offline"): nothing expires and
// nothing is fetched, so a page or an answer the cache lacks is an error, never a request. what
// names the URL or the search that missed. The message is printed on my own terminal only.
export class OfflineMissError extends Error {
	readonly what: string

	constructor(what: string) {
		super(`offline: not in the cache: ${what}`)
		this.name = "OfflineMissError"
		this.what = what
	}
}

// The get() an offline stage hands on: every request fails and names its URL.
export const offlineGet: Get = (url) => Promise.reject(new OfflineMissError(url))
