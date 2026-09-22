// Sibling declaration for prerender.mjs — this project carries no allowJs/@types/node, so a
// plain .mjs import has no type on its own. tests/prerender.test.ts is the only TS consumer.
// Types stay loose (string/object rather than "nb" | "en" literal unions) because the test's
// fixtures build head/data objects with no contextual type, which TS would otherwise widen.
export type PrerenderPage = {
	url: string
	lang: string
	data: Record<string, unknown>
	kommune?: object
	chunk?: string
}
// The shape of dist/.vite/manifest.json that modulepreloadTags reads (Vite writes more).
export type ManifestChunk = { file: string; isEntry?: boolean; imports?: string[] }
export type Manifest = Record<string, ManifestChunk>
export type HeadEntry = { title: string; description: string; path: string; lang: string }
export type RenderResult = { html: string; head: HeadEntry | null }
export type RenderFn = (url: string, data: Record<string, unknown>) => Promise<RenderResult>
export type SplitFn = (entry: object, resources: object[]) => unknown

export type PrerenderOptions = {
	dataDir: string
	distDir: string
	render: RenderFn
	split: SplitFn
	siteOrigin: string
	manifest?: Manifest | null
	log?: (message: string) => void
}
export type PrerenderResult = { pages: string[] }

export declare function escapeJson(value: unknown): string
export declare function jsonLd(
	resource: Record<string, unknown>,
	lang: string,
	siteOrigin: string
): object
export declare function modulepreloadTags(manifest: Manifest | null, key?: string): string
export declare function urlList(
	kommuner: object[],
	resourcesByLang: { nb: object[]; en: object[] }
): PrerenderPage[]
export declare function prerenderSite(options: PrerenderOptions): Promise<PrerenderResult>
