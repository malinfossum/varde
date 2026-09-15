import { vi } from "vitest"
import type { Index } from "../src/services/data.ts"

const empty: Index = { resources: [], municipalities: [], categories: [], kommuner: [] }

// One fetch stub for every test that needs data: answers the six JSON files the export
// script writes, 404s everything else. Replaces the per-test API stubs from the API era.
// R3: a plain vi.fn() (not vi.stubGlobal's own closure) so tests can assert on call counts,
// e.g. the useCatalog retry test asserting the fetch call count grows.
export function stubDataFiles(fixture: Partial<Index> = {}): void {
	const index = { ...empty, ...fixture }
	const files: Record<string, unknown> = {
		"/data/resources.nb.json": index.resources,
		"/data/resources.en.json": index.resources,
		"/data/municipalities.json": index.municipalities,
		"/data/categories.nb.json": index.categories,
		"/data/categories.en.json": index.categories,
		"/data/kommuner.json": index.kommuner,
	}
	vi.stubGlobal(
		"fetch",
		vi.fn(async (input: RequestInfo | URL) => {
			const path = new URL(String(input), "http://localhost").pathname
			if (path in files) return new Response(JSON.stringify(files[path]), { status: 200 })
			return new Response("not found", { status: 404 })
		})
	)
}
