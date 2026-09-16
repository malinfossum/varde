import { StrictMode } from "react"
import { prerender } from "react-dom/static"
import { App } from "./App.tsx"
import { HeadContext, type HeadEntry } from "./components/PageHead.tsx"
import { UrlContext } from "./navigation.ts"
import { type PageData, PageDataContext } from "./pageData.ts"

// Re-exported so scripts/prerender.mjs (Task 11) can compute a kommune's local/national split
// from dist-server/entry-server.mjs without importing KommunePage.tsx directly — that file
// pulls in react-aria-components' ComboBox tree, which the prerender script has no use for.
export { splitForKommune } from "./components/KommunePage.tsx"

// Called once per URL by scripts/prerender.mjs. prerender() waits for lazy chunks and
// Suspense, so the code splitting in App.tsx stays. Nothing here may touch window/document.
export async function render(
	url: string,
	data: PageData
): Promise<{ html: string; head: HeadEntry | null }> {
	const { pathname, search } = new URL(url, "http://prerender.invalid")
	let head: HeadEntry | null = null
	const { prelude } = await prerender(
		<StrictMode>
			<HeadContext.Provider
				value={{
					set: (entry) => {
						head = entry
					},
				}}
			>
				<UrlContext.Provider value={{ pathname, search }}>
					<PageDataContext.Provider value={data}>
						<App />
					</PageDataContext.Provider>
				</UrlContext.Provider>
			</HeadContext.Provider>
		</StrictMode>,
		// Found while writing the hydration guard: a Suspense boundary that DOES resolve still
		// gets "outlined" — written out-of-band with a completion <template> plus an inline
		// <script>$RC(...)</script> that moves it into place — whenever the shell plus that
		// boundary's bytes cross progressiveChunkSize (default ~12.8 KB), or the boundary has
		// what Fizz calls "suspensey content". index.html's CSP is script-src 'self' with no
		// inline scripts, so an outlined boundary's real content would sit inert in the page,
		// never moved into place, until React hydrates and replaces it client-side — exactly
		// the SEO/first-paint regression prerendering exists to avoid. Raising the byte budget
		// past any real page's size rules out the size-triggered case (confirmed on /sok, whose
		// header/strip/footer shell crossed the default ~12.8 KB); the hydration guard's
		// `not.toContain("<script")` assertion is what catches the suspensey-content case, on
		// every route, as new ones are added.
		{ progressiveChunkSize: 1_000_000 }
	)
	return { html: await new Response(prelude).text(), head }
}
