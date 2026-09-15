import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import type { ResourceDto } from "../src/types/api.ts"

const resourceFor = (lang: "nb" | "en"): ResourceDto[] => [
	{
		id: 1,
		name: lang === "en" ? "Crisis Centre" : "Krisesenteret",
		description: "d",
		isFallbackTranslation: false,
		openingHours: null,
		isNational: false,
		isAlwaysOpen: false,
		municipalityId: null,
		municipalityName: null,
		address: null,
		phone: null,
		email: null,
		website: null,
		chatUrl: null,
		lastVerified: "2026-08-17",
		categories: [],
		servedMunicipalityIds: [],
	},
]

// Deferred per language, so the test controls exactly when each language's index resolves —
// municipalities.json and kommuner.json are shared across languages and resolve immediately.
function stubIndexByLang() {
	const deferred = { nb: Promise.withResolvers<void>(), en: Promise.withResolvers<void>() }
	vi.stubGlobal(
		"fetch",
		vi.fn(async (input: RequestInfo | URL) => {
			const path = new URL(String(input), "http://localhost").pathname
			if (path === "/data/municipalities.json" || path === "/data/kommuner.json") {
				return new Response(JSON.stringify([]), { status: 200 })
			}
			const lang = path.includes(".en.json") ? "en" : "nb"
			await deferred[lang].promise
			const body = path.startsWith("/data/resources.") ? resourceFor(lang) : []
			return new Response(JSON.stringify(body), { status: 200 })
		})
	)
	return deferred
}

afterEach(() => {
	vi.restoreAllMocks()
	window.history.replaceState(null, "", "/")
})

test("a language switch during load never applies the stale language's data", async () => {
	const deferred = stubIndexByLang()
	const user = userEvent.setup()
	window.history.pushState(null, "", "/sok")
	render(<App />)

	// Still loading nb — switch to English before its fetch resolves.
	await screen.findByRole("button", { name: "English" })
	await user.click(screen.getByRole("button", { name: "English" }))

	// The new (current) language's response lands first…
	deferred.en.resolve()
	await screen.findByText("Crisis Centre")

	// …then the superseded nb response tries to land. It must change nothing.
	deferred.nb.resolve()
	await waitFor(() => expect(screen.queryByText("Krisesenteret")).not.toBeInTheDocument())
	expect(screen.getByText("Crisis Centre")).toBeInTheDocument()
})
