import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { useCatalog } from "../src/hooks/useCatalog.ts"

afterEach(() => vi.restoreAllMocks())

function mockFetchOnce(status: number, body: unknown) {
	return Promise.resolve(new Response(body === undefined ? null : JSON.stringify(body), { status }))
}

test("retry() re-fetches after a failed catalog load and can succeed", async () => {
	const fetchMock = vi
		.spyOn(globalThis, "fetch")
		// First attempt: both calls fail.
		.mockImplementationOnce(() => mockFetchOnce(500, undefined))
		.mockImplementationOnce(() => mockFetchOnce(500, undefined))
		// Retry: both calls succeed.
		.mockImplementationOnce(() =>
			mockFetchOnce(200, [{ id: 1, name: "Hamar", county: "Innlandet" }])
		)
		.mockImplementationOnce(() => mockFetchOnce(200, []))

	const { result } = renderHook(() => useCatalog("nb"))

	await waitFor(() => expect(result.current.state.kind).toBe("error"))
	expect(fetchMock).toHaveBeenCalledTimes(2)

	act(() => result.current.retry())

	await waitFor(() => expect(result.current.state.kind).toBe("ready"))
	expect(fetchMock).toHaveBeenCalledTimes(4)
	if (result.current.state.kind === "ready") {
		expect(result.current.state.catalog.municipalities).toHaveLength(1)
	}
})
