import { render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, test, vi } from "vitest"
import { useResources } from "../src/hooks/useResources.ts"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"
import type { Filters } from "../src/services/urlState.ts"

const emptyFilters: Filters = {
	search: "",
	categories: [],
	municipality: null,
	national: false,
	page: 1,
}

function page(names: string[]) {
	return {
		items: names.map((name, index) => ({ id: index + 1, name })),
		page: 1,
		pageSize: 20,
		totalCount: names.length,
	}
}

function Probe({ filters }: { filters: Filters }) {
	const { state } = useResources(filters, "nb", 0)
	if (state.kind !== "ready") return <p>{state.kind}</p>
	return (
		<ul>
			{state.data.items.map((r) => (
				<li key={r.id}>{r.name}</li>
			))}
		</ul>
	)
}

afterEach(() => vi.restoreAllMocks())

test("a superseded request resolving late never overwrites the current result", async () => {
	const first = Promise.withResolvers<Response>()
	const second = Promise.withResolvers<Response>()
	const fetchMock = vi
		.spyOn(globalThis, "fetch")
		.mockImplementationOnce((_url, init) => {
			// When the effect cleans up it aborts this request; reject like a real fetch would.
			init?.signal?.addEventListener("abort", () =>
				first.reject(new DOMException("Aborted", "AbortError"))
			)
			return first.promise
		})
		.mockImplementationOnce(() => second.promise)

	const { rerender } = render(
		<LanguageProvider initialLang="nb">
			<Probe filters={{ ...emptyFilters, search: "kri" }} />
		</LanguageProvider>
	)
	await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

	rerender(
		<LanguageProvider initialLang="nb">
			<Probe filters={{ ...emptyFilters, search: "krisesenter" }} />
		</LanguageProvider>
	)
	await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

	// Second (current) response lands first…
	second.resolve(new Response(JSON.stringify(page(["Krisesenteret"])), { status: 200 }))
	await screen.findByText("Krisesenteret")

	// …then the stale one tries to land. It must change nothing.
	first.resolve(new Response(JSON.stringify(page(["Stale"])), { status: 200 }))
	await waitFor(() => expect(screen.queryByText("Stale")).not.toBeInTheDocument())
	expect(screen.getByText("Krisesenteret")).toBeInTheDocument()
})
