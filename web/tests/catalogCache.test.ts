import { afterEach, expect, test, vi } from "vitest"
import { clearCatalogCache, loadCatalog, prefetchCatalog } from "../src/services/catalogCache.ts"

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

afterEach(() => {
	vi.restoreAllMocks()
	clearCatalogCache()
})

test("two loads for one language share one pair of requests", async () => {
	const fetchSpy = vi
		.spyOn(globalThis, "fetch")
		.mockImplementation((input) =>
			Promise.resolve(ok(String(input).includes("municipalities") ? [] : []))
		)
	await Promise.all([loadCatalog("nb"), loadCatalog("nb")])
	expect(fetchSpy).toHaveBeenCalledTimes(2) // municipalities + categories, once
	await loadCatalog("en")
	expect(fetchSpy).toHaveBeenCalledTimes(4)
})

test("prefetch fills the cache so a later load makes no request", async () => {
	// A Response body can only be read once — mockImplementation gives each of the two
	// concurrent fetches (municipalities, categories) its own instance instead of one shared
	// object that the second .json() call would find already consumed.
	const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(() => Promise.resolve(ok([])))
	prefetchCatalog("nb")
	await loadCatalog("nb")
	expect(fetchSpy).toHaveBeenCalledTimes(2)
})

test("a failure is not cached", async () => {
	const fetchSpy = vi
		.spyOn(globalThis, "fetch")
		.mockImplementationOnce(() => Promise.resolve(new Response(null, { status: 500 })))
		.mockImplementation(() => Promise.resolve(ok([])))
	await expect(loadCatalog("nb")).rejects.toThrow()
	await loadCatalog("nb")
	expect(fetchSpy.mock.calls.length).toBeGreaterThanOrEqual(3)
})
