import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { useCatalog } from "../src/hooks/useCatalog.ts"
import { loadIndex } from "../src/services/data.ts"
import { stubDataFiles } from "./stubData.ts"

afterEach(() => vi.restoreAllMocks())

test("derives municipalities and categories from loadIndex", async () => {
	stubDataFiles({
		municipalities: [{ id: 1, name: "Hamar", county: "Innlandet" }],
		categories: [{ id: 4, slug: "rus", name: "Rus", isFallbackTranslation: false }],
	})

	const { result } = renderHook(() => useCatalog("nb"))

	await waitFor(() => expect(result.current.state.kind).toBe("ready"))
	if (result.current.state.kind === "ready") {
		expect(result.current.state.catalog.municipalities).toEqual([
			{ id: 1, name: "Hamar", county: "Innlandet" },
		])
		expect(result.current.state.catalog.categories).toEqual([
			{ id: 4, slug: "rus", name: "Rus", isFallbackTranslation: false },
		])
	}
})

// Back to /sok mounts the list page again. Its scroll is restored in that first commit, so a
// filter column still waiting for its chips would grow under the restored spot a moment later.
test("is ready on its first render when the index has already settled", async () => {
	stubDataFiles({
		categories: [{ id: 4, slug: "rus", name: "Rus", isFallbackTranslation: false }],
	})
	await loadIndex("nb")

	const { result } = renderHook(() => useCatalog("nb"))

	expect(result.current.state.kind).toBe("ready")
	if (result.current.state.kind === "ready") {
		expect(result.current.state.catalog.categories).toHaveLength(1)
	}
})

test("retry() re-fetches after a failed load and can succeed", async () => {
	// One fetch mock spanning both attempts so the call count is comparable across them — a
	// failed attempt calls all four data files, and the retry after a success flip must call
	// them again (the fetch call count grows).
	let fail = true
	const files: Record<string, unknown> = {
		"/data/resources.nb.json": [],
		"/data/municipalities.json": [{ id: 1, name: "Hamar", county: "Innlandet" }],
		"/data/categories.nb.json": [],
		"/data/kommuner.json": [],
	}
	const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
		if (fail) return new Response("", { status: 500 })
		const path = new URL(String(input), "http://localhost").pathname
		return new Response(JSON.stringify(files[path] ?? []), { status: 200 })
	})
	vi.stubGlobal("fetch", fetchMock)

	const { result } = renderHook(() => useCatalog("nb"))

	await waitFor(() => expect(result.current.state.kind).toBe("error"))
	expect(fetchMock).toHaveBeenCalledTimes(4)

	fail = false
	act(() => result.current.retry())

	await waitFor(() => expect(result.current.state.kind).toBe("ready"))
	expect(fetchMock.mock.calls.length).toBeGreaterThan(4)
	if (result.current.state.kind === "ready") {
		expect(result.current.state.catalog.municipalities).toHaveLength(1)
	}
})
