import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { ErrorState } from "../src/components/ErrorState.tsx"
import { LanguageProvider } from "../src/i18n/LanguageProvider.tsx"

afterEach(() => {
	vi.restoreAllMocks()
	window.history.replaceState(null, "", "/")
})

// Every request fails — the state the API's cold start or an outage puts the app in.
function stubApiDown() {
	return vi
		.spyOn(globalThis, "fetch")
		.mockImplementation(() => Promise.reject(new TypeError("Failed to fetch")))
}

test("error state carries only the Legevakt fallback as a tel link and a working retry", async () => {
	const onRetry = vi.fn()
	const user = userEvent.setup()
	render(
		<LanguageProvider initialLang="nb">
			<ErrorState onRetry={onRetry} />
		</LanguageProvider>
	)
	// The other national lines (110/112/113) already sit in the strip above every page —
	// repeating them here would be noise. Legevakt is the one number worth repeating.
	expect(screen.queryByRole("link", { name: /116 123/ })).not.toBeInTheDocument()
	expect(screen.getByRole("link", { name: /116 117/ })).toHaveAttribute("href", "tel:116117")
	expect(screen.queryByRole("link", { name: /116 111/ })).not.toBeInTheDocument()
	await user.click(screen.getByRole("button", { name: "Prøv igjen" }))
	expect(onRetry).toHaveBeenCalledTimes(1)
})

test("catalog and resources both failing shows one error state whose retry refetches both", async () => {
	const fetchMock = stubApiDown()
	const user = userEvent.setup()
	// "/" is the landing now, which loads no data — exercise the list at /sok instead.
	window.history.pushState(null, "", "/sok")
	render(<App />)
	await waitFor(() =>
		expect(screen.getAllByRole("heading", { name: "Noe gikk galt" })).toHaveLength(1)
	)
	const before = fetchMock.mock.calls.map((call) => String(call[0]))
	await user.click(screen.getByRole("button", { name: "Prøv igjen" }))
	await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(before.length))
	const after = fetchMock.mock.calls.slice(before.length).map((call) => String(call[0]))
	expect(after.some((url) => url.includes("/api/municipalities"))).toBe(true)
	expect(after.some((url) => url.includes("/api/resources"))).toBe(true)
})

test("a failed fetch is announced in the live region instead of leaving 'Laster …' standing", async () => {
	stubApiDown()
	// "/" is the landing now, which loads no data — exercise the list at /sok instead.
	window.history.pushState(null, "", "/sok")
	render(<App />)
	const region = document.querySelector("[aria-live]")
	expect(region).not.toBeNull()
	await waitFor(() => expect(region).toHaveTextContent("Noe gikk galt"))
})
