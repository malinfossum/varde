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
		// Found while writing the hydration guard: prerender()'s default progressiveChunkSize
		// (~12.8 KB) is the byte budget for the "shell" — once the header/strip/footer markup
		// around a route's <Suspense> boundary crosses it, prerender() gives up on that boundary
		// instead of waiting for its lazy chunk, and hands back the fallback with a "$?" marker
		// (confirmed on /sok: reproduced with plain, hook-free filler past ~13 KB, and with
		// react-dom/server's renderToReadableStream too, so it isn't a react-dom/static quirk).
		// One page's full HTML is far under 1 MB, so this keeps every boundary in the one shell.
		{ progressiveChunkSize: 1_000_000 }
	)
	return { html: await new Response(prelude).text(), head }
}
