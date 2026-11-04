import type { Get } from "../net/crawler.ts"

// The parsed JSON body of one URL, or undefined when the fetch failed or the body is not JSON.
// The register readers (Brreg, KLASS, Nav, discover) all read their APIs through this.
export async function readJson(get: Get, url: string): Promise<unknown | undefined> {
	const res = await get(url, "json")
	if (!res.ok) return undefined
	try {
		return JSON.parse(res.body)
	} catch {
		return undefined
	}
}
