// Sibling declaration for indexnow.mjs, like prerender.d.mts. tests/indexnow.test.ts is the
// only TS consumer.
export type Manifest = Record<string, string>
export type FetchLike = (url: string, init: RequestInit) => Promise<Response>
export type PingOptions = {
	urls: string[]
	origin: string
	key: string
	fetchImpl?: FetchLike
	log?: (message: string) => void
	wait?: (ms: number) => Promise<void>
}
export declare const ENDPOINT: string
export declare const BATCH: number
export declare function findKey(publicDir: string): string
export declare function readManifest(path: string): Manifest
export declare function changedUrls(live: Manifest, next: Manifest, origin: string): string[]
export declare const KEY_TRIES: number
export declare function keyServed(options: {
	origin: string
	key: string
	fetchImpl?: FetchLike
	wait?: (ms: number) => Promise<void>
}): Promise<boolean>
export declare function ping(options: PingOptions): Promise<void>
export declare function main(options: {
	argv: string[]
	env: Record<string, string | undefined>
	fetchImpl?: FetchLike
	log?: (message: string) => void
	wait?: (ms: number) => Promise<void>
	publicDir?: string
}): Promise<void>
