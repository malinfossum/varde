import { act, screen } from "@testing-library/react"
import { StrictMode } from "react"
import { hydrateRoot } from "react-dom/client"
import { afterEach, expect, test, vi } from "vitest"
import { App } from "../src/App.tsx"
import { render } from "../src/entry-server.tsx"
import { UrlContext } from "../src/navigation.ts"
import { type PageData, PageDataContext } from "../src/pageData.ts"
import { clearIndexCache } from "../src/services/data.ts"
import { stubDataFiles } from "./stubData.ts"

const resource = {
	id: 12,
	name: "NAV Hamar",
	description: "Økonomisk rådgivning",
	isFallbackTranslation: false,
	openingHours: null,
	isNational: false,
	isAlwaysOpen: false,
	municipalityId: 1,
	municipalityName: "Hamar",
	address: null,
	phone: "12345678",
	email: null,
	website: null,
	chatUrl: null,
	lastVerified: "2026-08-17",
	categories: [],
	servedMunicipalityIds: [],
}
const hamar = { id: 1, slug: "hamar", name: "Hamar", county: "Innlandet" }

afterEach(() => {
	clearIndexCache()
	vi.unstubAllGlobals()
	document.body.innerHTML = ""
})

// A Suspense boundary that resolves can still be "outlined" — written out-of-band with a
// completion <template> plus an inline <script>$RC(...)</script> that moves it into place —
// whenever the shell plus that boundary's bytes cross Fizz's byte budget, or the boundary has
// "suspensey content". index.html's CSP is script-src 'self' with no inline scripts, so an
// outlined boundary's real content would sit inert until React hydrates and replaces it
// client-side — the exact regression prerendering exists to avoid. No inline <script>, no
// out-of-band <template>, and no leftover "<!--$?-->" pending marker: none of the six routes
// below may ship a page whose real content depends on a script the CSP blocks.
function assertNoOutlinedBoundary(html: string) {
	expect(html).not.toContain("<script")
	expect(html).not.toContain("<template")
	expect(html).not.toContain("<!--$?-->")
}

// R10: wait for the page's h1 to appear before reading `errors` so lazy chunks and Suspense
// have settled — a late recoverable error from a chunk that resolves after `act` returns
// would otherwise land after this function has already returned an empty array.
async function hydrate(url: string, data: PageData) {
	stubDataFiles({
		resources: [resource],
		kommuner: [hamar],
		municipalities: [{ id: 1, name: "Hamar", county: "Innlandet" }],
	})
	const { html } = await render(url, data)
	expect(html.length).toBeGreaterThan(200)
	assertNoOutlinedBoundary(html)
	document.body.innerHTML = `<div id="root">${html}</div>`
	const { pathname, search } = new URL(url, "http://localhost")
	window.history.pushState(null, "", `${pathname}${search}`)
	const errors: unknown[] = []
	await act(async () => {
		hydrateRoot(
			document.getElementById("root") as HTMLElement,
			<StrictMode>
				<UrlContext.Provider value={{ pathname, search }}>
					<PageDataContext.Provider value={data}>
						<App />
					</PageDataContext.Provider>
				</UrlContext.Provider>
			</StrictMode>,
			{ onRecoverableError: (error) => errors.push(error) }
		)
	})
	await screen.findByRole("heading", { level: 1 })
	return errors
}

test.each([
	["/", {}],
	["/en/", {}],
	["/sok", {}],
	["/resources/12", { resource }],
	["/en/resources/12", { resource }],
	["/kommune/hamar", { kommune: { entry: hamar, local: [resource], national: [] } }],
])("%s hydrates without a recoverable error", async (url, data) => {
	expect(await hydrate(url, data as PageData)).toEqual([])
})

test("the resource page bakes the resource into the HTML", async () => {
	const { html, head } = await render("/resources/12", { resource })
	expect(html).toContain("NAV Hamar")
	expect(html).toContain('href="tel:12345678"')
	assertNoOutlinedBoundary(html)
	expect(head).toEqual({
		title: "NAV Hamar – Varde",
		description: "Økonomisk rådgivning",
		path: "/resources/12",
		lang: "nb",
	})
})

test("the prerendered resource page works before JavaScript", async () => {
	const { html } = await render("/resources/12", { resource })
	expect(html).toContain('href="tel:12345678"')
	expect(html).toMatch(/<a[^>]+href="https:\/\/www\.google\.com"[^>]*>Forlat siden<\/a>/)
	expect(html).toContain('href="/en/resources/12"')
})
